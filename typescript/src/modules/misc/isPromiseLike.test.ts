// oxlint-disable unicorn/no-thenable
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import vm from "node:vm";
import { isPromiseLike } from "./isPromiseLike";
import { $ } from "bun";

type Impl = {
  name: string;
  resolve: (...args: unknown[]) => unknown;
  reject: (...args: unknown[]) => unknown;
};

const libs = [
  { name: "Bluebird", pkg: "bluebird" },
  { name: "Q", pkg: "q" },
  { name: "when.js", pkg: "when" },
  { name: "RSVP", pkg: "rsvp" },
  { name: "es6-promise", pkg: "es6-promise", extract: "Promise" },
  { name: "promise (then/promise)", pkg: "promise" },
  { name: "pinkie", pkg: "pinkie" },
  { name: "lie", pkg: "lie" },
  { name: "zousan", pkg: "zousan" },
  { name: "yaku", pkg: "yaku" },
] as const;

type Lib = (typeof libs)[number];

const isOptionalLib = (lib: unknown): lib is Lib => {
  return (
    typeof lib === "object" &&
    lib !== null &&
    "pkg" in lib &&
    "name" in lib &&
    typeof lib.name === "string" &&
    typeof lib.pkg === "string"
  );
};

let libImplementations: Impl[] = [];

beforeAll(async () => {
  await $`bun add ${libs.map((lib) => lib.pkg)} --save-dev`;
  libImplementations = await loadLibImplementations();
});

afterAll(async () => {
  await $`bun remove ${libs.map((lib) => lib.pkg)} --save-dev`;
});

const defaultImplementations: Impl[] = [
  {
    name: "Native Promise",
    resolve: (v) => Promise.resolve(v),
    reject: (r) => Promise.reject(r),
  },
  {
    name: "Cross-realm Promise (vm)",
    resolve: (v) =>
      vm.runInContext(
        `Promise.resolve(${JSON.stringify(v)})`,
        vm.createContext({}),
      ),
    reject: (r) =>
      vm.runInContext(
        `Promise.reject(${JSON.stringify(r)})`,
        vm.createContext({}),
      ),
  },
];

const loadLibImplementations = async (): Promise<Impl[]> => {
  const getLibImplementation = async (lib: (typeof libs)[number]) => {
    try {
      const P = await import(lib.pkg).then((m) => m.default ?? m.Promise);
      const impl: Impl = {
        name: lib.name,
        resolve: (v) => P.resolve(v),
        reject: (r) => P.reject(r),
      };
      return impl;
    } catch (cause) {
      throw new Error(`Error loading library ${lib.pkg}`, { cause });
    }
  };

  return await Promise.all(libs.map(getLibImplementation));
};

const customThenables: Impl[] = [
  {
    name: "Minimal thenable",
    resolve: (v) => ({ then: (fn: (val: typeof v) => void) => fn(v) }),
    reject: (r) => ({
      then: (_: unknown, rej: (reason: typeof r) => void) => rej(r),
    }),
  },
  {
    name: "Class-based thenable",
    resolve: (v) =>
      new (class {
        private x: typeof v;
        constructor(x: typeof v) {
          this.x = x;
        }
        then(fn: (val: typeof v) => void) {
          fn(this.x);
        }
      })(v),
    reject: (r) =>
      new (class {
        private x: typeof r;
        constructor(x: typeof r) {
          this.x = x;
        }
        then(_: unknown, rej: (reason: typeof r) => void) {
          rej(this.x);
        }
      })(r),
  },
  {
    name: "Async thenable (setTimeout)",
    resolve: (v) => ({
      then: (fn: (val: typeof v) => void) => setTimeout(() => fn(v), 0),
    }),
    reject: (r) => ({
      then: (_: unknown, rej: (reason: typeof r) => void) =>
        setTimeout(() => rej(r), 0),
    }),
  },
  {
    name: "Getter-based then",
    resolve: (v) => ({
      get then() {
        return (fn: (val: typeof v) => void) => fn(v);
      },
    }),
    reject: (r) => ({
      get then() {
        return (_: unknown, rej: (reason: typeof r) => void) => rej(r);
      },
    }),
  },
];

describe("non-promise values", () => {
  const falseCases = [
    ["null", null],
    ["undefined", undefined],
    ["number", 69],
    ["string", "then"],
    ["boolean", true],
    ["symbol", Symbol()],
    ["bigint", BigInt(1)],
    ["Array", [1, 2, 3]],
    ["{foo: string}", { foo: "bar" }],
    ["() => void", () => {}],
    ["{then: string}", { then: "nope" }],
    ["{then: number}", { then: 123 }],
    ["{then: null}", { then: null }],
    ["{then: {}}", { then: {} }],
    ["{then: Array}", { then: [] }],
    ["Date", new Date()],
    ["Map", new Map()],
    ["Set", new Set()],
    ["Error", new Error()],
    ["RegExp", /test/],
    ["ArrayBuffer", new ArrayBuffer(8)],
  ] as const;

  test.each(falseCases)("isPromiseLike(%s) returns false", (_name, value) =>
    expect(isPromiseLike(value)).toBe(false),
  );
});

const doTests = async (_lib: Lib | Impl) =>
  describe.concurrent(_lib.name, () => {
    const lib = {
      ..._lib,
      get impl(): Impl {
        if (isOptionalLib(_lib)) {
          const ximpl = libImplementations.find((i) => i.name === _lib.name);
          if (!ximpl) throw new Error(`Implementation ${lib.name} not loaded`);
          return ximpl;
        }
        return _lib;
      },
    };

    test("resolved is detected", () => {
      expect(isPromiseLike(lib.impl.resolve(69))).toBe(true);
    });

    test("rejected is detected", async () => {
      let p: unknown;
      try {
        const promise = lib.impl.reject("test");
        p = await promise;
        expect(isPromiseLike(promise)).toBe(true);
      } catch (e) {
        p = e;
      }
      expect(isPromiseLike(p)).toBe(false);
    });

    test("resolved value awaits correctly", async () => {
      expect(await lib.impl.resolve("hello")).toBe("hello");
    });

    test("rejected reason throws correctly", async () => {
      const rejectedPromise = lib.impl.reject("fail");
      // Attach no-op catch to suppress unhandled rejection tracking in async libs (e.g. Q)
      // This doesn't consume the rejection - await will still throw
      if (typeof (rejectedPromise as any)?.catch === "function") {
        (rejectedPromise as any).catch(() => {});
      }
      let caught = false;
      let caughtValue: unknown;
      try {
        await rejectedPromise;
      } catch (e) {
        caught = true;
        caughtValue = e;
      }
      expect(caught).toBe(true);
      expect(caughtValue).toBe("fail");
    });
  });

const runSuite = (
  description: string,
  implementations: readonly Lib[] | Impl[],
) => {
  describe(description, () => {
    for (const impl of implementations) {
      doTests(impl);
    }
  });
};

runSuite("Default", defaultImplementations);
runSuite("Library", libs);
runSuite("Custom", customThenables);

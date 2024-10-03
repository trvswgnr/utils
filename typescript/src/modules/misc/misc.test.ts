import { expect, test, describe } from "bun:test";

import { isConstructor, isType, flip, curry } from "./index";

describe("isConstructor", () => {
    // Basic cases
    test("returns true for standard class constructors", () => {
        class TestClass {}
        expect(isConstructor(TestClass)).toBe(true);
    });

    test("returns true for function constructors", () => {
        function FunctionConstructor() {}
        expect(isConstructor(FunctionConstructor)).toBe(true);
    });

    test("returns true for regular functions (they can be called with `new`)", () => {
        function regularFunction() {}
        expect(isConstructor(regularFunction)).toBe(true);
    });

    test("returns false for arrow functions", () => {
        const arrowFunction = () => {};
        expect(isConstructor(arrowFunction)).toBe(false);
    });

    // Built-in constructors
    test("returns true for built-in constructors", () => {
        expect(isConstructor(Object)).toBe(true);
        expect(isConstructor(Array)).toBe(true);
        expect(isConstructor(Function)).toBe(true);
        expect(isConstructor(Date)).toBe(true);
        expect(isConstructor(RegExp)).toBe(true);
        expect(isConstructor(Error)).toBe(true);
    });

    // Edge cases
    test("returns false for null", () => {
        expect(isConstructor(null)).toBe(false);
    });

    test("returns false for undefined", () => {
        expect(isConstructor(undefined)).toBe(false);
    });

    test("returns false for primitive values", () => {
        expect(isConstructor(42)).toBe(false);
        expect(isConstructor("string")).toBe(false);
        expect(isConstructor(true)).toBe(false);
        expect(isConstructor(Symbol("sym"))).toBe(false);
        expect(isConstructor(5n)).toBe(false);
    });

    test("returns false for objects", () => {
        expect(isConstructor({})).toBe(false);
        expect(isConstructor([])).toBe(false);
        expect(isConstructor(new Date())).toBe(false);
    });

    // Special cases
    test("returns false for bound functions", () => {
        function BoundFunction() {}
        const boundFunction = BoundFunction.bind(null);
        expect(isConstructor(boundFunction)).toBe(false);
    });

    test("returns true for class expressions", () => {
        const ClassExpression = class {};
        expect(isConstructor(ClassExpression)).toBe(true);
    });

    test("returns false for generator functions", () => {
        function* generatorFunction() {
            yield;
        }
        expect(isConstructor(generatorFunction)).toBe(false);
    });

    test("returns false for async functions", () => {
        async function asyncFunction() {}
        expect(isConstructor(asyncFunction)).toBe(false);
    });

    test("returns true for Proxy of a constructor", () => {
        class ProxiedClass {}
        const proxy = new Proxy(ProxiedClass, {});
        expect(isConstructor(proxy)).toBe(true);
    });

    // ES6+ features
    test("returns true for classes with static methods", () => {
        class StaticMethodClass {
            static staticMethod() {}
        }
        expect(isConstructor(StaticMethodClass)).toBe(true);
    });

    test("returns true for classes with private fields", () => {
        class PrivateFieldClass {
            #privateField: string = "private";
            get privateField() {
                return this.#privateField;
            }
        }
        expect(isConstructor(PrivateFieldClass)).toBe(true);
    });

    // Potential pitfalls
    test("returns false for functions without prototype", () => {
        const noProtoFunc = Object.assign(() => {}, { prototype: undefined });
        expect(isConstructor(noProtoFunc)).toBe(false);
    });

    test("returns false for objects with a constructor property", () => {
        const fakeConstructor = { constructor: function () {} };
        expect(isConstructor(fakeConstructor)).toBe(false);
    });
});

describe("isType", () => {
    // Primitive types
    test("correctly identifies string", () => {
        expect(isType("string", "hello")).toBe(true);
        expect(isType("string", "")).toBe(true);
        expect(isType("string", 123)).toBe(false);
    });

    test("correctly identifies number", () => {
        expect(isType("number", 123)).toBe(true);
        expect(isType("number", 0)).toBe(true);
        expect(isType("number", NaN)).toBe(true);
        expect(isType("number", Infinity)).toBe(true);
        expect(isType("number", "123")).toBe(false);
    });

    test("correctly identifies boolean", () => {
        expect(isType("boolean", true)).toBe(true);
        expect(isType("boolean", false)).toBe(true);
        expect(isType("boolean", 1)).toBe(false);
    });

    test("correctly identifies symbol", () => {
        expect(isType("symbol", Symbol("test"))).toBe(true);
        expect(isType("symbol", Symbol.for("test"))).toBe(true);
        expect(isType("symbol", "symbol")).toBe(false);
    });

    test("correctly identifies bigint", () => {
        expect(isType("bigint", BigInt(123))).toBe(true);
        expect(isType("bigint", 123n)).toBe(true);
        expect(isType("bigint", 123)).toBe(false);
    });

    test("correctly identifies undefined", () => {
        expect(isType("undefined", undefined)).toBe(true);
        expect(isType("undefined", null)).toBe(false);
    });

    test("correctly identifies null", () => {
        expect(isType("null", null)).toBe(true);
        expect(isType("null", undefined)).toBe(false);
    });

    test("correctly identifies object", () => {
        expect(isType("object", {})).toBe(true);
        expect(isType("object", [])).toBe(true);
        expect(isType("object", new Date())).toBe(true);
        expect(isType("object", null)).toBe(false);
        expect(isType("object", 42)).toBe(false);
    });

    // Constructor types
    class TestClass {}
    test("correctly identifies instances of custom classes", () => {
        expect(isType(TestClass, new TestClass())).toBe(true);
        expect(isType(TestClass, {})).toBe(false);
    });

    test("correctly identifies instances of built-in classes", () => {
        expect(isType(Date, new Date())).toBe(true);
        expect(isType(Array, [])).toBe(true);
        expect(isType(Map, new Map())).toBe(true);
        expect(isType(Set, new Set())).toBe(true);
        expect(isType(RegExp, /regex/)).toBe(true);
        expect(isType(Error, new Error())).toBe(true);
    });

    // Edge cases
    test("handles edge cases correctly", () => {
        expect(isType("object", Object.create(null))).toBe(true);
        expect(isType("function", function () {})).toBe(true);
        expect(isType("function", async function () {})).toBe(true);
        expect(isType("function", function* () {})).toBe(true);
        expect(isType("function", () => {})).toBe(true);
        expect(isType("function", class {})).toBe(true);
    });

    test("handles inherited types correctly", () => {
        class Base {}
        class Derived extends Base {}
        const base = new Base();
        const derived = new Derived();
        expect(isType(Base, derived)).toBe(true);
        expect(isType(Derived, derived)).toBe(true);
        expect(isType(Base, base)).toBe(true);
        expect(isType(Derived, base)).toBe(false);
    });

    test("handles primitive object wrappers correctly", () => {
        expect(isType(String, new String("test"))).toBe(true);
        expect(isType(Number, new Number(42))).toBe(true);
        expect(isType(Boolean, new Boolean(true))).toBe(true);
    });

    // Invalid inputs
    test("handles invalid inputs gracefully", () => {
        // @ts-expect-error: Testing invalid input
        expect(isType("invalidType", {})).toBe(false);
        // @ts-expect-error: Testing invalid input
        expect(isType({}, null)).toBe(false);
        // @ts-expect-error: Testing invalid input
        expect(() => isType()).toThrow();
    });

    // curried version
    test("curried version works correctly", () => {
        expect(isType("string")("hello")).toBe(true);
        expect(isType("number")(123)).toBe(true);
        expect(isType("boolean")(true)).toBe(true);
    });
});

describe("flip", () => {
    test("flips a normal function with two arguments", () => {
        const fn = (a: number, b: string) => `${a}${b}`;
        const flippedAdd = flip(fn);
        expect(flippedAdd("1", 2)).toBe("21");
    });
    test("flips a curried function with two arguments", () => {
        const fn = (a: number) => (b: string) => `${a}${b}`;
        const flippedAdd = flip(fn);
        expect(flippedAdd("1")(2)).toBe("21");
    });
});

describe("curry", () => {
    test("curries a normal function with two arguments", () => {
        const fn = (a: number, b: string) => `${a}${b}`;
        const curriedAdd = curry(fn);
        expect(curriedAdd(1)("2")).toBe("12");
    });

    test("curries a curried function with two arguments", () => {
        const fn = (a: number) => (b: string) => `${a}${b}`;
        const curriedAdd = curry(fn);
        expect(curriedAdd(1)("2")).toBe("12");
    });

    test("curries a function with more than two arguments", () => {
        const fn = (a: number, b: string, c: boolean) => `${a}${b}${c}`;
        const curriedAdd = curry(fn);
        expect(curriedAdd(1)("2")(true)).toBe("12true");
    });
});

import { expect, test, describe } from "bun:test";

import { isConstructor, isType } from "./index";

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
        expect(isType("hello", "string")).toBe(true);
        expect(isType("", "string")).toBe(true);
        expect(isType(123, "string")).toBe(false);
    });

    test("correctly identifies number", () => {
        expect(isType(123, "number")).toBe(true);
        expect(isType(0, "number")).toBe(true);
        expect(isType(NaN, "number")).toBe(true);
        expect(isType(Infinity, "number")).toBe(true);
        expect(isType("123", "number")).toBe(false);
    });

    test("correctly identifies boolean", () => {
        expect(isType(true, "boolean")).toBe(true);
        expect(isType(false, "boolean")).toBe(true);
        expect(isType(1, "boolean")).toBe(false);
    });

    test("correctly identifies symbol", () => {
        expect(isType(Symbol("test"), "symbol")).toBe(true);
        expect(isType(Symbol.for("test"), "symbol")).toBe(true);
        expect(isType("symbol", "symbol")).toBe(false);
    });

    test("correctly identifies bigint", () => {
        expect(isType(BigInt(123), "bigint")).toBe(true);
        expect(isType(123n, "bigint")).toBe(true);
        expect(isType(123, "bigint")).toBe(false);
    });

    test("correctly identifies undefined", () => {
        expect(isType(undefined, "undefined")).toBe(true);
        expect(isType(null, "undefined")).toBe(false);
    });

    test("correctly identifies null", () => {
        expect(isType(null, "null")).toBe(true);
        expect(isType(undefined, "null")).toBe(false);
    });

    test("correctly identifies object", () => {
        expect(isType({}, "object")).toBe(true);
        expect(isType([], "object")).toBe(true);
        expect(isType(new Date(), "object")).toBe(true);
        expect(isType(null, "object")).toBe(false);
        expect(isType(42, "object")).toBe(false);
    });

    // Constructor types
    class TestClass {}
    test("correctly identifies instances of custom classes", () => {
        expect(isType(new TestClass(), TestClass)).toBe(true);
        expect(isType({}, TestClass)).toBe(false);
    });

    test("correctly identifies instances of built-in classes", () => {
        expect(isType(new Date(), Date)).toBe(true);
        expect(isType([], Array)).toBe(true);
        expect(isType(new Map(), Map)).toBe(true);
        expect(isType(new Set(), Set)).toBe(true);
        expect(isType(/regex/, RegExp)).toBe(true);
        expect(isType(new Error(), Error)).toBe(true);
    });

    // Edge cases
    test("handles edge cases correctly", () => {
        expect(isType(Object.create(null), "object")).toBe(true);
        expect(isType(function () {}, "function")).toBe(true);
        expect(isType(async function () {}, "function")).toBe(true);
        expect(isType(function* () {}, "function")).toBe(true);
        expect(isType(() => {}, "function")).toBe(true);
        expect(isType(class {}, "function")).toBe(true);
    });

    test("handles inherited types correctly", () => {
        class Base {}
        class Derived extends Base {}
        const base = new Base();
        const derived = new Derived();
        expect(isType(derived, Base)).toBe(true);
        expect(isType(derived, Derived)).toBe(true);
        expect(isType(base, Base)).toBe(true);
        expect(isType(base, Derived)).toBe(false);
    });

    test("handles primitive object wrappers correctly", () => {
        expect(isType(new String("test"), String)).toBe(true);
        expect(isType(new Number(42), Number)).toBe(true);
        expect(isType(new Boolean(true), Boolean)).toBe(true);
    });

    // Invalid inputs
    test("handles invalid inputs gracefully", () => {
        // @ts-expect-error: Testing invalid input
        expect(isType({}, "invalidType")).toBe(false);
        // @ts-expect-error: Testing invalid input
        expect(isType(null, {})).toBe(false);
        // @ts-expect-error: Testing invalid input
        expect(() => isType(42)).toThrow();
    });
});

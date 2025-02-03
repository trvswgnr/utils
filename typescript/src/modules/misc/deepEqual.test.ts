import { describe, it, expect } from "bun:test";
import { deepEqual as nodeAssertDeepEquals, throws, AssertionError } from "node:assert";
import { deepEquals } from "./deepEqual";

function nodeDeepEquals<A, B>(a: A | B, b: B): a is B {
    try {
        nodeAssertDeepEquals(a, b);
        return true;
    } catch (e) {
        return false;
    }
}

function notDeepEquals<A, B>(a: A | B, b: B) {
    return !deepEquals(a, b);
}

function assertDeepEquals<A, B>(a: A | B, b: B) {
    if (!deepEquals(a, b)) {
        throw new Error("deepEquals failed");
    }
}

describe("parity with assert.deepEqual", () => {
    describe("primitive values", () => {
        it("should handle equal numbers", () => {
            expect(deepEquals(1, 1)).toBe(nodeDeepEquals(1, 1));
        });

        it("should handle equal strings", () => {
            expect(deepEquals("test", "test")).toBe(nodeDeepEquals("test", "test"));
        });

        it("should handle equal booleans", () => {
            expect(deepEquals(true, true)).toBe(nodeDeepEquals(true, true));
        });

        it("should handle null", () => {
            expect(deepEquals(null, null)).toBe(nodeDeepEquals(null, null));
        });

        it("should handle undefined", () => {
            expect(deepEquals(undefined, undefined)).toBe(
                nodeDeepEquals(undefined, undefined),
            );
        });

        it("should handle different numbers", () => {
            expect(deepEquals(1, 2)).toBe(nodeDeepEquals(1, 2));
        });

        it("should handle different strings", () => {
            expect(deepEquals("test", "other")).toBe(nodeDeepEquals("test", "other"));
        });

        it("should handle different booleans", () => {
            expect(deepEquals(true, false)).toBe(nodeDeepEquals(true, false));
        });

        it("should handle null vs undefined", () => {
            expect(deepEquals(null, undefined)).toBe(nodeDeepEquals(null, undefined));
        });
    });

    describe("objects", () => {
        it("should handle empty objects", () => {
            expect(deepEquals({}, {})).toBe(nodeDeepEquals({}, {}));
        });

        it("should handle simple equal objects", () => {
            expect(deepEquals({ a: 1 }, { a: 1 })).toBe(
                nodeDeepEquals({ a: 1 }, { a: 1 }),
            );
        });

        it("should handle simple different objects", () => {
            expect(deepEquals({ a: 1 }, { a: 2 })).toBe(
                nodeDeepEquals({ a: 1 }, { a: 2 }),
            );
        });

        it("should handle multiple property objects", () => {
            expect(deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(
                nodeDeepEquals({ a: 1, b: 2 }, { a: 1, b: 2 }),
            );
        });

        it("should handle different property order", () => {
            expect(deepEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(
                nodeDeepEquals({ a: 1, b: 2 }, { b: 2, a: 1 }),
            );
        });

        it("should handle nested equal objects", () => {
            expect(deepEquals({ a: { b: 2 } }, { a: { b: 2 } })).toBe(
                nodeDeepEquals({ a: { b: 2 } }, { a: { b: 2 } }),
            );
        });

        it("should handle nested different objects", () => {
            expect(deepEquals({ a: { b: 2 } }, { a: { b: 3 } })).toBe(
                nodeDeepEquals({ a: { b: 2 } }, { a: { b: 3 } }),
            );
        });

        it("should handle objects with missing properties", () => {
            expect(deepEquals({ a: 1, b: 2 }, { a: 1 })).toBe(
                nodeDeepEquals({ a: 1, b: 2 }, { a: 1 }),
            );
            expect(deepEquals({ a: 1 }, { a: 1, b: 2 })).toBe(
                nodeDeepEquals({ a: 1 }, { a: 1, b: 2 }),
            );
        });
    });

    describe("symbols", () => {
        it("should handle equal symbols", () => {
            {
                const symbol1 = Symbol("test1");
                const symbol2 = Symbol("test2");
                expect(deepEquals(symbol1, symbol2)).toBe(
                    nodeDeepEquals(symbol1, symbol2),
                );
                const symbol3 = Symbol("test1");
                expect(deepEquals(symbol1, symbol3)).toBe(false);
                expect(deepEquals(symbol1, symbol3)).toBe(
                    nodeDeepEquals(symbol1, symbol3),
                );
            }
            const symbol1 = Symbol("test1");
            const symbol2 = Symbol("test1");
            expect(deepEquals(symbol1, symbol2)).toBe(false);
            expect(deepEquals(symbol1, symbol2)).toBe(nodeDeepEquals(symbol1, symbol2));
        });
        it("should handle different symbols", () => {
            const symbol1 = Symbol("test1");
            const symbol2 = Symbol("test2");
            expect(deepEquals(symbol1, symbol2)).toBe(nodeDeepEquals(symbol1, symbol2));
        });
    });

    describe("arrays", () => {
        it("should handle empty arrays", () => {
            expect(deepEquals([], [])).toBe(nodeDeepEquals([], []));
        });

        it("should handle equal arrays", () => {
            expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(
                nodeDeepEquals([1, 2, 3], [1, 2, 3]),
            );
        });

        it("should handle different arrays", () => {
            expect(deepEquals([1, 2, 3], [1, 2, 4])).toBe(
                nodeDeepEquals([1, 2, 3], [1, 2, 4]),
            );
        });

        it("should handle nested equal arrays", () => {
            expect(deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(
                nodeDeepEquals([1, [2, 3]], [1, [2, 3]]),
            );
        });

        it("should handle nested different arrays", () => {
            expect(deepEquals([1, [2, 3]], [1, [2, 4]])).toBe(
                nodeDeepEquals([1, [2, 3]], [1, [2, 4]]),
            );
        });

        it("should handle arrays with equal objects", () => {
            expect(deepEquals([{ a: 1 }], [{ a: 1 }])).toBe(
                nodeDeepEquals([{ a: 1 }], [{ a: 1 }]),
            );
        });

        it("should handle arrays with different objects", () => {
            expect(deepEquals([{ a: 1 }], [{ a: 2 }])).toBe(
                nodeDeepEquals([{ a: 1 }], [{ a: 2 }]),
            );
        });
    });

    describe("builtin types", () => {
        it("should handle equal dates", () => {
            expect(deepEquals(new Date("2024-01-01"), new Date("2024-01-01"))).toBe(
                nodeDeepEquals(new Date("2024-01-01"), new Date("2024-01-01")),
            );
        });
        it("should handle different dates", () => {
            expect(deepEquals(new Date("2024-01-01"), new Date("2024-01-02"))).toBe(
                nodeDeepEquals(new Date("2024-01-01"), new Date("2024-01-02")),
            );
        });

        it("should handle equal regexps", () => {
            expect(deepEquals(/abc/, /abc/)).toBe(nodeDeepEquals(/abc/, /abc/));
        });
        it("should handle different regexps", () => {
            expect(deepEquals(/abc/, /def/)).toBe(nodeDeepEquals(/abc/, /def/));
        });

        it("should handle same symbol", () => {
            const symbol = Symbol("test");
            expect(deepEquals(symbol, symbol)).toBe(nodeDeepEquals(symbol, symbol));
        });
        it("should handle different symbols", () => {
            const symbol1 = Symbol("test");
            const symbol2 = Symbol("other");
            expect(deepEquals(symbol1, symbol2)).toBe(nodeDeepEquals(symbol1, symbol2));
        });

        it("should handle equal sets", () => {
            expect(deepEquals(new Set([1, 2]), new Set([1, 2]))).toBe(
                nodeDeepEquals(new Set([1, 2]), new Set([1, 2])),
            );
        });
        it("should handle different sets", () => {
            expect(deepEquals(new Set([1, 2]), new Set([1, 3]))).toBe(
                nodeDeepEquals(new Set([1, 2]), new Set([1, 3])),
            );
            expect(deepEquals(new Set([1, 2]), new Set([1, 2, 3]))).toBe(
                nodeDeepEquals(new Set([1, 2]), new Set([1, 2, 3])),
            );
        });
    });

    describe("edge cases", () => {
        it("should handle NaN values", () => {
            expect(deepEquals(Number.NaN, Number.NaN)).toBe(
                nodeDeepEquals(Number.NaN, Number.NaN),
            );
        });

        it("should handle positive and negative zero", () => {
            expect(deepEquals(+0, -0)).toBe(nodeDeepEquals(+0, -0));
        });

        it("should handle mixed type comparisons", () => {
            expect(deepEquals(1, "1")).toBe(nodeDeepEquals(1, "1"));
            expect(deepEquals(new String("test"), "test")).toBe(
                nodeDeepEquals(new String("test"), "test"),
            );
        });

        it("should handle sparse arrays", () => {
            const sparse = [1];
            sparse[2] = 3; // creates [1, <empty>, 3]
            expect(deepEquals(sparse, [1, undefined, 3])).toBe(
                nodeDeepEquals(sparse, [1, undefined, 3]),
            );
        });

        it("should handle arrays of different lengths", () => {
            expect(deepEquals([1, 2], [1, 2, 3])).toBe(nodeDeepEquals([1, 2], [1, 2, 3]));
        });

        it("should handle sets of different lengths", () => {
            expect(deepEquals(new Set([1, 2]), new Set([1, 2, 3]))).toBe(
                nodeDeepEquals(new Set([1, 2]), new Set([1, 2, 3])),
            );
        });

        it("should handle maps of different lengths", () => {
            expect(
                deepEquals(
                    new Map([[1, 2]]),
                    new Map([
                        [1, 2],
                        [3, 4],
                    ]),
                ),
            ).toBe(
                nodeDeepEquals(
                    new Map([[1, 2]]),
                    new Map([
                        [1, 2],
                        [3, 4],
                    ]),
                ),
            );
        });

        it("should handle object with null/undefined values", () => {
            expect(deepEquals({ a: null, b: undefined }, { a: null, b: undefined })).toBe(
                nodeDeepEquals({ a: null, b: undefined }, { a: null, b: undefined }),
            );
        });

        it("should handle circular references", () => {
            const obj1: any = { a: 1 };
            const obj2: any = { a: 1 };
            obj1.self = obj1;
            obj2.self = obj2;
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle built-in objects", () => {
            expect(deepEquals(new Error("test"), new Error("test"))).toBe(
                nodeDeepEquals(new Error("test"), new Error("test")),
            );
            expect(
                deepEquals(new URL("http://example.com"), new URL("http://example.com")),
            ).toBe(
                nodeDeepEquals(
                    new URL("http://example.com"),
                    new URL("http://example.com"),
                ),
            );
        });

        it("should handle typed arrays", () => {
            expect(deepEquals(new Int32Array([1, 2, 3]), new Int32Array([1, 2, 3]))).toBe(
                nodeDeepEquals(new Int32Array([1, 2, 3]), new Int32Array([1, 2, 3])),
            );
            expect(deepEquals(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(
                nodeDeepEquals(new Uint8Array([1, 2]), new Uint8Array([1, 3])),
            );
        });

        it("should handle functions", () => {
            const fn1 = () => {};
            const fn2 = () => {};
            expect(deepEquals(fn1, fn1)).toBe(nodeDeepEquals(fn1, fn1)); // same function
            expect(deepEquals(fn1, fn2)).toBe(nodeDeepEquals(fn1, fn2)); // different functions
        });

        it("should handle promises", () => {
            const promise1 = Promise.resolve(1);
            const promise2 = Promise.resolve(1);
            expect(deepEquals(promise1, promise1)).toBe(
                nodeDeepEquals(promise1, promise1),
            ); // same promise
            expect(deepEquals(promise1, promise2)).toBe(
                nodeDeepEquals(promise1, promise2),
            ); // different promises
        });

        it("should handle objects with different prototypes", () => {
            class Custom1 {
                value = 1;
            }
            class Custom2 {
                value = 1;
            }
            expect(deepEquals(new Custom1(), new Custom2())).toBe(
                nodeDeepEquals(new Custom1(), new Custom2()),
            );
        });

        it("should handle BigInt values", () => {
            expect(deepEquals(BigInt(123), BigInt(123))).toBe(
                nodeDeepEquals(BigInt(123), BigInt(123)),
            );
        });

        it("should handle WeakMap and WeakSet", () => {
            const weak1 = new WeakMap();
            const weak2 = new WeakMap();
            expect(deepEquals(weak1, weak2)).toBe(nodeDeepEquals(weak1, weak2));
        });

        it("should handle objects with getters/setters", () => {
            const obj1 = {
                get value() {
                    return 1;
                },
                set value(v) {},
            };
            const obj2 = {
                get value() {
                    return 1;
                },
                set value(v) {},
            };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle array-like objects", () => {
            const arrayLike1 = { length: 2, 0: "a", 1: "b" };
            const arrayLike2 = { length: 2, 0: "a", 1: "b" };
            expect(deepEquals(arrayLike1, arrayLike2)).toBe(
                nodeDeepEquals(arrayLike1, arrayLike2),
            );
        });

        it("should handle objects with symbol properties", () => {
            const sym = Symbol("test");
            const obj1 = { [sym]: 1 };
            const obj2 = { [sym]: 1 };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle Map with non-primitive keys", () => {
            const key1 = { a: 1 };
            const key2 = { a: 1 };
            const map1 = new Map([[key1, "value"]]);
            const map2 = new Map([[key2, "value"]]);
            expect(deepEquals(map1, map2)).toBe(nodeDeepEquals(map1, map2));
            const key3 = { a: 2 };
            const map3 = new Map([[key3, "value"]]);
            expect(deepEquals(map1, map3)).toBe(nodeDeepEquals(map1, map3));
        });

        it("should handle objects with non-enumerable properties", () => {
            const obj1 = Object.create(
                {},
                {
                    prop: { value: 1, enumerable: false },
                },
            );
            const obj2 = Object.create(
                {},
                {
                    prop: { value: 1, enumerable: false },
                },
            );
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
            const obj3 = {
                prop: { value: 2, enumerable: false },
            };
            expect(deepEquals(obj1, obj3)).toBe(nodeDeepEquals(obj1, obj3));
        });

        it("should handle DataView objects", () => {
            const buffer = new ArrayBuffer(16);
            const view1 = new DataView(buffer);
            const view2 = new DataView(buffer);
            expect(deepEquals(view1, view2)).toBe(nodeDeepEquals(view1, view2));
        });

        it("should handle ArrayBuffer objects", () => {
            const buffer1 = new Uint8Array([1, 2, 3]).buffer;
            const buffer2 = new Uint8Array([1, 2, 3]).buffer;
            expect(deepEquals(buffer1, buffer2)).toBe(nodeDeepEquals(buffer1, buffer2));
        });

        it("should handle objects with inherited properties", () => {
            class Parent {
                parentProp = "parent";
            }
            class Child extends Parent {
                childProp = "child";
            }
            expect(deepEquals(new Child(), new Child())).toBe(
                nodeDeepEquals(new Child(), new Child()),
            );
        });

        it("should handle Infinity values", () => {
            expect(deepEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)).toBe(
                nodeDeepEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
            );
            expect(deepEquals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBe(
                nodeDeepEquals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY),
            );
            expect(deepEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBe(
                nodeDeepEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
            );
        });

        it("should handle boxed primitives vs primitives", () => {
            expect(deepEquals(new Number(123), new Number(123))).toBe(
                nodeDeepEquals(new Number(123), new Number(123)),
            );
            expect(deepEquals(new Number(123), 123)).toBe(
                nodeDeepEquals(new Number(123), 123),
            );
            expect(deepEquals(new Boolean(true), true)).toBe(
                nodeDeepEquals(new Boolean(true), true),
            );
            expect(deepEquals(new String("test"), "test")).toBe(
                nodeDeepEquals(new String("test"), "test"),
            );
            expect(deepEquals(new String("test"), new String("test"))).toBe(
                nodeDeepEquals(new String("test"), new String("test")),
            );
        });

        it("should handle objects with same values but different property descriptors", () => {
            const obj1 = Object.defineProperty({}, "prop", {
                value: 1,
                writable: false,
                configurable: false,
            });
            const obj2 = Object.defineProperty({}, "prop", {
                value: 1,
                writable: true,
                configurable: true,
            });
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });
        it("should handle Proxy objects", () => {
            const target1 = { a: 1 };
            const target2 = { a: 1 };
            const handler = {
                get: (target: any, prop: string) => target[prop],
            };
            const proxy1 = new Proxy(target1, handler);
            const proxy2 = new Proxy(target2, handler);
            expect(deepEquals(proxy1, proxy2)).toBe(nodeDeepEquals(proxy1, proxy2));
        });

        it("should handle arguments objects", () => {
            function getArgs1() {
                return arguments;
            }
            function getArgs2() {
                return arguments;
            }
            // @ts-expect-error
            const args1 = getArgs1(1, 2, 3);
            // @ts-expect-error
            const args2 = getArgs2(1, 2, 3);
            expect(deepEquals(args1, args2)).toBe(nodeDeepEquals(args1, args2));
        });

        it("should handle complex circular references", () => {
            const obj1: any = { a: { b: {} } };
            const obj2: any = { a: { b: {} } };
            obj1.a.b.c = obj1.a;
            obj2.a.b.c = obj2.a;
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));

            // Cross-reference scenario
            const objA: any = { name: "A" };
            const objB: any = { name: "B" };
            objA.ref = objB;
            objB.ref = objA;

            const objC: any = { name: "A" };
            const objD: any = { name: "B" };
            objC.ref = objD;
            objD.ref = objC;

            expect(deepEquals(objA, objC)).toBe(nodeDeepEquals(objA, objC));
        });

        it("should handle objects with toJSON methods", () => {
            const obj1 = {
                data: 69,
                toJSON() {
                    return { data: this.data };
                },
            };
            const obj2 = {
                data: 69,
                toJSON() {
                    return { data: this.data };
                },
            };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle objects with custom valueOf", () => {
            const obj1 = {
                value: 69,
                valueOf() {
                    return this.value;
                },
            };
            const obj2 = {
                value: 69,
                valueOf() {
                    return this.value;
                },
            };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle SharedArrayBuffer", () => {
            const sab1 = new SharedArrayBuffer(1024);
            const sab2 = new SharedArrayBuffer(1024);
            const view1 = new Int32Array(sab1);
            const view2 = new Int32Array(sab2);
            view1[0] = 69;
            view2[0] = 69;
            expect(deepEquals(sab1, sab2)).toBe(nodeDeepEquals(sab1, sab2));
        });

        it("should handle Atomics operations", () => {
            const sab1 = new SharedArrayBuffer(1024);
            const sab2 = new SharedArrayBuffer(1024);
            const view1 = new Int32Array(sab1);
            const view2 = new Int32Array(sab2);
            Atomics.store(view1, 0, 69);
            Atomics.store(view2, 0, 69);
            expect(deepEquals(view1, view2)).toBe(nodeDeepEquals(view1, view2));
        });

        it("should handle very large objects", () => {
            const large1 = Array(10000)
                .fill(0)
                .map((_, i) => ({ id: i, value: `value${i}` }));
            const large2 = Array(10000)
                .fill(0)
                .map((_, i) => ({ id: i, value: `value${i}` }));
            expect(deepEquals(large1, large2)).toBe(nodeDeepEquals(large1, large2));
        });

        it("should handle objects with Symbol.toPrimitive", () => {
            const toPrimitiveFn = (hint: string) => {
                return hint === "number" ? 69 : "69";
            };
            const obj1 = {
                [Symbol.toPrimitive]: toPrimitiveFn,
            };
            const obj2 = {
                [Symbol.toPrimitive](hint: string) {
                    return hint === "number" ? 69 : "69";
                },
            };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
            const obj3 = {
                [Symbol.toPrimitive]: toPrimitiveFn,
            };
            expect(deepEquals(obj1, obj3)).toBe(nodeDeepEquals(obj1, obj3));
        });

        it("should handle objects with different Symbol.toPrimitive results", () => {
            const obj1 = {
                [Symbol.toPrimitive]() {
                    return 69;
                },
            };
            const obj2 = {
                [Symbol.toPrimitive]() {
                    return 43;
                },
            };
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });

        it("should handle deeply nested circular structures with different paths", () => {
            const obj1: any = { a: { b: { c: { d: {} } } } };
            const obj2: any = { a: { b: { c: { d: {} } } } };
            obj1.a.b.c.d.e = obj1.a.b;
            obj2.a.b.c.d.e = obj2.a.b;
            expect(deepEquals(obj1, obj2)).toBe(nodeDeepEquals(obj1, obj2));
        });
    });
});

describe("typed arrays and buffers", () => {
    describe("equal pairs", () => {
        it("should handle equal Uint8Arrays", () => {
            expect(deepEquals(new Uint8Array(1e5), new Uint8Array(1e5))).toBe(true);
        });

        it("should handle equal Uint16Arrays", () => {
            expect(deepEquals(new Uint16Array(1e5), new Uint16Array(1e5))).toBe(true);
        });

        it("should handle equal Uint32Arrays", () => {
            expect(deepEquals(new Uint32Array(1e5), new Uint32Array(1e5))).toBe(true);
        });

        it("should handle equal Uint8ClampedArrays", () => {
            expect(
                deepEquals(new Uint8ClampedArray(1e5), new Uint8ClampedArray(1e5)),
            ).toBe(true);
        });

        it("should handle equal Int8Arrays", () => {
            expect(deepEquals(new Int8Array(1e5), new Int8Array(1e5))).toBe(true);
        });

        it("should handle equal Int16Arrays", () => {
            expect(deepEquals(new Int16Array(1e5), new Int16Array(1e5))).toBe(true);
        });

        it("should handle equal Int32Arrays", () => {
            expect(deepEquals(new Int32Array(1e5), new Int32Array(1e5))).toBe(true);
        });

        it("should handle equal Float32Arrays", () => {
            expect(deepEquals(new Float32Array(1e5), new Float32Array(1e5))).toBe(true);
        });

        it("should handle equal Float64Arrays", () => {
            expect(deepEquals(new Float64Array(1e5), new Float64Array(1e5))).toBe(true);
        });

        it("should handle equal Float32Arrays with +0.0", () => {
            expect(deepEquals(new Float32Array([+0.0]), new Float32Array([+0.0]))).toBe(
                true,
            );
        });

        it("should handle equal Uint8Array subarrays", () => {
            expect(
                deepEquals(
                    new Uint8Array([1, 2, 3, 4]).subarray(1),
                    new Uint8Array([2, 3, 4]),
                ),
            ).toBe(true);
        });

        it("should handle equal Uint16Array subarrays", () => {
            expect(
                deepEquals(
                    new Uint16Array([1, 2, 3, 4]).subarray(1),
                    new Uint16Array([2, 3, 4]),
                ),
            ).toBe(true);
        });

        it("should handle equal Uint32Array subarrays with range", () => {
            expect(
                deepEquals(
                    new Uint32Array([1, 2, 3, 4]).subarray(1, 3),
                    new Uint32Array([2, 3]),
                ),
            ).toBe(true);
        });

        it("should handle equal ArrayBuffers", () => {
            expect(deepEquals(new ArrayBuffer(3), new ArrayBuffer(3))).toBe(true);
        });

        it("should handle equal SharedArrayBuffers", () => {
            expect(deepEquals(new SharedArrayBuffer(3), new SharedArrayBuffer(3))).toBe(
                true,
            );
        });
    });

    describe("loose equal pairs", () => {
        it("should handle Float32Array with +0.0 and -0.0", () => {
            expect(deepEquals(new Float32Array([+0.0]), new Float32Array([-0.0]))).toBe(
                true,
            );
        });

        it("should handle Float64Array with +0.0 and -0.0", () => {
            expect(deepEquals(new Float64Array([+0.0]), new Float64Array([-0.0]))).toBe(
                true,
            );
        });
    });

    describe("not equal pairs", () => {
        it("should handle ArrayBuffer vs SharedArrayBuffer", () => {
            expect(deepEquals(new ArrayBuffer(3), new SharedArrayBuffer(3))).toBe(
                nodeDeepEquals(new ArrayBuffer(3), new SharedArrayBuffer(3)),
            );
        });

        it("should handle different typed array types with same length", () => {
            expect(deepEquals(new Int16Array(256), new Uint16Array(256))).toBe(
                nodeDeepEquals(new Int16Array(256), new Uint16Array(256)),
            );
        });

        it("should handle different typed array types with same values", () => {
            expect(deepEquals(new Int16Array([256]), new Uint16Array([256]))).toBe(
                nodeDeepEquals(new Int16Array([256]), new Uint16Array([256])),
            );
        });

        it("should handle different float array types", () => {
            expect(deepEquals(new Float64Array([+0.0]), new Float32Array([-0.0]))).toBe(
                nodeDeepEquals(new Float64Array([+0.0]), new Float32Array([-0.0])),
            );
        });

        it("should handle typed arrays of different lengths", () => {
            expect(deepEquals(new Uint8Array(2), new Uint8Array(3))).toBe(
                nodeDeepEquals(new Uint8Array(2), new Uint8Array(3)),
            );
        });

        it("should handle typed arrays with different values", () => {
            expect(deepEquals(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))).toBe(
                nodeDeepEquals(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])),
            );
        });

        it("should handle Uint8ClampedArray vs Uint8Array", () => {
            expect(
                deepEquals(
                    new Uint8ClampedArray([300, 2, 3]),
                    new Uint8Array([300, 2, 3]),
                ),
            ).toBe(
                nodeDeepEquals(
                    new Uint8ClampedArray([300, 2, 3]),
                    new Uint8Array([300, 2, 3]),
                ),
            );
        });

        it("should handle Uint16Arrays with different values", () => {
            expect(deepEquals(new Uint16Array([2]), new Uint16Array([3]))).toBe(
                nodeDeepEquals(new Uint16Array([2]), new Uint16Array([3])),
            );
            expect(deepEquals(new Uint16Array([0]), new Uint16Array([256]))).toBe(
                nodeDeepEquals(new Uint16Array([0]), new Uint16Array([256])),
            );
        });

        it("should handle Int16Array vs Uint16Array", () => {
            expect(deepEquals(new Int16Array([0]), new Uint16Array([256]))).toBe(
                nodeDeepEquals(new Int16Array([0]), new Uint16Array([256])),
            );
            expect(deepEquals(new Int16Array([-256]), new Uint16Array([0xff00]))).toBe(
                nodeDeepEquals(new Int16Array([-256]), new Uint16Array([0xff00])),
            ); // same bits
        });

        it("should handle Int32Array vs Uint32Array with same bits", () => {
            expect(
                deepEquals(new Int32Array([-256]), new Uint32Array([0xffffff00])),
            ).toBe(nodeDeepEquals(new Int32Array([-256]), new Uint32Array([0xffffff00])));
        });

        it("should handle Float32Arrays with different values", () => {
            expect(deepEquals(new Float32Array([0.1]), new Float32Array([0.0]))).toBe(
                nodeDeepEquals(new Float32Array([0.1]), new Float32Array([0.0])),
            );
            expect(
                deepEquals(new Float32Array([0.1]), new Float32Array([0.1, 0.2])),
            ).toBe(nodeDeepEquals(new Float32Array([0.1]), new Float32Array([0.1, 0.2])));
        });

        it("should handle Float64Arrays with different values", () => {
            expect(deepEquals(new Float64Array([0.1]), new Float64Array([0.0]))).toBe(
                nodeDeepEquals(new Float64Array([0.1]), new Float64Array([0.0])),
            );
        });

        it("should handle ArrayBuffers with different content", () => {
            expect(
                deepEquals(
                    new Uint8Array([1, 2, 3]).buffer,
                    new Uint8Array([4, 5, 6]).buffer,
                ),
            ).toBe(
                nodeDeepEquals(
                    new Uint8Array([1, 2, 3]).buffer,
                    new Uint8Array([4, 5, 6]).buffer,
                ),
            );
        });

        it("should handle SharedArrayBuffers with different content", () => {
            expect(
                deepEquals(
                    new Uint8Array(new SharedArrayBuffer(3)).fill(1).buffer,
                    new Uint8Array(new SharedArrayBuffer(3)).fill(2).buffer,
                ),
            ).toBe(
                nodeDeepEquals(
                    new Uint8Array(new SharedArrayBuffer(3)).fill(1).buffer,
                    new Uint8Array(new SharedArrayBuffer(3)).fill(2).buffer,
                ),
            );
        });

        it("should handle ArrayBuffers of different sizes", () => {
            expect(deepEquals(new ArrayBuffer(2), new ArrayBuffer(3))).toBe(
                nodeDeepEquals(new ArrayBuffer(2), new ArrayBuffer(3)),
            );
        });

        it("should handle SharedArrayBuffers of different sizes", () => {
            expect(deepEquals(new SharedArrayBuffer(2), new SharedArrayBuffer(3))).toBe(
                nodeDeepEquals(new SharedArrayBuffer(2), new SharedArrayBuffer(3)),
            );
        });

        it("should handle ArrayBuffer vs SharedArrayBuffer of different sizes", () => {
            expect(deepEquals(new ArrayBuffer(2), new SharedArrayBuffer(3))).toBe(
                nodeDeepEquals(new ArrayBuffer(2), new SharedArrayBuffer(3)),
            );
        });

        it("should handle ArrayBuffer vs SharedArrayBuffer with different content", () => {
            expect(
                deepEquals(
                    new Uint8Array(new ArrayBuffer(3)).fill(1).buffer,
                    new Uint8Array(new SharedArrayBuffer(3)).fill(2).buffer,
                ),
            ).toBe(
                nodeDeepEquals(
                    new Uint8Array(new ArrayBuffer(3)).fill(1).buffer,
                    new Uint8Array(new SharedArrayBuffer(3)).fill(2).buffer,
                ),
            );
        });

        it("should handle SharedArrayBuffer vs ArrayBuffer conversion", () => {
            expect(deepEquals(new SharedArrayBuffer(2), new ArrayBuffer(2))).toBe(
                nodeDeepEquals(new SharedArrayBuffer(2), new ArrayBuffer(2)),
            );
        });
    });
});

class MyRegExp extends RegExp {
    constructor(...args: Parameters<typeof RegExp>) {
        super(...args);
        this[0] = "1";
    }
    [x: number]: string;
}

const date = new Date("2016");

class MyDate extends Date {
    constructor(...args: any[]) {
        // @ts-expect-error
        super(...args);
        this[0] = "1";
    }
    [x: number]: string;
}

const date2 = new MyDate("2016");

// TODO: need to pass these tests
// describe("deepEqual should pass for these weird cases", () => {
//     const re2 = new MyRegExp("test");
//     const similar = new Set([
//         { 0: 1 }, // Object
//         new String("1"), // Object
//         [1], // Array
//         date2, // Date with this[0] = '1'
//         re2, // RegExp with this[0] = '1'
//         new Int8Array([1]), // Int8Array
//         new Int16Array([1]), // Int16Array
//         new Uint16Array([1]), // Uint16Array
//         new Int32Array([1]), // Int32Array
//         new Uint32Array([1]), // Uint32Array
//         Buffer.from([1]), // Uint8Array
//         (function () {
//             return arguments;
//             // @ts-expect-error
//         })(1),
//     ]);

//     for (const a of similar) {
//         for (const b of similar) {
//             if (a !== b) {
//                 it(`${a} === ${b}`, () => {
//                     expect(deepEquals(a, b)).toBe(nodeDeepEquals(a, b));
//                 });
//             }
//         }
//     }
// });

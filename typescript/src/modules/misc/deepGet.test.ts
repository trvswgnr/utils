import { deepGet } from "./index";
import { expect, describe, test } from "bun:test";
import type { Equal, Expect } from "./type-utils";

const tryCatch = <T>(fn: () => T): Equal<T, never> extends true ? Error : T => {
    try {
        return fn() as any;
    } catch (e) {
        const error = e instanceof Error ? e : new Error("unknown error");
        return error as any;
    }
};

describe("deepGet simple object", () => {
    test("should return the correct values", () => {
        const simpleObject1 = { a: 1, b: 2, c: 3 };
        const a = deepGet(simpleObject1, "a");
        expect(a).toBe(1);
        const simpleObject2 = { a: { b: { c: 1 } } };
        const b = deepGet(simpleObject2, "a.b.c");
        expect(b).toBe(1);
        const simpleObject3 = { a: { b: { c: { d: 1 } } } };
        const c = deepGet(simpleObject3, "a.b.c.d");
        expect(c).toBe(1);
        const simpleObject4 = { a: { b: { c: { d: { e: 1 } } } } };
        const d = deepGet(simpleObject4, "a.b.c.d.e");
        expect(d).toBe(1);
    });
});

describe("deepGet complex object", () => {
    test("should return the correct values", () => {
        const complexObject = {
            user: {
                personalInfo: {
                    name: "John Doe",
                    age: 30,
                    contact: {
                        email: "john@example.com",
                        phone: {
                            home: "555-0123",
                            work: "555-0456",
                        },
                    },
                },
                settings: {
                    theme: "dark",
                    notifications: {
                        email: true,
                        push: false,
                    },
                },
            },
            posts: [
                {
                    id: 1,
                    title: "Hello World",
                    metadata: {
                        tags: ["typescript", "programming"],
                    },
                },
            ],
            stats: {
                visits: 1000,
                analytics: {
                    bounceRate: 0.45,
                    timeOnSite: {
                        average: 300,
                        median: 250,
                    },
                },
            },
        } as const;

        const userName = deepGet(complexObject, "user.personalInfo.name");
        const workPhone = deepGet(complexObject, "user.personalInfo.contact.phone.work");
        const bounceRate = deepGet(complexObject, "stats.analytics.bounceRate");

        // @ts-expect-error - non-existent path
        const t0 = tryCatch(() => deepGet(complexObject, "user.nonexistent.path"));

        // good path
        const t1 = tryCatch(() => deepGet(complexObject, "user"));

        // @ts-expect-error - invalid path
        const t2 = tryCatch(() => deepGet(complexObject, "invalid.path"));

        const t3 = tryCatch(() =>
            // @ts-expect-error - invalid path, last key is not valid
            deepGet(complexObject, "user.personalInfo.contact.phone.mobile"),
        );

        expect(userName).toBe("John Doe");
        expect(workPhone).toBe("555-0456");
        expect(bounceRate).toBe(0.45);

        expect(t0).toBeInstanceOf(Error);
        expect(t1).toBe(complexObject.user);
        expect(t2).toBeInstanceOf(Error);
        expect(t3).toBeInstanceOf(Error);

        // test types
        type _ = [
            Expect<Equal<typeof workPhone, "555-0456">>,
            Expect<Equal<typeof userName, "John Doe">>,
            Expect<Equal<typeof bounceRate, 0.45>>,
            Expect<Equal<typeof t0, Error>>,
            Expect<Equal<typeof t1, (typeof complexObject)["user"]>>,
            Expect<Equal<typeof t2, Error>>,
        ];
    });
});

describe("deepGet edge cases", () => {
    test("should handle empty objects", () => {
        const emptyObject = {};
        // @ts-expect-error - invalid path
        const result = tryCatch(() => deepGet(emptyObject, "any.path"));
        expect(result).toBeInstanceOf(Error);
    });

    test("should handle null and undefined values in path", () => {
        const objectWithNull = {
            a: {
                b: null,
                c: undefined,
                d: {
                    e: 1,
                },
            },
        } as const;

        const nullValue = deepGet(objectWithNull, "a.b");
        const undefinedValue = deepGet(objectWithNull, "a.c");
        const validPath = deepGet(objectWithNull, "a.d.e");

        expect(nullValue).toBeNull();
        expect(undefinedValue).toBeUndefined();
        expect(validPath).toBe(1);
    });

    test("should handle arrays and array indices", () => {
        const objectWithArrays = {
            users: [
                { id: 1, name: "Alice" },
                { id: 2, name: "Bob" },
            ],
            nested: {
                arrays: [
                    [1, 2],
                    [3, 4],
                ],
            },
        } as const;

        const firstUser = deepGet(objectWithArrays, "users.0.name");
        const secondUserId = deepGet(objectWithArrays, "users.1.id");
        const nestedArrayValue = deepGet(objectWithArrays, "nested.arrays.1.0");

        expect(firstUser).toBe("Alice");
        expect(secondUserId).toBe(2);
        expect(nestedArrayValue).toBe(3);

        type _ = [
            Expect<Equal<typeof firstUser, "Alice">>,
            Expect<Equal<typeof secondUserId, 2>>,
            Expect<Equal<typeof nestedArrayValue, 3>>,
        ];

        // @ts-expect-error - index out of bounds
        const outOfBounds = tryCatch(() => deepGet(objectWithArrays, "users.2.name"));
        expect(outOfBounds).toBeInstanceOf(Error);
    });

    test("should handle special characters in property names", () => {
        const objectWithSpecialChars = {
            "special-key": 1,
            "@symbol": 2,
            "nested~key": {
                "more!": 3,
            },
        } as const;

        const specialKey = deepGet(objectWithSpecialChars, "special-key");
        const symbolKey = deepGet(objectWithSpecialChars, "@symbol");

        expect(specialKey).toBe(1);
        expect(symbolKey).toBe(2);

        const nestedKey = deepGet(objectWithSpecialChars, "nested~key.more!");
        expect(nestedKey).toBe(3);
    });
});

describe("deepGet type safety", () => {
    test("should maintain type information", () => {
        const typedObject = {
            number: 42,
            string: "hello",
            boolean: true,
            nested: {
                tuple: [1, "two", false] as const,
                union: Math.random() > 0.5 ? "a" : "b",
            },
        } as const;

        const number = deepGet(typedObject, "number");
        const string = deepGet(typedObject, "string");
        const boolean = deepGet(typedObject, "boolean");
        const tuple = deepGet(typedObject, "nested.tuple");
        const union = deepGet(typedObject, "nested.union");

        type _ = [
            Expect<Equal<typeof number, 42>>,
            Expect<Equal<typeof string, "hello">>,
            Expect<Equal<typeof boolean, true>>,
            Expect<Equal<typeof tuple, readonly [1, "two", false]>>,
            Expect<Equal<typeof union, "a" | "b">>,
        ];

        expect(number).toBe(42);
        expect(string).toBe("hello");
        expect(boolean).toBe(true);
        expect(tuple).toEqual([1, "two", false]);
        expect(["a", "b"]).toContain(union);
    });
});

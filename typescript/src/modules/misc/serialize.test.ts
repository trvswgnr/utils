import {
    serialize,
    deserialize,
    BinarySerializer,
    BinaryDeserializer,
    crc32,
} from "./serialize";
import { describe, test, expect, mock } from "bun:test";

describe("Binary Serializer", () => {
    // basic type serialization tests
    describe("Basic Types", () => {
        test("should serialize and deserialize null", () => {
            const value = null;
            const serialized = serialize(value);
            const deserialized = deserialize(serialized);
            expect(deserialized).toBeNull();
        });

        test("should serialize and deserialize undefined", () => {
            const value = undefined;
            const serialized = serialize(value);
            const deserialized = deserialize(serialized);
            expect(deserialized).toBeUndefined();
        });

        test("should serialize and deserialize booleans", () => {
            const testCases = [true, false];

            for (const value of testCases) {
                const serialized = serialize(value);
                const deserialized = deserialize(serialized);
                expect(deserialized).toBe(value);
            }
        });

        test("should serialize and deserialize numbers with optimal encoding", () => {
            const testCases = [
                { value: 42, description: "positive int8" },
                { value: -42, description: "negative int8" },
                { value: 200, description: "uint8" },
                { value: 30000, description: "uint16" },
                { value: -30000, description: "int16" },
                { value: 70000, description: "uint32" },
                { value: -70000, description: "int32" },
                { value: Math.PI, description: "float" },
                { value: Number.MAX_SAFE_INTEGER, description: "large int" },
                { value: Number.MIN_SAFE_INTEGER, description: "large negative int" },
            ];

            for (const { value } of testCases) {
                const serialized = serialize(value);
                const deserialized = deserialize(serialized);
                expect(deserialized).toBe(value);
            }
        });

        test("should serialize and deserialize strings", () => {
            const testCases = [
                "",
                "Hello, world!",
                "🚀 Unicode characters 💯",
                "A".repeat(1000), // long string
            ];

            for (const value of testCases) {
                const serialized = serialize(value);
                const deserialized = deserialize(serialized);
                expect(deserialized).toBe(value);
            }
        });

        test("should serialize and deserialize UUIDs", () => {
            const uuid = "123e4567-e89b-12d3-a456-426614174000";
            const serialized = serialize(uuid);
            const deserialized = deserialize(serialized);
            expect(deserialized).toBe(uuid);
        });

        test("should serialize and deserialize dates", () => {
            const date = new Date("2023-05-15T12:30:45.678Z");
            const serialized = serialize(date);
            const deserialized = deserialize(serialized) as Date;
            expect(deserialized).toBeInstanceOf(Date);
            expect(deserialized.getTime()).toBe(date.getTime());
        });

        test("should serialize and deserialize binary data", () => {
            const binary = new Uint8Array([0, 1, 2, 3, 255, 254, 253, 252]);
            const serialized = serialize(binary);
            const deserialized = deserialize(serialized) as Uint8Array;
            expect(deserialized).toBeInstanceOf(Uint8Array);
            expect(Array.from(deserialized)).toEqual(Array.from(binary));
        });
    });

    // complex type serialization tests
    describe("Complex Types", () => {
        test("should serialize and deserialize arrays", () => {
            const arrays = [
                [],
                [1, 2, 3],
                ["a", "b", "c"],
                [true, false, true],
                [1, "a", true, null, undefined],
                [
                    [1, 2],
                    [3, 4],
                ], // nested arrays
            ];

            for (const array of arrays) {
                const serialized = serialize(array);
                const deserialized = deserialize(serialized);
                expect(deserialized).toEqual(array);
            }
        });

        test("should serialize and deserialize objects", () => {
            const objects = [
                {},
                { a: 1, b: 2 },
                { name: "John", age: 30, active: true },
                { outer: { inner: { value: 42 } } }, // nested objects
                { mixed: [1, { a: 2 }] }, // mixed object with array
            ];

            for (const obj of objects) {
                const serialized = serialize(obj);
                const deserialized = deserialize(serialized);
                expect(deserialized).toEqual(obj);
            }
        });

        test("should serialize and deserialize maps (records)", () => {
            const map = {
                key1: "value1",
                key2: 42,
                key3: true,
                key4: { nested: "object" },
            };

            const serialized = serialize(map);
            const deserialized = deserialize(serialized);
            expect(deserialized).toEqual(map);
        });

        test("should serialize and deserialize complex nested structures", () => {
            const complex = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                created: new Date("2023-01-01"),
                counts: [1, 2, 3, 4, 5],
                metadata: {
                    tags: ["tag1", "tag2"],
                    properties: {
                        isActive: true,
                        score: 95.5,
                    },
                },
                binary: new Uint8Array([1, 2, 3]),
                nullValue: null,
                undefinedValue: undefined,
            };

            const serialized = serialize(complex);
            const deserialized = deserialize(serialized) as typeof complex;

            // special handling for binary data comparison
            const binaryEqual =
                Array.from(complex.binary).toString() ===
                Array.from(deserialized.binary).toString();

            expect(deserialized.id).toBe(complex.id);
            expect(deserialized.created.getTime()).toBe(complex.created.getTime());
            expect(deserialized.counts).toEqual(complex.counts);
            expect(deserialized.metadata).toEqual(complex.metadata);
            expect(binaryEqual).toBe(true);
            expect(deserialized.nullValue).toBeNull();
            expect(deserialized.undefinedValue).toBeUndefined();
        });
    });

    // schema validation tests
    describe("Schema Validation", () => {
        const validUser: User = {
            id: "123e4567-e89b-12d3-a456-426614174000",
            username: "testuser",
            email: "test@example.com",
            age: 25,
            isActive: true,
            roles: ["user", "admin"],
            createdAt: new Date(),
        };

        type User = {
            id: string;
            username: string;
            email: string;
            age: number;
            isActive: boolean;
            roles: string[];
            createdAt: Date;
        };

        function parseUser(x: unknown): User {
            if (
                typeof x === "object" &&
                x !== null &&
                "id" in x &&
                typeof x.id === "string" &&
                "username" in x &&
                typeof x.username === "string" &&
                "email" in x &&
                typeof x.email === "string" &&
                "age" in x &&
                typeof x.age === "number" &&
                x.age > 0 &&
                "isActive" in x &&
                typeof x.isActive === "boolean" &&
                "roles" in x &&
                Array.isArray(x.roles) &&
                x.roles.every((r) => typeof r === "string") &&
                "createdAt" in x &&
                x.createdAt instanceof Date
            ) {
                return {
                    id: x.id,
                    username: x.username,
                    email: x.email,
                    age: x.age,
                    isActive: x.isActive,
                    roles: x.roles,
                    createdAt: x.createdAt,
                };
            }
            throw new Error("invalid user");
        }

        test("should validate data against schema during serialization", () => {
            const serialized = serialize(validUser);
            const deserialized = deserialize(serialized, parseUser);
            expect(deserialized).toEqual(validUser);
        });

        test("shouldn't throw error when serializing invalid data", () => {
            const invalidUser = {
                ...validUser,
                age: -5, // invalid: negative age
            };

            expect(() => {
                serialize(invalidUser);
            }).not.toThrow();
        });

        test("should throw error when deserializing data that fails schema validation", () => {
            // first serialize without schema validation
            const invalidUser = {
                ...validUser,
                age: -5, // invalid: negative age
            };

            const serialized = serialize(invalidUser); // no schema here

            // should throw when trying to validate during deserialization
            expect(() => {
                deserialize(serialized, parseUser);
            }).toThrow();
        });

        test("should support optional schema validation", () => {
            // serialize without schema
            const serialized = serialize(validUser);

            // deserialize with schema
            const deserializedWithSchema = deserialize(serialized, parseUser);
            expect(deserializedWithSchema).toEqual(validUser);

            // deserialize without schema
            const deserializedWithoutSchema = deserialize(serialized);
            expect(deserializedWithoutSchema).toEqual(validUser);
        });
    });

    // checksum validation tests
    describe("Checksum Validation", () => {
        test("should detect data tampering with checksum verification", () => {
            const data = { id: "test", value: 42 };
            const serialized = serialize(data);

            // tamper with the data (modify a byte in the middle)
            const tampered = new Uint8Array(serialized);
            tampered[10] = Number(!tampered[10]);

            // should throw error due to checksum mismatch
            expect(() => deserialize(tampered)).toThrow(/Checksum verification failed/);
        });

        test("should handle empty data with checksum", () => {
            const emptyObject = {};
            const serialized = serialize(emptyObject);
            const deserialized = deserialize(serialized);
            expect(deserialized).toEqual(emptyObject);

            // tamper with the data (modify a byte in the middle)
            const tampered = new Uint8Array(serialized);
            tampered[5] = Number(!tampered[5]);

            // should throw error due to checksum mismatch
            expect(() => deserialize(tampered)).toThrow(/Checksum verification failed/);
        });
    });

    // size optimization tests
    describe("Size Optimization", () => {
        test("should select optimal numeric representation", () => {
            // test small integers use fewer bytes
            const smallInt = 42;
            const smallIntSerialized = serialize(smallInt);

            const largeInt = 100000;
            const largeIntSerialized = serialize(largeInt);

            expect(smallIntSerialized.length).toBeLessThan(largeIntSerialized.length);
        });

        test("should be more compact than JSON for complex objects", () => {
            const complexObject = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                values: Array.from({ length: 100 }, (_, i) => i),
                nested: {
                    data: new Uint8Array(100),
                    date: new Date(),
                },
            };

            const serialized = serialize(complexObject);

            // jSON needs special handling for binary and dates
            const jsonString = JSON.stringify(complexObject, (_, value) => {
                if (value instanceof Uint8Array) {
                    return Array.from(value);
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            });

            // even with checksum overhead, binary should be more efficient
            expect(serialized.length).toBeLessThan(jsonString.length);
        });
    });

    // edge cases and error handling
    describe("Edge Cases and Error Handling", () => {
        test("should handle circular references gracefully", () => {
            const obj: any = { name: "Parent object" };
            obj.self = obj; // circular reference
            obj.self.self = obj;
            obj.self.self.self = obj;
            let serialized = null;
            expect(() => {
                serialized = serialize(obj);
            }).not.toThrow();
            const deserialized = deserialize(serialized!) as any;
            expect(deserialized).toBe(deserialized.self);
            expect(deserialized).toBe(deserialized.self.self);
            expect(deserialized).toBe(deserialized.self.self.self);
            expect(deserialized.self.self).toBe(deserialized.self.self.self);
        });

        test("should handle very large objects", () => {
            const largeArray: any = Array.from({ length: 10000 }, (_, i) => i);
            largeArray[500] = largeArray;
            const serialized = serialize(largeArray);
            const deserialized = deserialize(serialized) as any;
            expect(deserialized).toEqual(largeArray);
            expect(deserialized[500]).toEqual(largeArray);
        });

        test("should reject invalid format data", () => {
            const invalidData = new Uint8Array([1, 2, 3, 4]); // not our format

            expect(() => {
                deserialize(invalidData);
            }).toThrow(/Invalid binary format/);
        });

        test("should handle different array buffer views", () => {
            const data = { value: 42 };

            // test with Uint8Array
            const uint8Serialized = serialize(data);
            expect(deserialize(uint8Serialized)).toEqual(data);

            // test with ArrayBuffer
            const arrayBuffer = uint8Serialized.buffer;
            expect(deserialize(arrayBuffer as never)).toEqual(data);
        });
    });
});

// mock implementation tests
describe("Mock Tests", () => {
    test("should call checksum function during serialization", () => {
        mock.module("./serialize", () => {
            return {
                serialize,
                deserialize,
                BinarySerializer,
                BinaryDeserializer,
                crc32: mock().mockReturnValue(12345),
            };
        });

        serialize({ test: "data" });
        expect(crc32).toHaveBeenCalled();
    });

    test("should call checksum function during deserialization", () => {
        // first serialize with real implementation
        const data = { test: "verification" };
        const serialized = serialize(data);

        mock.module("./serialize", () => {
            return {
                serialize,
                deserialize,
                BinarySerializer,
                BinaryDeserializer,
                crc32: mock().mockReturnValue(
                    new DataView(serialized.buffer).getUint32(4, true), // get the actual checksum
                ),
            };
        });

        deserialize(serialized);
        expect(crc32).toHaveBeenCalled();
    });
});

// performance tests
describe("Performance", () => {
    test("serialization and deserialization should be reasonably fast", () => {
        const complexData = {
            items: Array.from({ length: 1000 }, (_, i) => ({
                id: `item-${i}`,
                value: Math.random() * 1000,
                active: i % 2 === 0,
                tags: Array.from({ length: 5 }, (_, j) => `tag-${j}`),
            })),
        };

        const start = performance.now();
        const serialized = serialize(complexData);
        const serializationTime = performance.now() - start;

        const startDeser = performance.now();
        deserialize(serialized);
        const deserializationTime = performance.now() - startDeser;

        // these are not strict assertions, just reasonable expectations
        // adjust thresholds based on your performance requirements
        expect(serializationTime).toBeLessThan(500); // milliseconds
        expect(deserializationTime).toBeLessThan(500); // milliseconds

        console.log(`Serialization time: ${serializationTime.toFixed(2)}ms`);
        console.log(`Deserialization time: ${deserializationTime.toFixed(2)}ms`);
        console.log(`Data size: ${serialized.length} bytes`);
    });
});

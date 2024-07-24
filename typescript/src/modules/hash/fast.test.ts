import { describe, expect, it } from "bun:test";
import { hash_djb2, hash_djb2_xor, hash_sdbm } from "./fast";

describe("hash_djb2", () => {
    // these were generated with the reference implementation in c
    const REFERENCE = [
        ["Empty string", "", 5381],
        ["Simple ASCII", "hello world", 894552257],
        ["Long ASCII string", "a".repeat(80), 3154686037],
        ["Special characters", "!@#$%^&*()_+", 3006899291],
        ["Unicode characters", "こんにちは世界", 1141554997],
        ["Emoji", "😂🦀👨‍👨‍👧‍👦", 2401348973],
        ["Mixed ASCII and Unicode", "Hello, 世界!", 2250154912],
        ["Control characters", "\t\n\r", 193387141],
        ["Similar strings 1", "abc", 193485963],
        ["Similar strings 2", "abd", 193485964],
        ["Surrogate pair", "𐐷", 2095260236],
    ] as const;

    describe("reference hashes", () => {
        REFERENCE.forEach(([description, input, hash]) => {
            it(`should match ${description}`, () => {
                expect(hash_djb2(input)).toBe(hash);
            });
        });
    });
    it("should return the same hash for identical strings", () => {
        const input = "hello world";
        expect(hash_djb2(input)).toBe(hash_djb2(input));
    });

    it("should return different hashes for different strings", () => {
        expect(hash_djb2("hello")).not.toBe(hash_djb2("world"));
    });

    it("should handle empty string", () => {
        expect(hash_djb2("")).toBe(5381); // The initial hash value
    });

    it("should handle long strings", () => {
        const longString = "a".repeat(1000);
        expect(hash_djb2(longString)).toBe(3510421101);
    });

    it("should handle strings with special characters", () => {
        expect(hash_djb2("!@#$%^&*()_+")).toBe(3006899291);
    });

    it("should handle strings with unicode characters", () => {
        expect(hash_djb2("こんにちは世界")).toBe(1141554997);
        expect(hash_djb2("😂🦀👨‍👨‍👧‍👦")).toBe(2401348973);
    });

    it("should return a 32-bit unsigned integer", () => {
        const result = hash_djb2("test");
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(4294967295); // Max 32-bit unsigned int
    });

    it("should be deterministic", () => {
        const inputs = ["a", "b", "hello", "world", "1234", "!@#$"];
        inputs.forEach((input) => {
            const hash1 = hash_djb2(input);
            const hash2 = hash_djb2(input);
            expect(hash1).toBe(hash2);
        });
    });

    it("should produce different hashes for similar strings", () => {
        expect(hash_djb2("abc")).not.toBe(hash_djb2("abd"));
        expect(hash_djb2("hello world")).not.toBe(hash_djb2("hello world "));
    });

    it("should handle control characters", () => {
        expect(hash_djb2("\t\n\r")).toBe(193387141);
    });

    it("should distribute hashes somewhat uniformly", () => {
        const hashes = new Set();
        for (let i = 0; i < 1000; i++) {
            hashes.add(hash_djb2(i.toString()));
        }
        expect(hashes.size).toBeGreaterThan(950); // Expect > 95% unique hashes
    });

    it("should handle null input", () => {
        // @ts-ignore
        expect(() => hash_djb2(null)).toThrow();
    });
});

describe("hash_djb2_xor", () => {
    const REFERENCE = [
        ["Empty string", "", 5381],
        ["Simple ASCII", "hello world", 4173747013],
        ["Long ASCII string", "a".repeat(80), 2191442437],
        ["Special characters", "!@#$%^&*()_+", 1703018977],
        ["Unicode characters", "こんにちは世界", 3539588181],
        ["Emoji", "😂🦀👨‍👨‍👧‍👦", 4090322871],
        ["Mixed ASCII and Unicode", "Hello, 世界!", 3556076190],
        ["Control characters", "\t\n\r", 193384427],
        ["Similar strings 1", "abc", 193409669],
        ["Similar strings 2", "abd", 193409666],
        ["Surrogate pair", "𐐷", 2083446658],
    ] as const;

    describe("reference hashes", () => {
        REFERENCE.forEach(([description, input, hash]) => {
            it(`should match ${description}`, () => {
                expect(hash_djb2_xor(input)).toBe(hash);
            });
        });
    });

    it("should handle long strings", () => {
        const longString = "a".repeat(10000);
        expect(() => hash_djb2_xor(longString)).not.toThrow();
        expect(hash_djb2_xor(longString)).toBe(398888453);
    });
});

describe("hash_sdbm", () => {
    const REFERENCE = [
        ["Empty string", "", 0],
        ["Simple ASCII", "hello world", 430867652],
        ["Long ASCII string", "a".repeat(80), 3857336832],
        ["Special characters", "!@#$%^&*()_+", 1133317162],
        ["Unicode characters", "こんにちは世界", 3372159416],
        ["Emoji", "😂🦀👨‍👨‍👧‍👦", 3878016972],
        ["Mixed ASCII and Unicode", "Hello, 世界!", 88772415],
        ["Control characters", "\t\n\r", 75009548],
        ["Similar strings 1", "abc", 807794786],
        ["Similar strings 2", "abd", 807794787],
        ["Surrogate pair", "𐐷", 3856437191],
    ] as const;

    describe("reference hashes", () => {
        REFERENCE.forEach(([description, input, hash]) => {
            it(`should match ${description}`, () => {
                expect(hash_sdbm(input)).toBe(hash);
            });
        });
    });

    it("should return the same hash for the same input string", () => {
        const input = "hello world";
        expect(hash_sdbm(input)).toBe(hash_sdbm(input));
    });

    it("should return different hashes for different input strings", () => {
        const input1 = "hello world";
        const input2 = "hello world!";
        expect(hash_sdbm(input1)).not.toBe(hash_sdbm(input2));
    });

    it("should handle empty strings", () => {
        expect(hash_sdbm("")).toBe(0);
    });

    it("should handle Unicode characters", () => {
        {
            const input = "こんにちは世界";
            expect(hash_sdbm(input)).toBe(3372159416);
        }
    });

    it("should return a 32-bit unsigned integer", () => {
        const input = "test string";
        const hash = hash_sdbm(input);
        expect(Number.isInteger(hash)).toBe(true);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThanOrEqual(4294967295); // 2^32 - 1
    });

    it("should be deterministic across different runs", () => {
        const testCases = [
            "hello",
            "world",
            "test",
            "sdbm",
            "hash function",
            "1234567890",
            "abcdefghijklmnopqrstuvwxyz",
        ];

        const expectedHashes = testCases.map(hash_sdbm);

        // Run the hash function again and compare results
        testCases.forEach((testCase, index) => {
            expect(hash_sdbm(testCase)).toBe(expectedHashes[index]!);
        });
    });

    it("should handle long strings", () => {
        const longString = "a".repeat(10000);
        expect(() => hash_sdbm(longString)).not.toThrow();
        expect(hash_sdbm(longString)).toBe(3635814912);
    });
});

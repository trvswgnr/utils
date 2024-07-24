import { describe, expect, it } from "bun:test";
import { hash_djb2, hash_djb2_xor, hash_sdbm } from "./fast";

describe("hash_djb2", () => {
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
});

describe("hash_djb2_xor", () => {
    it("should handle long strings", () => {
        const longString = "a".repeat(10000);
        expect(() => hash_djb2_xor(longString)).not.toThrow();
        expect(hash_djb2_xor(longString)).toBe(398888453);
    });
});

describe("hasb_sdbm", () => {
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

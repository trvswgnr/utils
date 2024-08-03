import type { Branded } from "../../types";

type BigIntArg = bigint | boolean | number | string;

export type u64 = Branded<bigint, "u64">;
export namespace u64 {
    export function parse(value: unknown): u64 | Error {
        try {
            return unsafe_parse(value);
        } catch (cause) {
            if (cause instanceof Error) return cause;
            return new Error(`${String(value)} is not a valid u64.`, { cause });
        }
    }

    export function unsafe_parse(value: unknown): u64 {
        if (
            typeof value !== "bigint" &&
            typeof value !== "boolean" &&
            typeof value !== "number" &&
            typeof value !== "string"
        ) {
            throw new Error(`${value} is not a valid u64`);
        }
        const a = BigInt(value);
        assert(a);
        return a;
    }

    export function guard(value: unknown): value is u64 {
        if (typeof value !== "bigint") return false;
        return value >= 0n;
    }

    export function assert(value: unknown): asserts value is u64 {
        if (!guard(value)) throw new Error(`${value} is not a valid u64`);
    }
}

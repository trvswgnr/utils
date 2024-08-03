import type { Branded } from "~/types";

export type i64 = Branded<bigint, "i64">;
export namespace i64 {
    export function parse<T extends string | number | bigint | boolean>(
        value: T,
    ): i64 | Error {
        try {
            return unsafe_parse(value);
        } catch (cause) {
            if (cause instanceof Error) return cause;
            return new Error(`${value} is not a valid i64.`, { cause });
        }
    }

    export function unsafe_parse(value: unknown): i64 {
        if (
            typeof value !== "bigint" &&
            typeof value !== "boolean" &&
            typeof value !== "number" &&
            typeof value !== "string"
        ) {
            throw new Error(`${value} is not a valid i64`);
        }
        const a = BigInt(value);
        assert(a);
        return a;
    }

    export function guard(value: unknown): value is i64 {
        if (typeof value !== "bigint") return false;
        const MIN_I64 = -(2n ** 63n);
        const MAX_I64 = 2n ** 63n - 1n;
        return value >= MIN_I64 && value <= MAX_I64;
    }

    export function assert(value: unknown): asserts value is i64 {
        if (!guard(value)) throw new Error(`${value} is not a valid i64`);
    }
}

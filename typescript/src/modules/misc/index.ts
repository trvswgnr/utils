export { fetchJson } from "./fetchJson";

/**
 * Performs an unsafe type cast from `unknown` to a specified type `T`.
 *
 * **WARNING**: This is an unsafe cast and should be used with extreme caution.
 * It bypasses TypeScript's type checking and can absolutely lead to runtime
 * errors if misused. The `Output` type is `never` by default which can be
 * applied to any type.
 *
 * @example
 * ```ts
 * type Foo = { bar: number };
 * const getBarFromFoo = (foo: Foo): number => foo.bar;
 * const x: unknown = { bar: 1 }; // defined elsewhere
 * const foo = cast<Foo>(x);
 * const bar = getBarFromFoo(foo);
 * console.assert(bar === 1);
 * ```
 *
 * @template T - The type to cast to. (Default: `never`)
 * @param input - The value to be cast, of type `unknown`.
 * @returns The input value cast to type `T`.
 */
export function cast<T = never>(input: unknown): T {
    return input as T;
}

declare const BRAND: unique symbol;
export type Branded<T, Brand> = T & { [BRAND]: Brand };

export type UInt32 = Branded<number, "UInt32">;
export function UInt32(n: number): UInt32 {
    return (n >>> 0) as UInt32;
}

export const BAIL = Symbol("BAIL");

export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        constructor;
    };
}

export function implPrototype<U, C extends new (...args: any[]) => any>(
    c: C,
    u: U,
): C & U {
    return class A extends c {
        constructor(...args: any[]) {
            super(...args);
            Object.assign(this, u);
        }
    } as any;
}

export function implStatic<U, C extends new (...args: any[]) => any>(
    c: C,
    u: U,
): C & U {
    return Object.assign(c, u);
}

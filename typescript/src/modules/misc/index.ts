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

/**
 * returns `true` if `T` is the `any` type, otherwise `false`
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

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

export function impl<U, C extends new (...args: any[]) => any>(
    c: C,
    u: U,
): new (...args: ConstructorParameters<C>) => InstanceType<C> & U {
    return class extends c {
        constructor(...args: any[]) {
            super(...args);
            Object.assign(this, u);
        }
    };
}

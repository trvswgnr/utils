import type { Branded } from "../../types";

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

export type UInt32 = Branded<number, "UInt32">;
export function UInt32(n: number): UInt32 {
    return (n >>> 0) as UInt32;
}

export const BAIL = Symbol("BAIL");

/**
 * A method decorator that logs the entry and exit of a method.
 *
 * @example
 * ```ts
 * class MyClass {
 *     @loggedMethod
 *     myMethod(arg: string) {
 *         return `Hello, ${arg}!`;
 *     }
 * }
 * ```
 */
export function loggedMethod<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
        This,
        (this: This, ...args: Args) => Return
    >,
) {
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
        console.log(`LOG: Entering method '${methodName}'.`);
        const result = target.call(this, ...args);
        console.log(`LOG: Exiting method '${methodName}'.`);
        return result;
    }

    return replacementMethod;
}

/**
 * A decorator that ensures a class implements a static method.
 *
 * @example
 * ```ts
 * @staticImplements<MyInterface>()
 * class MyClass {
 *     static myStaticMethod(arg: string) {
 *         return `Hello, ${arg}!`;
 *     }
 * }
 * ```
 */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        constructor;
    };
}

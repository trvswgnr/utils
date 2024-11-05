import type { AnyFn, Args, Branded, Constructor, Curried, Fn } from "../../types";

export { fetchJson } from "./fetchJson";
export { SemVer } from "./semver";

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
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
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

/**
 * Checks if the given value is a constructor function.
 *
 * @param x - The value to check
 * @returns A type predicate indicating whether x is of type `Constructor<T, A>`
 *
 * @example
 * ```ts
 * class MyClass {}
 * function regularFunction() {}
 * const arrowFunction = () => {};
 *
 * isConstructor(MyClass); // true
 * isConstructor(arrowFunction); // false
 * isConstructor(regularFunction); // true
 * isConstructor({}); // false
 * ```
 *
 * @note This method returns `true` for regular functions, as they can be
 * called with `new` in JavaScript.
 */
export function isConstructor<T, A extends Args>(x: unknown): x is Constructor<T, A> {
    if (typeof x !== "function") return false;
    if (!x.prototype) return false;
    try {
        Reflect.construct(String, [], x as never);
        return true;
    } catch (e) {
        return false;
    }
}

type PrimitiveMap = {
    string: string;
    number: number;
    boolean: boolean;
    symbol: symbol;
    bigint: bigint;
    undefined: undefined;
    function: Fn<readonly unknown[], unknown>;
    null: null;
    object: Record<PropertyKey, unknown>;
};

/**
 * Checks if the given value is an object and not null.
 *
 * @param x - The value to check.
 * @returns True if the value is an object (and not null), false otherwise.
 *
 * @example
 * ```ts
 * isObject({}) // true
 * isObject([]) // true
 * isObject(null) // false
 * isObject(42) // false
 * isObject("string") // false
 * ```
 */
export function isObject(x: unknown): x is Record<PropertyKey, unknown> {
    return typeof x === "object" && x !== null;
}

/**
 * Checks if the given value is an object with a specific key.
 *
 * @param x - The value to check.
 * @param key - The key to check for in the object.
 * @returns True if the value is an object and contains the specified key, false otherwise.
 *
 * @example
 * ```ts
 * const obj = { name: "John", age: 30 };
 * isObjectWithKey(obj, "name") // true
 * isObjectWithKey(obj, "address") // false
 * isObjectWithKey("not an object", "key") // false
 * ```
 */
export function isObjectWithKey<K extends string>(
    x: unknown,
    key: K,
): x is Record<K, unknown> {
    return isObject(x) && key in x;
}

/**
 * Checks if the given value is an object with a specific key of a primitive type.
 *
 * @param x - The value to check.
 * @param key - The key to check for in the object.
 * @param type - The primitive type to check for.
 * @returns A type predicate indicating whether x is a Record with key `K` of type `PrimitiveMap[T]`.
 */
export function isObjectWithKeyOfType<K extends string, T extends keyof PrimitiveMap>(
    x: unknown,
    key: K,
    type: T,
): x is Record<K, PrimitiveMap[T]>;
/**
 * Checks if the given value is an object with a specific key of a constructor type.
 *
 * @param x - The value to check.
 * @param key - The key to check for in the object.
 * @param type - The constructor type to check for.
 * @returns A type predicate indicating whether x is a Record with key `K` of type `InstanceType<T>`.
 */
export function isObjectWithKeyOfType<K extends string, T extends Constructor>(
    x: unknown,
    key: K,
    type: T,
): x is Record<K, InstanceType<T>>;
export function isObjectWithKeyOfType<
    K extends string,
    T extends keyof PrimitiveMap | Constructor,
>(
    x: unknown,
    key: K,
    type: T,
): x is Record<
    K,
    T extends Constructor
        ? InstanceType<T>
        : T extends keyof PrimitiveMap
        ? PrimitiveMap[T]
        : never
> {
    if (!isObject(x) || !(key in x)) return false;
    if (isConstructor(type)) return x[key] instanceof type;
    if (type === "object") return isObject(x[key]);
    if (type === "null") return x === null;
    return typeof x[key] === type;
}

/**
 * Checks if a value is of a specific primitive type (curried).
 *
 * @template T - A key of the PrimitiveMap type, representing primitive types.
 * @param x - The value to check.
 * @param t - The primitive type to check against.
 * @returns A type predicate indicating whether x is of type PrimitiveMap[T].
 */
export function isType<T extends keyof PrimitiveMap>(
    t: T,
): (x: unknown) => x is PrimitiveMap[T];
/**
 * Checks if a value is of a specific primitive type.
 *
 * @template T - A key of the PrimitiveMap type, representing primitive types.
 * @param x - The value to check.
 * @param t - The primitive type to check against.
 * @returns A type predicate indicating whether x is of type PrimitiveMap[T].
 */
export function isType<T extends keyof PrimitiveMap>(
    t: T,
    x: unknown,
): x is PrimitiveMap[T];
/**
 * Checks if a value is an instance of a specific constructor.
 *
 * @template T - A constructor type.
 * @param x - The value to check.
 * @param t - The constructor to check against.
 * @returns A type predicate indicating whether `x` is an instance of the given constructor.
 */
export function isType<T extends Constructor>(t: T, x: unknown): x is InstanceType<T>;
export function isType(t: any, x?: unknown) {
    if (arguments.length === 1) return (x: unknown) => isType(t, x);
    if (arguments.length !== 2) throw new RangeError("isType requires two arguments");
    if (isConstructor(t)) return x instanceof t;
    if (t === "object") return isObject(x);
    if (t === "null") return x === null;
    return typeof x === t;
}

const _isObject = (x: unknown) => isObject(x);

export namespace Type {
    /** checks if a given value is a string */
    export const isString = (x: unknown) => typeof x === "string";
    /** checks if a given value is a number */
    export const isNumber = (x: unknown) => typeof x === "number";
    /** checks if a given value is a boolean */
    export const isBoolean = (x: unknown) => typeof x === "boolean";
    /** checks if a given value is a symbol */
    export const isSymbol = (x: unknown) => typeof x === "symbol";
    /** checks if a given value is a bigint */
    export const isBigInt = (x: unknown) => typeof x === "bigint";
    /** checks if a given value is undefined */
    export const isUndefined = (x: unknown) => x === undefined;
    /** checks if a given value is a function */
    export const isFunction = (x: unknown) => typeof x === "function";
    /** checks if a given value is null */
    export const isNull = (x: unknown) => x === null;
    /** checks if a given value is an object */
    export const isObject = (x: unknown) => _isObject(x);
    /**
     * checks if a given value is an instance of a constructor
     * @note this is a curried function where the first argument is a constructor and the second is a value to check
     * @returns a type predicate indicating whether `x` is an instance of the given constructor.
     */
    export function is<C extends Constructor>(ctor: C) {
        return (x: unknown): x is InstanceType<C> => x instanceof ctor;
    }
}

export function curry<T extends AnyFn, TAgg extends unknown[]>(
    func: T,
    agg?: TAgg,
): Curried<T> {
    const aggregatedArgs = agg ?? [];
    if (func.length === aggregatedArgs.length) return func(...aggregatedArgs);
    return ((arg: any) => curry(func, [...aggregatedArgs, arg])) as any;
}

export function flip<A, B, C>(f: (a: A) => (b: B) => C): (b: B) => (a: A) => C;
export function flip<A, B, C, F>(f: (a: A, b: B) => C): (b: B, a: A) => C;
export function flip<A, B>(f: AnyFn) {
    if (f.length === 1) return (b: B) => (a: A) => f(a)(b);
    return (b: B, a: A) => f(a, b);
}

export class StreamingResponse<T extends ReadableStream> extends Response {
    constructor(stream: T, init?: ResponseInit) {
        init = init ?? {};
        init.headers = {
            ...init.headers,
            "Transfer-Encoding": "chunked",
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
        };
        super(stream, init);
    }
}

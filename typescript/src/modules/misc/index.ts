import type { AnyFn, Args, Branded, Constructor, Curried, Fn } from "../../types";

export { fetchJson, intoError, isOkResponse, parseWith, resultOf } from "./fetchJson";
export { SemVer, validateMatch } from "./semver";
export {
    Ordering,
    compare,
    isOrd,
    type Comparable,
    type Ord,
    type PartialEq,
    type PartialOrd,
} from "./cmp";

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

/**
 * A specialized Response class for handling streaming data with appropriate HTTP headers.
 * This class extends the standard Response class to provide proper configuration for
 * streaming responses, particularly useful in server-sent events or large data transfers.
 *
 * @template T - Type parameter extending ReadableStream, representing the type of stream being handled
 *
 * @example
 * ```ts
 * const stream = new ReadableStream({...});
 * const response = new StreamingResponse(stream, {
 *   status: 200,
 *   statusText: 'OK'
 * });
 * ```
 *
 * @remarks
 * The constructor automatically sets several important headers for streaming:
 * - Transfer-Encoding: chunked - Enables chunked transfer encoding
 * - Connection: keep-alive - Maintains persistent connection
 * - Cache-Control: no-cache - Prevents caching of the stream
 * - X-Content-Type-Options: nosniff - Prevents MIME type sniffing
 */
export class StreamingResponse<T extends ReadableStream> extends Response {
    constructor(
        /** The ReadableStream to be sent in the response */
        stream: T,
        /** Optional ResponseInit configuration object */
        init: ResponseInit = {},
    ) {
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

/**
 * A controller class for managing streaming data with transformation capabilities.
 * This class handles the creation and management of a readable stream, transforming
 * data from a generator into a byte stream.
 *
 * @template T - The type of data being streamed before transformation to Uint8Array
 *
 * @example
 * ```ts
 * // Create a controller that streams numbers and converts them to strings
 * const controller = new StreamController<number>(
 *   function* () {
 *     yield 1;
 *     yield 2;
 *     yield 3;
 *   },
 *   (num) => new TextEncoder().encode(num.toString())
 * );
 *
 * // Create a response from the stream
 * const response = controller.response({ headers: { "Content-Type": "text/plain" } });
 * ```
 */
export class StreamController<T> {
    /** The readable stream containing the transformed data */
    public readonly stream: ReadableStream<T>;
    /** Writer interface for the underlying transform stream */
    private readonly writer: WritableStreamDefaultWriter<Uint8Array>;
    /** Generator function that produces the data to be streamed */
    private readonly generator: () => AsyncIterator<T> | Iterator<T>;
    /** Function to transform the generated data into bytes */
    private readonly transform: (data: T) => Uint8Array;
    /** Error logging function, defaults to console.error */
    private readonly logger: (...args: any[]) => void | Promise<void> = console.error;
    /** Flag indicating if the stream is in the process of closing */
    private isClosing = false;

    public constructor(
        /** A function that returns an iterator or async iterator of type T */
        generator: () => AsyncIterator<T> | Iterator<T>,
        /** A function that converts values of type T into Uint8Array */
        transform: (data: T) => Uint8Array,
        /** Optional custom error logging function */
        logger: (...args: any[]) => void | Promise<void> = console.error,
    ) {
        this.generator = generator;
        this.transform = transform;
        this.logger = logger;
        const stream = new TransformStream<Uint8Array, T>();
        this.writer = stream.writable.getWriter();
        this.stream = stream.readable;
        this.processStream();
    }

    /**
     * Safely closes the stream and cleans up resources.
     * This method ensures the stream is only closed once.
     *
     * @returns A promise that resolves when cleanup is complete
     */
    public async cleanup(): Promise<void> {
        if (this.isClosing) return;
        this.isClosing = true;
        try {
            await this.writer.close();
        } catch (e) {
            // ignore errors during cleanup
        }
    }

    /**
     * Creates a StreamingResponse instance from the current stream.
     *
     * @param init - Optional ResponseInit configuration object
     * @returns A new StreamingResponse configured for streaming
     */
    public response(init?: ResponseInit) {
        return new StreamingResponse(this.stream, init);
    }

    /**
     * Internal method that processes the stream data.
     * Handles the iteration over generated data, transformation, and error handling.
     *
     * @returns A promise that resolves when the stream is fully processed
     *
     * @private
     */
    private async processStream(): Promise<void> {
        try {
            const iterator = { [Symbol.asyncIterator]: () => this.generator() };
            for await (const item of iterator) {
                if (this.isClosing) break;
                const transformed = this.transform(item);
                await this.writer.write(transformed);
            }
        } catch (e) {
            if (!this.isClosing && e !== undefined) {
                const error =
                    e instanceof Error
                        ? e
                        : new Error(
                              typeof e === "string"
                                  ? e
                                  : "unknown error while processing stream",
                          );
                await this.logger(`stream error: ${error.message}`);
            }
        } finally {
            await this.cleanup();
        }
    }
}

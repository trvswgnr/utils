type IsAny<T> = 0 extends 1 & T ? true : false;

type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

type Ok<T> = T extends Error ? never : IsAny<T> extends true ? never : T;

type Err<E extends Error> = E & Error;

function Ok<T>(value: T): Ok<T> {
    return value as Ok<T>;
}

function Err(e: unknown): Err<Error> {
    return Err.from(e);
}

module Err {
    /**
     * Converts any unknown value into an Error object.
     *
     * This function handles two cases uniquely:
     * 1. If the input is already an Error, it's returned as-is.
     * 2. If the input is a non-null object, it's stringified and wrapped in an
     *    Error.
     *
     * For all other types, the input is coerced to a string and wrapped in an
     * Error.
     *
     * @param e - The value to convert into an Error.
     * @returns An {@link Error} object.
     */
    export function from(e: unknown): Err<Error> {
        if (e instanceof Error) {
            return e;
        }
        if (typeof e === "object" && e !== null) {
            return new Error(JSON.stringify(e));
        }
        return new Error(String(e));
    }

    /**
     * Creates a factory function for generating custom Error types.
     *
     * This factory function creates a new function that behaves similarly to
     * `from`, but uses the provided constructor to create errors of a specific
     * type. It's useful for creating domain-specific error handlers.
     *
     * The returned function handles two cases:
     * 1. If the input is an Error, a new error of the custom type is created
     *    with the same message.
     * 2. If the input is a non-null object, it's stringified and wrapped in the
     *    custom Error type.
     *
     * For all other types, the input is converted to a string and wrapped in
     * the custom Error type.
     *
     * @param Ctor - The constructor for the custom Error type.
     * @returns A function that converts unknown values into the specified Error
     * type.
     */
    export function factory<E extends Error>(
        Ctor: new (message: string) => E,
    ): (e: unknown) => Err<E> {
        return (e: unknown) => {
            if (e instanceof Error) {
                return new Ctor(e.message);
            }
            if (typeof e === "object" && e !== null) {
                return new Ctor(JSON.stringify(e));
            }
            return new Ctor(String(e));
        };
    }
}

/**
 * Result is a type that represents the result of a function.
 *
 * The beauty of this implementation is that it is either `Ok<T>` or `Err<E>`,
 * where `E` extends `Error`, and `T` never extends `Error`. This means that we
 * can use this type to represent the result of a function without having to
 * allocate any additional memory, and it also integrates well with regular
 * TypeScript.
 *
 * For instance, you can just use `(r instanceof Error)` to narrow the type.
 *
 * This is different from the `Either` type in that it doesn't have any
 * additional runtime overhead and doesn't require extracting the value from the
 * `Ok` or `Err` types.
 */
module Result {
    export function ok<T>(v: Ok<T>): Ok<T> {
        return v;
    }

    export function err<E extends Error>(e: E): Err<E> {
        return e;
    }

    export function isOk<T, E extends Error>(r: Result<T, E>): r is Ok<T> {
        return !(r instanceof Error);
    }

    export function isErr<T, E extends Error>(r: Result<T, E>): r is Err<E> {
        return r instanceof Error;
    }

    export function of<A extends readonly any[], R>(
        fn: (...args: A) => Ok<R>,
        ...args: A
    ): Result<R, Error> {
        try {
            return fn(...args);
        } catch (e) {
            return Err.from(e);
        }
    }

    export function getOk<T, E extends Error>(r: Result<T, E>): T {
        if (isErr(r)) throw new Error("Expected Ok, got Err");
        return r;
    }

    export function getErr<T, E extends Error>(r: Result<T, E>): E {
        if (isOk(r)) throw new Error("Expected Err, got Ok");
        return r;
    }

    export function map<T, E extends Error, U>(
        r: Result<T, E>,
        fn: (x: T) => Ok<U>,
    ): Result<U, E> {
        if (isErr(r)) return r;
        return fn(r);
    }

    export function orElse<T, E extends Error>(
        r: Result<T, E>,
        fn: (x: E) => Result<T, E>,
    ): Result<T, E> {
        if (isOk(r)) return r;
        return fn(r);
    }

    export function match<T, E extends Error, A, B>(
        r: Result<T, E>,
        fns: {
            Ok: (x: T) => A;
            Err: (x: E) => B;
        },
    ): A | B {
        if (isErr(r)) return fns.Err(r);
        return fns.Ok(r);
    }

    // export function toOption<T, E extends Error>(r: Result<T, E>): Option<T>
    //     { return isOk(r) ? r ?? null : null;
    // }

    // export function toMaybe<T, E extends Error>(r: Result<T, E>): Maybe<T> {
    //     return isOk(r) ? Maybe.just(r) : Maybe.nothing();
    // }

    // export function toEither<T, E extends Error>( r: Result<T, E>, ):
    //     Either<E, T> { return isOk(r) ? Either.right(r) : Either.left(r);
    // }

    export function toArray<T, E extends Error>(r: Result<T, E>): [T] | [] {
        return isOk(r) ? [r] : [];
    }
}

export { Result, Ok, Err };

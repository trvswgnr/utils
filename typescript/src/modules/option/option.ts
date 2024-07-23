import type { Result, Ok } from "../result";

export { Option, Some, None };

type Some<T> = NonNullable<T>;
function Some<T extends {}>(value: T): Option<T> {
    return value;
}

type None = null | undefined;
function None<T = never>(): Option<T> {
    return null;
}

type Option<T> = Some<T> | None;

namespace Option {
    export const none = None;
    export const some = Some;

    export function isSome<T>(value: Option<T>): value is Some<T> {
        return value !== null && value !== undefined;
    }

    export function isNone<T>(value: Option<T>): value is None {
        return value === null || value === undefined;
    }

    export function map<T, U>(
        value: Option<T>,
        fn: (value: T) => U,
    ): Option<U> {
        return value ? fn(value) : (null as any);
    }

    export function from<T extends NonNullable<unknown>>(
        value: T | null | undefined,
    ): Option<T> {
        return value ?? null;
    }

    export function of<A extends readonly any[], R>(
        fn: (...args: A) => Some<R>,
        ...args: A
    ): Option<R> {
        try {
            return fn(...args);
        } catch {
            return null;
        }
    }

    export function match<T, A, B>(
        value: Option<T>,
        fns: {
            Some: (value: T) => A;
            None: () => B;
        },
    ): A | B {
        return value ? fns.Some(value) : fns.None();
    }

    export function toResult<T extends {}, E extends Error>(
        onNone: () => E,
        o: Option<T>,
    ): Result<T, E> {
        if (isNone(o)) {
            return onNone();
        }
        return o as Ok<T>;
    }

    // export function toEither<L, R>(_none: () => L, o: Option<R>): Either<L, R> {
    //     return isSome(o) ? Either.right(o) : Either.left(_none());
    // }

    // export function toMaybe<T extends {}>(o: Option<T>): Maybe<T> {
    //     return isSome(o) ? Maybe.just(o) : Maybe.nothing();
    // }
}


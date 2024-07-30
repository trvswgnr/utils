import type { MonadInstance, Monad } from "./monad";
import type * as HKT from "./hkt";
import type { Functor, FunctorInstance } from "./functor";
import type { Applicative, ApplicativeInstance } from "./applicative";

export interface EitherKind extends HKT.Kind {
    readonly type: Either<this["Out"], this["Target"]>;
}

export type Either<L, R> = Left<L> | Right<R>;

export interface Left<L> extends EitherInstance {
    readonly type: "Either";
    readonly variant: "Left";
    readonly value: L;
}

export interface Right<R> extends EitherInstance {
    readonly type: "Either";
    readonly variant: "Right";
    readonly value: R;
}

export interface EitherInstance
    extends FunctorInstance<EitherKind>,
        ApplicativeInstance<EitherKind>,
        MonadInstance<EitherKind> {
    isLeft<L, R>(this: Either<L, R>): this is Left<L>;
    isRight<L, R>(this: Either<L, R>): this is Right<R>;
    match<L, R, A, B>(
        this: Either<L, R>,
        matchers: { Left: (value: L) => A; Right: (value: R) => B },
    ): A | B;
}

export interface EitherStatic
    extends Functor<EitherKind>,
        Applicative<EitherKind>,
        Monad<EitherKind> {
    isLeft: <L, R>(e: Either<L, R>) => e is Left<L>;
    isRight: <L, R>(e: Either<L, R>) => e is Right<R>;
    match: <L, R, T>(
        e: Either<L, R>,
    ) => (matchers: { Left: (value: L) => T; Right: (value: R) => T }) => T;
}

export const Either = class EitherConstructor<L, R> implements EitherInstance {
    public readonly type = "Either";
    public readonly variant: "Left" | "Right";
    public readonly value: L | R;

    private constructor(value: L | R, variant: "Left" | "Right") {
        this.variant = variant;
        this.value = value;
    }

    // Functor

    public static fmap =
        <A0, B>(f: (a: A0) => B) =>
        <A>(ea: Either<A, A0>): Either<A, B> => {
            return ea.isLeft() ? ea : Right(f(ea.value));
        };

    // Applicative

    public static pure = <A>(a: A): Either<never, A> => Right(a);

    public static ap =
        <E, A, B>(ff: Either<E, (a: A) => B>) =>
        (ea: Either<E, A>): Either<E, B> => {
            if (ff.isLeft()) {
                return Left(ff.value) as any;
            }
            if (ea.isLeft()) {
                return Left(ea.value) as any;
            }
            return Right(ff.value(ea.value));
        };

    // Monad

    public static return = this.pure;

    public static bind =
        <E, A>(ea: Either<E, A>) =>
        <B>(f: (a: A) => Either<E, B>): Either<E, B> => {
            if (ea.isLeft()) {
                return Left(ea.value);
            }
            return f(ea.value);
        };

    // EitherStatic

    public static isLeft = <L, R>(e: Either<L, R>): e is Left<L> => {
        return e.variant === "Left";
    };

    public static isRight = <L, R>(e: Either<L, R>): e is Right<R> => {
        return e.variant === "Right";
    };

    public static match =
        <L, R, T>(e: Either<L, R>) =>
        (matchers: { Left: (value: L) => T; Right: (value: R) => T }) => {
            return e.isLeft()
                ? matchers.Left(e.value)
                : matchers.Right(e.value);
        };

    // FunctorInstance

    public fmap<E, A, B>(this: Either<E, A>, f: (a: A) => B): Either<E, B> {
        return EitherConstructor.fmap(f)(this);
    }

    // ApplicativeInstance

    public ap<E, A, B>(
        this: Either<E, A>,
        ff: Either<E, (a: A) => B>,
    ): Either<E, B> {
        return EitherConstructor.ap(ff)(this);
    }

    // MonadInstance

    public bind<E, A, B>(
        this: Either<E, A>,
        f: (a: A) => Either<E, B>,
    ): Either<E, B> {
        return EitherConstructor.bind(this)(f);
    }

    // EitherInstance

    public isLeft<L, R>(this: Either<L, R>): this is Left<L> {
        return Either.isLeft(this);
    }

    public isRight<L, R>(this: Either<L, R>): this is Right<R> {
        return Either.isRight(this);
    }

    public match<L, R, A, B>(
        this: Either<L, R>,
        matchers: { Left: (value: L) => A; Right: (value: R) => B },
    ): A | B {
        return this.isLeft()
            ? matchers.Left(this.value)
            : matchers.Right(this.value);
    }
} satisfies EitherStatic;

export function Left<L>(v: L): Either<L, never> {
    return new (Either as any)(v, "Left") as Either<L, never>;
}

export function Right<R>(v: R): Either<never, R> {
    return new (Either as any)(v, "Right") as Either<never, R>;
}

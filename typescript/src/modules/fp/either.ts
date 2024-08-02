import type { MonadInstance, Monad } from "./monad";
import type * as HKT from "./hkt";
import type { Functor, FunctorInstance } from "./functor";
import type { Applicative, ApplicativeInstance } from "./applicative";

export interface EitherKind extends HKT.Kind {
    readonly type: Either<this["Out1"], this["Target"]>;
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
    readonly type = "Either";
    readonly variant: "Left" | "Right";
    readonly value: L | R;

    private constructor(value: L | R, variant: "Left" | "Right") {
        this.variant = variant;
        this.value = value;
    }

    // Functor

    static fmap =
        <A0, B>(f: (a0: A0) => B) =>
        <A>(ea: Either<A, A0>): Either<A, B> => {
            return ea.isLeft() ? ea : Right(f(ea.value));
        };

    // Applicative

    static pure = <A>(a: A): Either<never, A> => Right(a);

    static apply =
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

    static return = this.pure;

    static bind =
        <E, A>(ea: Either<E, A>) =>
        <B>(f: (a: A) => Either<E, B>): Either<E, B> => {
            if (ea.isLeft()) {
                return Left(ea.value);
            }
            return f(ea.value);
        };

    // EitherStatic

    static isLeft = <L, R>(e: Either<L, R>): e is Left<L> => {
        return e.variant === "Left";
    };

    static isRight = <L, R>(e: Either<L, R>): e is Right<R> => {
        return e.variant === "Right";
    };

    static match =
        <L, R, T>(e: Either<L, R>) =>
        (matchers: { Left: (value: L) => T; Right: (value: R) => T }) => {
            return e.isLeft()
                ? matchers.Left(e.value)
                : matchers.Right(e.value);
        };

    // FunctorInstance

    fmap<E, A, B>(this: Either<E, A>, f: (a: A) => B): Either<E, B> {
        return EitherConstructor.fmap(f)(this);
    }

    // ApplicativeInstance

    apply<E, A, B>(
        this: Either<E, A>,
        ff: Either<E, (a: A) => B>,
    ): Either<E, B> {
        return EitherConstructor.apply(ff)(this);
    }

    // MonadInstance

    bind<E, A, B>(this: Either<E, A>, f: (a: A) => Either<E, B>): Either<E, B> {
        return EitherConstructor.bind(this)(f);
    }

    // EitherInstance

    isLeft<L, R>(this: Either<L, R>): this is Left<L> {
        return Either.isLeft(this);
    }

    isRight<L, R>(this: Either<L, R>): this is Right<R> {
        return Either.isRight(this);
    }

    match<L, R, A, B>(
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

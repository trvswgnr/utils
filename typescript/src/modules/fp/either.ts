import type { BoundMonad, Monad } from "./monad";
import type * as HKT from "./hkt";

export interface EitherKind extends HKT.Kind {
    readonly type: Either<this["Out"], this["Target"]>;
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export interface Left<L, R> extends BoundEither<L, R> {
    readonly type: "Either";
    readonly variant: "Left";
    readonly left: L;
}

export interface Right<L, R> extends BoundEither<L, R> {
    readonly type: "Either";
    readonly variant: "Right";
    readonly right: R;
}

export interface BoundEither<L, R> extends BoundMonad<EitherKind> {
    isLeft: () => this is Left<L, R>;
    isRight: () => this is Right<L, R>;
    match<L, R, A, B>(
        this: Either<L, R>,
        matchers: { onLeft: (value: L) => A; onRight: (value: R) => B },
    ): A | B;
}

export interface MonadStatic extends Monad<EitherKind> {
    left<L>(l: L): Either<L, never>;
    right<R>(r: R): Either<never, R>;
}

export const Either: MonadStatic = class EitherClass<L, R> {
    public readonly type = "Either";
    public readonly variant: string;
    public readonly value: L | R;

    private constructor(value: L | R, variant: string) {
        this.variant = variant;
        this.value = value;
    }

    public static left<L>(v: L): Either<L, never> {
        return new EitherClass<L, never>(v, "Left") as any;
    }

    public static right<R>(v: R): Either<never, R> {
        return new EitherClass<never, R>(v, "Right") as any;
    }

    public isLeft(): this is Left<L, R> {
        return this.variant === "Left";
    }

    public isRight(): this is Right<L, R> {
        return this.variant === "Right";
    }

    public static fmap<E, A, B>(
        f: (a: E) => B,
        ea: Either<A, E>,
    ): Either<A, B> {
        return ea.isLeft() ? ea : (Either.right(f(ea.right)) as any);
    }

    public static pure<E>(e: E): Either<never, E> {
        return Either.right(e);
    }

    public static ap<E, A, B>(
        ff: Either<E, (a: A) => B>,
        ea: Either<E, A>,
    ): Either<E, B> {
        if (ff.isLeft()) {
            return Either.left(ff.left);
        }
        if (ea.isLeft()) {
            return Either.left(ea.left);
        }
        return Either.right(ff.right(ea.right));
    }

    public static return<E>(e: E): Either<never, E> {
        return Either.right(e);
    }

    public static flapMap<E, A, B>(
        ea: Either<E, A>,
        f: (a: A) => Either<E, B>,
    ): Either<E, B> {
        if (ea.isLeft()) {
            return Either.left(ea.left);
        }
        return f(ea.right);
    }
};

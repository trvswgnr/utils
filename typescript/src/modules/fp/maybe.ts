import type { BoundMonad, Monad } from "./monad";
import type * as HKT from "./hkt";

const NOTHING = Symbol("NOTHING");

export interface MaybeKind extends HKT.Kind {
    readonly type: Maybe<this["Target"]>;
}

export type Maybe<T> = Just<T> | Nothing<T>;

export interface Just<out T> extends BoundMaybe<T> {
    readonly type: "Maybe";
    readonly variant: "Just";
    readonly value: T;
}

export interface Nothing<out T> extends BoundMaybe<T> {
    readonly type: "Maybe";
    readonly variant: "Nothing";
}

export interface BoundMaybe<T> extends BoundMonad<MaybeKind> {
    isNothing: () => this is Nothing<T>;
    isJust: () => this is Just<T>;
    match: <A, B>(
        this: Maybe<A>,
        matchers: { onJust: (value: A) => B; onNothing: () => B },
    ) => B;
    get(): T;
    get(defaultValue: T): T;
}

export interface MaybeStatic extends Monad<MaybeKind> {
    just<T>(v: T): Maybe<T>;
    nothing<T>(): Maybe<T>;
    of<T>(value: T | null | undefined): Maybe<T>;
}

export const Maybe = class MaybeClass<T> implements BoundMaybe<T> {
    public readonly type = "Maybe";
    public readonly variant: string;
    public readonly value: T;

    private constructor(value: T, variant: string) {
        this.variant = variant;
        this.value = value;
    }

    public static just<T>(v: T): Maybe<T> {
        return new MaybeClass<T>(v, "Just") as any;
    }

    public static nothing<T>(): Maybe<T> {
        return new MaybeClass<T>(undefined as T, "Nothing") as any;
    }

    public static of<T>(value: T | null | undefined): Maybe<T> {
        if (value === undefined || value === null) {
            return Maybe.nothing();
        }
        return Maybe.just(value as T);
    }

    public static return<A>(a: A): Maybe<A> {
        return Maybe.just(a);
    }

    public static pure<A>(a: A): Maybe<A> {
        return Maybe.just(a);
    }

    public isNothing(): this is Nothing<T> {
        return this.variant === "Nothing";
    }

    public isJust(): this is Just<T> {
        return this.variant === "Just";
    }

    public match<A, B>(
        this: Maybe<A>,
        matchers: { onJust: (value: A) => B; onNothing: () => B },
    ): B {
        if (this.isJust()) {
            return matchers.onJust(this.value);
        }
        return matchers.onNothing();
    }

    public get(defaultValue: T | typeof NOTHING = NOTHING): T {
        if (this.isJust()) {
            return this.value;
        }
        if (defaultValue !== NOTHING) {
            return defaultValue;
        }
        throw new Error("Maybe is Nothing");
    }

    public static fmap<A, B>(f: (a: A) => B): (fa: Maybe<A>) => Maybe<B>;
    public static fmap<A, B>(f: (a: A) => B, fa: Maybe<A>): Maybe<B>;
    public static fmap<A, B>(f: (a: A) => B, fa?: Maybe<A>) {
        // partial application
        if (fa === undefined) {
            return (fa: Maybe<A>) => Maybe.fmap(f, fa);
        }

        if (fa.isJust()) {
            return Maybe.just(f(fa.value));
        }
        return Maybe.nothing();
    }

    public static apply<A>(
        fa: Maybe<A>,
    ): <B>(ff: Maybe<(a: A) => B>) => Maybe<B>;
    public static apply<A, B>(fa: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B>;
    public static apply<A, B>(fa: Maybe<A>, ff?: Maybe<(a: A) => B>) {
        // partial application
        if (ff === undefined) {
            return (ff: Maybe<(a: A) => B>) => Maybe.apply(fa, ff);
        }

        if (fa.isJust() && ff.isJust()) {
            return Maybe.just(ff.value(fa.value));
        }
        return Maybe.nothing<B>();
    }

    public static bind<A, B>(ma: Maybe<A>): (f: (a: A) => Maybe<B>) => Maybe<B>;
    public static bind<A, B>(ma: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B>;
    public static bind<A, B>(ma: Maybe<A>, f?: (a: A) => Maybe<B>) {
        // partial application
        if (f === undefined) {
            return (f: (a: A) => Maybe<B>) => Maybe.bind(ma, f);
        }

        if (ma.isNothing()) {
            return Maybe.nothing<B>();
        }
        return f(ma.value);
    }

    public bind<A, B>(this: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
        return Maybe.bind(this, f);
    }

    public apply<A, B>(this: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B> {
        return Maybe.apply(this, ff);
    }

    public fmap<A, B>(this: Maybe<A>, f: (a: A) => B): Maybe<B> {
        return Maybe.fmap(f, this);
    }
} satisfies MaybeStatic;

export const Just = Maybe.just;
export const Nothing = Maybe.nothing;

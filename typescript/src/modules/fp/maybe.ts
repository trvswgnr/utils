import type { Monad, MonadConstructor, MonadStatic } from "./monad";
import type * as HKT from "./hkt";

const NOTHING = Symbol("NOTHING");

export interface MaybeKind extends HKT.Kind {
    readonly type: Maybe<this["In1"]>;
}

export type Maybe<T> = Just<T> | Nothing;

export interface Just<T> extends IMaybe<T> {
    readonly type: "Maybe";
    readonly variant: "Just";
    readonly value: T;
}

export interface Nothing extends IMaybe<never> {
    readonly type: "Maybe";
    readonly variant: "Nothing";
}

export interface IMaybe<T> extends Monad<MaybeKind> {
    isNothing: () => this is Nothing;
    isJust: () => this is Just<T>;
    match: <A, B>(
        this: Maybe<A>,
        matchers: { onJust: (value: A) => B; onNothing: () => B },
    ) => B;
    get(): T;
    get(defaultValue: T): T;
}

export interface MaybeStatic extends MonadConstructor<MaybeKind> {
    just<T>(v: T): Maybe<T>;
    nothing<T>(): Maybe<T>;
    of<T>(value: T | null | undefined): Maybe<T>;
}

export const Maybe = class MaybeClass<T> implements IMaybe<T> {
    public readonly type = "Maybe";
    public readonly variant: string;
    public readonly value: T;

    private constructor(value: T, variant: string) {
        this.variant = variant;
        this.value = value;
    }

    // MaybeStatic

    static just<T>(v: T): Maybe<T> {
        return new MaybeClass<T>(v, "Just") as any;
    }
    static nothing<T>(): Maybe<T> {
        return new MaybeClass<T>(undefined as T, "Nothing") as any;
    }
    static of<T>(value: T | null | undefined): Maybe<T> {
        if (value === undefined || value === null) {
            return Maybe.nothing();
        }
        return Maybe.just(value as T);
    }
    static return<A>(a: A): Maybe<A> {
        return Maybe.just(a);
    }
    static pure<A>(a: A): Maybe<A> {
        return Maybe.just(a);
    }

    // IMaybe

    isNothing(): this is Nothing {
        return this.variant === "Nothing";
    }
    isJust(): this is Just<T> {
        return this.variant === "Just";
    }
    match<A, B>(
        this: Maybe<A>,
        matchers: { onJust: (value: A) => B; onNothing: () => B },
    ): B {
        if (this.isJust()) {
            return matchers.onJust(this.value);
        }
        return matchers.onNothing();
    }
    get(defaultValue: T | typeof NOTHING = NOTHING): T {
        if (this.isJust()) {
            return this.value;
        }
        if (defaultValue !== NOTHING) {
            return defaultValue;
        }
        throw new Error("Maybe is Nothing");
    }

    // IMonad

    bind<A, B>(this: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
        return Maybe.bind(this, f);
    }

    // IApplicative

    apply<A, B>(this: Maybe<A>, mf: Maybe<(a: A) => B>): Maybe<B> {
        return Maybe.apply(this, mf);
    }

    // IFunctor

    fmap<A, B>(this: Maybe<A>, f: (a: A) => B): Maybe<B> {
        return Maybe.fmap(this, f);
    }

    // MonadStatic

    static fmap<A, B>(fa: Maybe<A>): (f: (a: A) => B) => Maybe<B>;
    static fmap<A, B>(fa: Maybe<A>, f: (a: A) => B): Maybe<B>;
    static fmap<A, B>(fa: Maybe<A>, f?: (a: A) => B) {
        // partial application
        if (f === undefined) {
            return (f: (a: A) => B) => Maybe.fmap(fa, f);
        }

        if (fa.isJust()) {
            return Maybe.just(f(fa.value));
        }
        return Maybe.nothing();
    }

    static apply<A>(fa: Maybe<A>): <B>(ff: Maybe<(a: A) => B>) => Maybe<B>;
    static apply<A, B>(fa: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B>;
    static apply<A, B>(fa: Maybe<A>, ff?: Maybe<(a: A) => B>) {
        // partial application
        if (ff === undefined) {
            return (ff: Maybe<(a: A) => B>) => Maybe.apply(fa, ff);
        }

        if (fa.isJust() && ff.isJust()) {
            return Maybe.just(ff.value(fa.value));
        }
        return Maybe.nothing<B>();
    }

    static bind<A, B>(ma: Maybe<A>): (f: (a: A) => Maybe<B>) => Maybe<B>;
    static bind<A, B>(ma: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B>;
    static bind<A, B>(ma: Maybe<A>, f?: (a: A) => Maybe<B>) {
        // partial application
        if (f === undefined) {
            return (f: (a: A) => Maybe<B>) => Maybe.bind(ma, f);
        }

        if (ma.isNothing()) {
            return Maybe.nothing<B>();
        }
        return f(ma.value);
    }
} satisfies MaybeStatic & MonadStatic<MaybeKind>;

export const Just = Maybe.just;
export const Nothing = Maybe.nothing;

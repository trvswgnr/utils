import type { MonadInstance, Monad } from "./monad";
import type * as HKT from "./hkt";
import type { Functor, FunctorInstance } from "./functor";
import type { Applicative, ApplicativeInstance } from "./applicative";
import type { MatchInstance } from "./lib";

export interface MaybeKind extends HKT.Kind {
    readonly type: Maybe<this["Target"]>;
}

export type Maybe<T> = Just<T> | Nothing;

export interface Just<out T> extends MaybeInstance {
    readonly type: "Maybe";
    readonly variant: "Just";
    readonly value: T;
}

export interface Nothing extends MaybeInstance {
    readonly type: "Maybe";
    readonly variant: "Nothing";
}

export interface MaybeStatic
    extends Functor<MaybeKind>,
        Applicative<MaybeKind>,
        Monad<MaybeKind> {
    /**
     * Takes a default value, a function, and a `Maybe` value. If the `Maybe`
     * value is `Nothing`, the function returns the default value. Otherwise, it
     * applies the function to the value inside the `Just` and returns the
     * result.
     */
    maybe: <B>(defaultValue: B) => <A>(f: (a: A) => B) => (ma: Maybe<A>) => B;
    /**
     * Checks if the `Maybe` is `Just`.
     */
    isJust<A>(ma: Maybe<A>): ma is Just<A>;
    /**
     * Checks if the `Maybe` is `Nothing`.
     */
    isNothing<A>(ma: Maybe<A>): ma is Nothing;
    /**
     * Extracts the element out of a `Just` and throws an error if its argument
     * is `Nothing`.
     * @throws {Error} if the `Maybe` is `Nothing`
     */
    fromJust<A>(ma: Maybe<A>): A;
    /**
     * Takes a default value and a `Maybe` value. If the `Maybe` is `Nothing`,
     * it returns the default value; otherwise, it returns the value contained
     * in the `Maybe`.
     */
    fromMaybe: <A>(defaultValue: A) => (ma: Maybe<A>) => A;
    /**
     * Returns `Nothing` on an empty list or `Just<A>` where `A` is the first
     * element of the list.
     */
    listToMaybe<A>(list: Array<A>): Maybe<A>;
    /**
     * Returns an empty list when given `Nothing` or a singleton list when given
     * `Just`.
     */
    maybeToList<A>(ma: Maybe<A>): [] | [A];
    /**
     * Takes a list of `Maybe`s and returns a list of all the `Just` values.
     */
    catMaybes<A>(list: Array<Maybe<A>>): Array<A>;
    /**
     * A version of `map` which can throw out elements. In particular, the
     * functional argument returns something of type `Maybe<B>`. If this is
     * `Nothing`, no element is added on to the result list. If it is `Just<B>`,
     * then `B` is included in the result list.
     */
    mapMaybe: <A, B>(f: (a: A) => Maybe<B>) => (list: Array<A>) => Array<B>;
    /**
     * Creates a `Maybe` from a value. If the value is `null` or `undefined`, it
     * returns `Nothing`. Otherwise, it returns `Just(value)`.
     */
    of<T>(value: T | null | undefined): Maybe<T>;
    /**
     * Match a `Maybe` value with a function.
     */
    match: <A, B>(
        ma: Maybe<A>,
    ) => (matchers: { Just: (value: A) => B; Nothing: () => B }) => B;
}

export interface MaybeInstance
    extends FunctorInstance<MaybeKind>,
        ApplicativeInstance<MaybeKind>,
        MonadInstance<MaybeKind> {
    /**
     * Takes a function, a default value. If `this` is `Nothing`, the function
     * returns the default value. Otherwise, it applies the function to the value
     * inside `this` and returns the result.
     */
    maybe: <A, B>(this: Maybe<A>, f: (a: A) => B, defaultValue: B) => B;
    /**
     * Checks if `this` is `Just`.
     */
    isJust: <A>(this: Maybe<A>) => this is Just<A>;
    /**
     * Checks if `this` is `Nothing`.
     */
    isNothing: <A>(this: Maybe<A>) => this is Nothing;
    /**
     * Extracts the element out of a `Just` and throws an error if its argument
     * is `Nothing`.
     * @throws {Error} if `this` is `Nothing`
     */
    fromJust: <A>(this: Maybe<A>) => A;
    /**
     * Match a `this` with a function.
     */
    match: <A, B>(
        this: Maybe<A>,
        matchers: { Just: (value: A) => B; Nothing: () => B },
    ) => B;
    maybeToList: <A>(this: Maybe<A>) => [] | [A];
}

export const Maybe = class MaybeConstructor<T> implements MaybeInstance {
    readonly type = "Maybe";
    readonly variant: "Just" | "Nothing";
    readonly value: T;

    private constructor(value: T, variant: "Just" | "Nothing") {
        this.variant = variant;
        this.value = value;
    }

    // Functor
    static fmap =
        <A, B>(f: (a: A) => B) =>
        (fa: Maybe<A>): Maybe<B> => {
            if (fa.isNothing()) {
                return Nothing<B>();
            }
            return Just(f(fa.value));
        };

    // Applicative

    static pure = <A>(a: A): Maybe<A> => Just(a);

    static ap =
        <A, B>(ff: Maybe<(a: A) => B>) =>
        (fa: Maybe<A>): Maybe<B> => {
            if (ff.isNothing() || fa.isNothing()) {
                return Nothing<B>();
            }
            return Just(ff.value(fa.value));
        };

    // Monad

    static return = <A>(a: A): Maybe<A> => Just(a);

    static bind =
        <A>(ma: Maybe<A>) =>
        <B>(f: (a: A) => Maybe<B>): Maybe<B> => {
            if (ma.isNothing()) {
                return Nothing();
            }
            return f(ma.value);
        };

    // Maybe

    static maybe =
        <B>(defaultValue: B) =>
        <A>(f: (a: A) => B) =>
        (ma: Maybe<A>): B => {
            if (ma.isNothing()) {
                return defaultValue;
            }
            return f(ma.value);
        };

    static isJust = <A>(ma: Maybe<A>): ma is Just<A> => ma.variant === "Just";

    static isNothing = <A>(ma: Maybe<A>): ma is Nothing =>
        ma.variant === "Nothing";

    static fromJust = <A>(ma: Maybe<A>): A => {
        if (ma.isNothing()) {
            throw new Error("Maybe is Nothing");
        }
        return ma.value;
    };

    static fromMaybe =
        <A>(defaultValue: A) =>
        (ma: Maybe<A>): A => {
            if (ma.isNothing()) {
                return defaultValue;
            }
            return ma.value;
        };

    static listToMaybe = <A>(list: Array<A>): Maybe<A> => {
        if (list.length === 0) {
            return Nothing();
        }
        return Just(list[0]!);
    };

    static maybeToList = <A>(ma: Maybe<A>): [] | [A] => {
        if (ma.isNothing()) {
            return [];
        }
        return [ma.value];
    };

    static catMaybes = <A>(list: Array<Maybe<A>>): Array<A> => {
        const result: Array<A> = [];
        for (const ma of list) {
            if (ma.isJust()) {
                result.push(ma.value);
            }
        }
        return result;
    };

    static mapMaybe =
        <A, B>(f: (a: A) => Maybe<B>) =>
        (list: Array<A>): Array<B> => {
            const result: Array<B> = [];
            for (const a of list) {
                const mb = f(a);
                if (mb.isJust()) {
                    result.push(mb.value);
                }
            }
            return result;
        };

    static of = <T>(value: T | null | undefined): Maybe<T> => {
        if (value === undefined || value === null) {
            return Nothing();
        }
        return Just(value);
    };

    static match =
        <A>(ma: Maybe<A>) =>
        <B>(matchers: { Just: (value: A) => B; Nothing: () => B }): B => {
            if (ma.isJust()) {
                return matchers.Just(ma.value);
            }
            return matchers.Nothing();
        };

    fmap<A, B>(this: Maybe<A>, f: (a: A) => B): Maybe<B> {
        return MaybeConstructor.fmap(f)(this);
    }

    ap<A, B>(this: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B> {
        return MaybeConstructor.ap(ff)(this);
    }

    bind<A, B>(this: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
        return MaybeConstructor.bind(this)(f);
    }

    maybe<A, B>(this: Maybe<A>, f: (a: A) => B, defaultValue: B): B {
        return MaybeConstructor.maybe(defaultValue)(f)(this);
    }

    isJust<A>(this: Maybe<A>): this is Just<A> {
        return MaybeConstructor.isJust(this);
    }

    isNothing<A>(this: Maybe<A>): this is Nothing {
        return MaybeConstructor.isNothing(this);
    }

    fromJust<A>(this: Maybe<A>): A {
        return MaybeConstructor.fromJust(this);
    }

    maybeToList<A>(this: Maybe<A>): [] | [A] {
        return MaybeConstructor.maybeToList(this);
    }

    match<A, B>(
        this: Maybe<A>,
        matchers: { Just: (value: A) => B; Nothing: () => B },
    ): B {
        return MaybeConstructor.match(this)(matchers);
    }
} satisfies MaybeStatic;

export function Just<T>(v: T): Maybe<T> {
    return new (Maybe as any)(v, "Just");
}

export function Nothing<T>(): Maybe<T> {
    return new (Maybe as any)(undefined as T, "Nothing");
}

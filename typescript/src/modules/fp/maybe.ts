import type { Monad, MonadStatic } from "./monad";
import type * as HKT from "./hkt";
import { staticImplements } from "../misc";

export type Maybe<A> = Just<A> | Nothing;
export interface MaybeTypeClass extends HKT.Kind {
    readonly type: Maybe<this["In1"]>;
}

type Variant = "Just" | "Nothing";

class Just<A> implements Monad<MaybeTypeClass> {
    public readonly type = "Maybe";
    public readonly variant: Variant = "Just";
    public readonly value: A;
    private constructor(value: A) {
        this.value = value;
    }
    isNothing(this: Maybe<A>): this is Nothing {
        return false;
    }
    isJust(this: Maybe<A>): this is Just<A> {
        return true;
    }
    return<A>(a: A): Maybe<A> {
        return new Just(a);
    }
    apply<A, B>(this: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B> {
        if (this.isJust() && ff.isJust()) {
            return Maybe.just(ff.value(this.value));
        }
        return Maybe.nothing();
    }
    bind<A, B>(this: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
        return this.isJust() ? f(this.value) : Maybe.nothing();
    }
    fmap<A, B>(this: Maybe<A>, f: (a: A) => B): Maybe<B> {
        return this.isJust() ? Maybe.just(f(this.value)) : Maybe.nothing();
    }
}

class Nothing implements Monad<MaybeTypeClass> {
    public readonly type = "Maybe";
    public readonly variant: Variant = "Nothing";
    isNothing<A>(this: Maybe<A>): this is Nothing {
        return true;
    }
    isJust<A>(this: Maybe<A>): this is typeof Just<A> {
        return false;
    }
    pure<A>(a: A): Maybe<A> {
        return new (Just as any)(a);
    }
    return<A>(a: A): Maybe<A> {
        return new (Just as any)(a);
    }
    apply<A, B>(this: Maybe<A>, ff: Maybe<(a: A) => B>): Maybe<B> {
        return Maybe.nothing();
    }
    bind<A, B>(this: Maybe<A>, _f: (a: A) => Maybe<B>): Maybe<B> {
        return Maybe.nothing();
    }
    fmap<A, B>(this: Maybe<A>, _f: (a: A) => B): Maybe<B> {
        return Maybe.nothing();
    }
}

export const Maybe = class {
    static just<A>(value: A): Maybe<A> {
        return new (Just as any)(value);
    }
    static nothing<A>(): Maybe<A> {
        return new Nothing();
    }
    static pure<A>(a: A): Maybe<A> {
        return new (Just as any)(a);
    }
    static return<A>(a: A): Maybe<A> {
        return new (Just as any)(a);
    }
} satisfies MonadStatic<MaybeTypeClass>;

const a = Maybe.just(1);
const b = a.apply(Maybe.just((a) => a + 1));
const c = b.bind((a) => Maybe.just(a + 1));
const d = c.fmap((a) => a + 1);
console.log(d);

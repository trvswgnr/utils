import type * as HKT from "./hkt";
import type { BoundFunctor, Functor } from "./functor";

export interface Applicative<F extends HKT.Kind> extends Functor<F> {
    pure: <R, O, E, A>(a: A) => HKT.Type<F, R, O, E, A>;
    apply: <R, O, E, A, B>(
        ff: HKT.Type<F, R, O, E, (a: A) => B>,
        fa: HKT.Type<F, R, O, E, A>,
    ) => HKT.Type<F, R, O, E, B>;
    liftA2?: <R, O, E, A, B>(
        fa: HKT.Type<F, R, O, E, A>,
        f: (a: R) => O,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    applyRight?: <R, O, E, A, B>(
        fa: HKT.Type<F, R, O, E, A>,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    applyLeft?: <R, O, E, A, B>(
        fa: HKT.Type<F, R, O, E, A>,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, A>;
}

export interface BoundApplicative<F extends HKT.Kind> extends BoundFunctor<F> {
    apply: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        ff: HKT.Type<F, R, O, E, (a: A) => B>,
    ) => HKT.Type<F, R, O, E, B>;
    liftA2?: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        f: (a: R) => O,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    applyRight?: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    applyLeft?: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        fb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, A>;
}

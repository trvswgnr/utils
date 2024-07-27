import type * as HKT from "./hkt";

export interface Functor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <R, O, E, A, B>(
        f: (a: A) => B,
        fa: HKT.Type<F, R, O, E, A>,
    ) => HKT.Type<F, R, O, E, B>;
}

export interface BoundFunctor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        f: (a: A) => B,
    ) => HKT.Type<F, R, O, E, B>;
}

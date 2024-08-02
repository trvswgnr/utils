import type * as HKT from "./hkt";

export interface Functor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out2, Out1, A, B>(
        f: (a: A) => B,
    ) => (fa: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, B>;
}

export interface FunctorInstance<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        f: (a: A) => B,
    ) => HKT.Type<F, In, Out2, Out1, B>;
}

export const fmap = <F extends HKT.Kind>(f: Functor<F>) => f.fmap;

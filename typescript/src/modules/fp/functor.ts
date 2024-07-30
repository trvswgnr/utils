import type * as HKT from "./hkt";

export interface Functor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out, A, B>(
        f: (a: A) => B,
    ) => (fa: HKT.Type<F, In, Out, A>) => HKT.Type<F, In, Out, B>;
}

export interface FunctorInstance<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        f: (a: A) => B,
    ) => HKT.Type<F, In, Out, B>;
}

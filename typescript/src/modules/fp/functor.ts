import type * as HKT from "./hkt";

export interface Functor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out, TargetA, TargetB>(
        f: (a: TargetA) => TargetB,
        fa: HKT.Type<F, In, Out, TargetA>,
    ) => HKT.Type<F, In, Out, TargetB>;
}

export interface BoundFunctor<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        f: (a: TargetA) => TargetB,
    ) => HKT.Type<F, In, Out, TargetB>;
}

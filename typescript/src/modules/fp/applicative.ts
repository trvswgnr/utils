import type * as HKT from "./hkt";
import type { BoundFunctor, Functor } from "./functor";

export interface Applicative<F extends HKT.Kind> extends Functor<F> {
    pure: <In, Out, Target>(a: Target) => HKT.Type<F, In, Out, Target>;
    ap: <In, Out, TargetA, TargetB>(
        ff: HKT.Type<F, In, Out, (a: TargetA) => TargetB>,
        fa: HKT.Type<F, In, Out, TargetA>,
    ) => HKT.Type<F, In, Out, TargetB>;
    liftA2?: <In, Out, TargetA, TargetB>(
        fa: HKT.Type<F, In, Out, TargetA>,
        f: (a: In) => Out,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    applyRight?: <In, Out, TargetA, TargetB>(
        fa: HKT.Type<F, In, Out, TargetA>,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    applyLeft?: <In, Out, TargetA, TargetB>(
        fa: HKT.Type<F, In, Out, TargetA>,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetA>;
}

export interface BoundApplicative<F extends HKT.Kind> extends BoundFunctor<F> {
    ap: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        ff: HKT.Type<F, In, Out, (a: TargetA) => TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    liftA2?: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        f: (a: In) => Out,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    applyRight?: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    applyLeft?: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        fb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetA>;
}

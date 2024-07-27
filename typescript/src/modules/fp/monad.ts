import type * as HKT from "./hkt";
import type { Applicative, BoundApplicative } from "./applicative";

export interface Monad<F extends HKT.Kind> extends Applicative<F> {
    return: <In, Out, Target>(a: Target) => HKT.Type<F, In, Out, Target>;
    flapMap: <In, Out, TargetA, TargetB>(
        ma: HKT.Type<F, In, Out, TargetA>,
        f: (a: TargetA) => HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    then?: <In, Out, TargetA, TargetB>(
        ma: HKT.Type<F, In, Out, TargetA>,
        mb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
}

export interface BoundMonad<F extends HKT.Kind> extends BoundApplicative<F> {
    flapMap: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        f: (a: TargetA) => HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
    then?: <In, Out, TargetA, TargetB>(
        this: HKT.Type<F, In, Out, TargetA>,
        mb: HKT.Type<F, In, Out, TargetB>,
    ) => HKT.Type<F, In, Out, TargetB>;
}

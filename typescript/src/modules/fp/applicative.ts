import type * as HKT from "./hkt";

export interface Applicative<F extends HKT.Kind> extends HKT.Class<F> {
    pure: <In, Out, Target>(a: Target) => HKT.Type<F, In, Out, Target>;
    ap: <In, Out, A, B>(
        ff: HKT.Type<F, In, Out, (a: A) => B>,
        fa: HKT.Type<F, In, Out, A>,
    ) => HKT.Type<F, In, Out, B>;
    liftA2?: <In, Out, A, B>(
        fa: HKT.Type<F, In, Out, A>,
        f: (a: In) => Out,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    applyRight?: <In, Out, A, B>(
        fa: HKT.Type<F, In, Out, A>,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    applyLeft?: <In, Out, A, B>(
        fa: HKT.Type<F, In, Out, A>,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, A>;
}

export interface ApplicativeInstance<F extends HKT.Kind> extends HKT.Class<F> {
    ap: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        ff: HKT.Type<F, In, Out, (a: A) => B>,
    ) => HKT.Type<F, In, Out, B>;
    liftA2?: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        f: (a: In) => Out,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    applyRight?: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    applyLeft?: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        fb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, A>;
}

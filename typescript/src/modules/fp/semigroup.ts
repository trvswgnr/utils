import type * as HKT from "./hkt";

export interface Semigroup<F extends HKT.Kind> extends HKT.Class<F> {
    mappend: <In, Out2, Out1, A>(
        a: HKT.Type<F, In, Out2, Out1, A>,
    ) => (a: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface SemigroupInstance<F extends HKT.Kind> extends HKT.Class<F> {
    mappend: <In, Out2, Out1, A>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        a: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export const mappend =
    <F extends HKT.Kind>(s: Semigroup<F>) =>
    <In, Out2, Out1, Target>(a: HKT.Type<F, In, Out2, Out1, Target>) =>
    (b: HKT.Type<F, In, Out2, Out1, Target>) =>
        s.mappend(a)(b);

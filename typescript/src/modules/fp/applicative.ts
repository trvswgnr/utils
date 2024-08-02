import type { Functor, FunctorInstance } from "./functor";
import type * as HKT from "./hkt";

export interface Applicative<F extends HKT.Kind> extends Functor<F> {
    pure: <In, Out2, Out1, Target>(
        a: Target,
    ) => HKT.Type<F, In, Out2, Out1, Target>;
    apply: <In, Out2, Out1, A, B>(
        ff: HKT.Type<F, In, Out2, Out1, (a: A) => B>,
    ) => (fa: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, B>;
    liftA2?: <In, Out2, Out1, A, B>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (
        f: (a: A) => B,
    ) => (fb: HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, B>;
    applyRight?: <In, Out2, Out1, A, B>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (fb: HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, B>;
    applyLeft?: <In, Out2, Out1, A, B>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (fb: HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface ApplicativeInstance<F extends HKT.Kind>
    extends FunctorInstance<F> {
    apply: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        ff: HKT.Type<F, In, Out2, Out1, (a: A) => B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    liftA2?: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        f: (a: A) => B,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    applyRight?: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    applyLeft?: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export const pure = <F extends HKT.Kind>(a: Applicative<F>) => a.pure;
export const apply = <F extends HKT.Kind>(a: Applicative<F>) => a.apply;
export const liftA2 = <F extends HKT.Kind>(a: Applicative<F>) => a.liftA2;
export const applyRight = <F extends HKT.Kind>(a: Applicative<F>) =>
    a.applyRight;
export const applyLeft = <F extends HKT.Kind>(a: Applicative<F>) => a.applyLeft;

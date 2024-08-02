import type { RequireOne } from "~/types";
import type { FunctorStatic, FunctorInstance } from "./functor";
import type * as HKT from "./hkt";

/**
 * Minimal complete definition of Applicative
 *
 * {@link Applicative.pure `pure`}, ({@link Applicative.apply `apply`} |
 * {@link Applicative.liftA2 `liftA2`})
 */
export type Applicative<F extends HKT.Kind> = RequireOne<
    ApplicativeStatic<F>,
    "pure"
> &
    RequireOne<ApplicativeStatic<F>, "apply" | "liftA2">;

export interface ApplicativeStatic<F extends HKT.Kind>
    extends FunctorStatic<F> {
    pure?: <Target = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        a: Target,
    ) => HKT.Type<F, In, Out2, Out1, Target>;
    apply?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        ff: HKT.Type<F, In, Out2, Out1, (a: A) => B>,
    ) => (fa: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, B>;
    liftA2?: <
        A = unknown,
        B = unknown,
        C = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        f: (a: A) => (b: B) => C,
    ) => (
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (fb: HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, C>;
    applyRight?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => <B = unknown>(
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    applyLeft?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => <B = unknown>(
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface ApplicativeInstance<F extends HKT.Kind>
    extends FunctorInstance<F> {
    apply: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<F, In, Out2, Out1, A>,
        ff: HKT.Type<F, In, Out2, Out1, (a: A) => B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    liftA2?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<F, In, Out2, Out1, A>,
        f: (a: A) => B,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    applyRight?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<F, In, Out2, Out1, A>,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    applyLeft?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<F, In, Out2, Out1, A>,
        fb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export const pure = <F extends HKT.Kind>(
    a: RequireOne<ApplicativeStatic<F>, "pure">,
) => a.pure;
export const apply = <F extends HKT.Kind>(
    a: RequireOne<ApplicativeStatic<F>, "apply">,
) => a.apply;
export const liftA2 = <F extends HKT.Kind>(
    a: RequireOne<ApplicativeStatic<F>, "liftA2">,
) => a.liftA2;
export const applyRight = <F extends HKT.Kind>(
    a: RequireOne<ApplicativeStatic<F>, "applyRight">,
) => a.applyRight;
export const applyLeft = <F extends HKT.Kind>(
    a: RequireOne<ApplicativeStatic<F>, "applyLeft">,
) => a.applyLeft;

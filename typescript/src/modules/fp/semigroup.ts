import type { RequireOne, Constructor, NonEmptyArray } from "../../types";
import type * as HKT from "./hkt";

export type Semigroup<F extends HKT.Kind> = RequireOne<
    SemigroupStatic<F>,
    "mappend" | "sconcat"
>;

export interface SemigroupStatic<F extends HKT.Kind> extends HKT.Class<F> {
    mappend?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        a1: HKT.Type<F, In, Out2, Out1, A>,
    ) => (a2: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, A>;
    sconcat?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        xs: NonEmptyArray<HKT.Type<F, In, Out2, Out1, A>>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface SemigroupInstance<F extends HKT.Kind> extends HKT.Class<F> {
    mappend: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        a: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export const mappend = <F extends HKT.Kind>(
    s: RequireOne<SemigroupStatic<F>, "mappend">,
) => s.mappend;

export const impl =
    <F extends HKT.Kind>(semigroup: SemigroupStatic<F>) =>
    <TBase extends Constructor>(Base: TBase) => {
        return class Semigroup extends Base {
            static mappend = semigroup.mappend;
        };
    };

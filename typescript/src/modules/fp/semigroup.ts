import type { Constructor } from "~/types";
import type * as HKT from "./hkt";

export interface Semigroup<F extends HKT.Kind> extends HKT.Class<F> {
    mappend: <In, Out2, Out1, A>(
        a1: HKT.Type<F, In, Out2, Out1, A>,
    ) => (a2: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface SemigroupInstance<F extends HKT.Kind> extends HKT.Class<F> {
    mappend: <In, Out2, Out1, A>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        a: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export const mappend = <F extends HKT.Kind>(s: Semigroup<F>) => s.mappend;

export const implSemigroup =
    <F extends HKT.Kind>(semigroup: Semigroup<F>) =>
    <TBase extends Constructor>(Base: TBase) => {
        return class Semigroup extends Base {
            static mappend = semigroup.mappend;
        };
    };

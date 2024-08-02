import type * as HKT from "./hkt";
import type { Semigroup, SemigroupInstance } from "./semigroup";

export interface Monoid<F extends HKT.Kind> extends Semigroup<F> {
    mempty: <In, Out2, Out1, Target>() => HKT.Type<F, In, Out2, Out1, Target>;
    mconcat?: <In, Out2, Out1, A>(
        xs: Array<HKT.Type<F, In, Out2, Out1, A>>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
}

export interface MonoidInstance<F extends HKT.Kind>
    extends SemigroupInstance<F> {}

import type { Applicative, ApplicativeInstance } from "./applicative";
import type * as HKT from "./hkt";

export interface Alternative<F extends HKT.Kind> extends Applicative<F> {
    empty: <In, Out2, Out1, A>() => HKT.Type<F, In, Out2, Out1, A>;
    or: <In, Out2, Out1, A>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (
        alt: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
    some: <In, Out2, Out1, A>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, Array<A>>;
    many: <In, Out2, Out1, A>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, Array<A>>;
}

export interface AlternativeInstance<F extends HKT.Kind>
    extends ApplicativeInstance<F> {
    or: <In, Out2, Out1, A>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        alt: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
    some: <In, Out2, Out1, A>(
        this: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, Array<A>>;
    many: <In, Out2, Out1, A>(
        this: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, Array<A>>;
}

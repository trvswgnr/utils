import type * as HKT from "./hkt";
import type { RequireOne } from "~/types";
import type { ApplicativeStatic, ApplicativeInstance } from "./applicative";

/**
 * The minimal complete definition of Alternative
 *
 * {@link AlternativeStatic.empty `empty`}, {@link AlternativeStatic.or `or`}
 *
 * @usage
 * ```ts
 * type MaybeStatic = Alternative<MaybeKind> & {
 *   // ...
 * }
 * ```
 */
export type Alternative<F extends HKT.Kind> = RequireOne<
    AlternativeStatic<F>,
    "empty"
> &
    RequireOne<AlternativeStatic<F>, "or">;

export interface AlternativeStatic<F extends HKT.Kind>
    extends ApplicativeStatic<F> {
    empty?: <A, Out1, Out2, In>() => HKT.Type<F, In, Out2, Out1, A>;
    or?: <A, Out1, Out2, In>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => (
        alt: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, A>;
    some?: <A, Out1, Out2, In>(
        fa: HKT.Type<F, In, Out2, Out1, A>,
    ) => HKT.Type<F, In, Out2, Out1, Array<A>>;
    many?: <A, Out1, Out2, In>(
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

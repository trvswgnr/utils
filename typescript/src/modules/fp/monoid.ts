import type { Constructor, RequireOne } from "~/types";
import type * as HKT from "./hkt";
import type { SemigroupStatic, SemigroupInstance } from "./semigroup";

export type Monoid<F extends HKT.Kind> = RequireOne<
    MonoidStatic<F>,
    "mempty" | "mconcat"
>;

export interface MonoidStatic<F extends HKT.Kind> extends SemigroupStatic<F> {
    mempty?: <
        Target = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >() => HKT.Type<F, In, Out2, Out1, Target>;
    mconcat?: <Target = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        xs: Array<HKT.Type<F, In, Out2, Out1, Target>>,
    ) => HKT.Type<F, In, Out2, Out1, Target>;
}

export interface MonoidInstance<F extends HKT.Kind>
    extends SemigroupInstance<F> {}

export const mempty = <F extends HKT.Kind>(
    m: RequireOne<MonoidStatic<F>, "mempty">,
) => m.mempty;
export const mconcat = <F extends HKT.Kind>(
    m: RequireOne<MonoidStatic<F>, "mconcat">,
) => m.mconcat;

export const impl =
    <F extends HKT.Kind>(monoid: MonoidStatic<F>) =>
    <TBase extends Constructor>(Base: TBase) => {
        return class Monoid extends Base {
            static mempty = "mempty" in monoid ? monoid.mempty : undefined;
            static mconcat = "mconcat" in monoid ? monoid.mconcat : undefined;
        };
    };

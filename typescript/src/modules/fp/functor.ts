import type { Constructor, PickRequired, RequireOne } from "../../types";
import type * as HKT from "./hkt";

/**
 * Minimal complete definition of Functor
 *
 * {@link FunctorStatic.fmap `fmap`}
 */
export type Functor<F extends HKT.Kind> = RequireOne<FunctorStatic<F>, "fmap">;

/**
 * Static methods of Functor
 *
 * @note all methods are defined as optional, see {@link Functor `Functor<F>`}
 * for minimal complete definition
 */
export interface FunctorStatic<F extends HKT.Kind> extends HKT.Class<F> {
    fmap?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        f: (a: A) => B,
    ) => (fa: HKT.Type<F, In, Out2, Out1, A>) => HKT.Type<F, In, Out2, Out1, B>;
}

export interface FunctorInstance<F extends HKT.Kind> extends HKT.Class<F> {
    fmap: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<F, In, Out2, Out1, A>,
        f: (a: A) => B,
    ) => HKT.Type<F, In, Out2, Out1, B>;
}

export const fmap = <F extends HKT.Kind>(
    f: RequireOne<FunctorStatic<F>, "fmap">,
) => f.fmap;

export const impl =
    <F extends HKT.Kind>(functor: FunctorStatic<F>) =>
    <TBase extends Constructor>(Base: TBase) => {
        return class Functor extends Base {
            static fmap = functor.fmap;
        };
    };

import type { PartiallyApplied } from "./partial";
import type * as HKT from "./hkt";

/**
 * A type `F` is a Functor if it provides a function `fmap` which, given any
 * types `A` and `B`, lets you apply any function from `(a: A) => B` to turn an
 * `F(A)` into an `F(B)`, preserving the structure of `F`. Furthermore `F` needs
 * to adhere to the following:
 *
 * **Identity**
 *
 * `fmap(id) == id`
 *
 * **Composition**
 *
 * `fmap(compose(f, g)) == compose(fmap(f), fmap(g))`
 */
export interface Functor<F extends HKT.Kind> extends HKT.Class<F> {
    /**
     * Transforms a value in the Functor by applying a function to it.
     * @param f - The function to apply to the contents of the Functor
     * @returns A new Functor with the function applied to the contents
     */
    fmap: <A, B>(this: HKT.Type<F, A>, f: (a: A) => B) => HKT.Type<F, B>;
}

export interface FunctorStatic<F extends HKT.Kind> extends HKT.Class<F> {
    /**
     * Transforms a value in the Functor by applying a function to it.
     * @param f - The function to apply to the contents of the Functor
     * @returns A new Functor with the function applied to the contents
     */
    fmap: <A, B>(fa: HKT.Type<F, A>, f: (a: A) => B) => HKT.Type<F, B>;
}

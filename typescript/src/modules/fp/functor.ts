import type { PartialApplication } from "./partial";
import type * as HKT from "./hkt";

/**
 * A type f is a Functor if it provides a function fmap which, given any types a
 * and b lets you apply any function from (a -> b) to turn an f a into an f b,
 * preserving the structure of f. Furthermore f needs to adhere to the
 * following:
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
     * Applies a function to the contents of the functor.
     */
    fmap: <A, B>(this: HKT.Type<F, A>, f: (a: A) => B) => HKT.Type<F, B>;
}

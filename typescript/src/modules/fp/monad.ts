import type * as HKT from "./hkt";
import type { Applicative, ApplicativeStatic } from "./applicative";
import type { PartialApplication } from "./partial";

/**
 * Represents a Monad, which is a type class that extends Applicative with
 * return and bind operations.
 */
export interface Monad<M extends HKT.Kind> extends Applicative<M> {
    /**
     * Sequentially compose two actions, passing any value produced by the first
     * as an argument to the second.
     */
    bind: <A, B>(
        this: HKT.Type<M, A>,
        f: (a: A) => HKT.Type<M, B>,
    ) => HKT.Type<M, B>;
    /**
     * Sequentially compose two actions, discarding any value produced by the
     * first.
     *
     * `>>` in haskell
     */
    andThen?: <A, B>(
        this: HKT.Type<M, A>,
        mb: HKT.Type<M, B>,
    ) => HKT.Type<M, B>;
}

export interface MonadStatic<M extends HKT.Kind> extends ApplicativeStatic<M> {
    /**
     * Inject a value into the monadic type.
     */
    return: ApplicativeStatic<M>["pure"];
}

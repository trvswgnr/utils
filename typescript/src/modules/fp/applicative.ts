import type * as HKT from "./hkt";
import type { Functor, FunctorStatic } from "./functor";
import type { PartialApplication, PartiallyApplied } from "./partial";

/**
 * An Applicative is a Functor with additional capabilities. It allows for
 * application of functions within the context of the Applicative, and provides
 * a way to lift values into the Applicative context. An Applicative `F` should
 * satisfy the following laws:
 *
 * **Identity**
 *
 * `pure(id) <*> v = v`
 *
 * **Composition**
 *
 * `pure(.) <*> u <*> v <*> w = u <*> (v <*> w)`
 *
 * **Homomorphism**
 *
 * `pure(f) <*> pure(x) = pure(f x)`
 *
 * **Interchange**
 *
 * `u <*> pure(y) = pure($ y) <*> u`
 */
export interface Applicative<F extends HKT.Kind> extends Functor<F> {
    /**
     * Applies a function wrapped in an Applicative context to a value in an
     * Applicative context.
     * @param ff - The function wrapped in an Applicative context
     * @returns A new Applicative with the function applied to the contents
     */
    apply: <A, B>(
        this: HKT.Type<F, A>,
        ff: HKT.Type<F, (a: A) => B>,
    ) => HKT.Type<F, B>;

    /**
     * Lifts a binary function to actions.
     * @param f - The binary function to lift
     * @param fb - The second Applicative argument
     * @returns A new Applicative with the binary function applied
     */
    liftA2?: <A, B, C>(
        this: HKT.Type<F, A>,
        f: (a: A, b: B) => C,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, C>;

    /**
     * Sequence actions, discarding the value of the first argument.
     * @param fb - The Applicative to sequence after this one
     * @returns The second Applicative's value
     */
    applyRight?: <A, B>(
        this: HKT.Type<F, A>,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, B>;

    /**
     * Sequence actions, discarding the value of the second argument.
     * @param fb - The Applicative to sequence after this one
     * @returns The first Applicative's value
     */
    applyLeft?: <A, B>(
        this: HKT.Type<F, A>,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, A>;
}

/**
 * Static methods for creating and manipulating Applicatives.
 */
export interface ApplicativeConstructor<F extends HKT.Kind>
    extends HKT.Class<F> {
    /**
     * Lifts a value into the Applicative context.
     * @param a - The value to lift
     * @returns The value wrapped in the Applicative context
     */
    pure: <A>(a: A) => HKT.Type<F, A>;
}

export interface ApplicativeStatic<F extends HKT.Kind>
    extends FunctorStatic<F>,
        ApplicativeConstructor<F> {
    apply: PartialApplication<
        <A, B>(
            fa: HKT.Type<F, A>,
            ff: HKT.Type<F, (a: A) => B>,
        ) => HKT.Type<F, B>
    >;

    liftA2?: <A, B, C>(
        fa: HKT.Type<F, A>,
        f: (a: A, b: B) => C,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, C>;

    applyRight?: <A, B>(
        fa: HKT.Type<F, A>,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, B>;

    applyLeft?: <A, B>(
        fa: HKT.Type<F, A>,
        fb: HKT.Type<F, B>,
    ) => HKT.Type<F, A>;
}

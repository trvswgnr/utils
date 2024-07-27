import type { Args, Length, ShiftN } from "~/types";

export namespace PartialApplication {
    /**
     * Restructures a function to allow for partial application
     *
     * @template A - The original argument types of the function
     * @template R - The return type of the original function
     *
     * @param fn - The original function to be partially applied.
     * @returns A partial application function that can be called with any
     * number of its original arguments.
     *
     * @example
     * ```ts
     * const add = (a: number, b: number) => a + b;
     * const addPartial = PartialApplication.of(add);
     * const add5 = addPartial(5);
     * const result = add5(10); // 15
     * ```
     */
    export function of<A extends Args, R>(
        fn: (...args: A) => R,
    ): PartialApplication<A, R> {
        /**
         * Accumulator function that collects arguments and either calls the
         * original function or returns a new function to collect more
         * arguments.
         *
         * @param args1 - The initial set of arguments.
         * @returns Either the result of calling the original function or a new
         * accumulator function.
         */
        return function accumulator(...providedArgs: any): any {
            return providedArgs.length >= fn.length
                ? fn(...providedArgs) // Call the original function if enough arguments are provided
                : (...addtlArgs: any[]) =>
                      accumulator(...providedArgs.concat(addtlArgs)); // Return a new function to collect more arguments
        };
    }
}

/**
 * A partially applied function
 *
 * A partially applied function is a function that has been partially
 * applied to some of its arguments. This allows for the creation of new
 * functions by fixing a number of arguments to an existing function.
 *
 * @template P - The original parameter types of the function
 * @template R - The return type of the original function
 * @template T - The types of the arguments provided in the partial application
 *
 * @returns Either the final result type R if all arguments are provided, or
 * another PartiallyApplied type with the remaining parameters
 *
 * @example
 * ```ts
 * const add = (a: number, b: number) => a + b;
 * const addPartial = PartialApplication.of(add);
 * const add5 = addPartial(5);
 * const result = add5(10); // 15
 * ```
 */
export type PartialApplication<P extends Args, R> = <T extends Partial<P>>(
    ...args: T
) => T["length"] extends P["length"]
    ? R
    : PartialApplication<ShiftN<P, Length<T>>, R>;

/**
 * Transforms a regular function type into its partially applied equivalent
 *
 * @template F - The original function type
 * @returns The PartiallyApplied type corresponding to the input function type
 */
export type ToPartialApplication<F> = F extends (...args: infer A) => infer R
    ? PartialApplication<A, R>
    : never;

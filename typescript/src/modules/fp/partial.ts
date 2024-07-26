import type { AnyFn, Args, Length, ShiftN } from "~/types";

/**
 * Partial application of a function
 */
export namespace PartialApplication {
    /**
     * Restructures a function to allow for partial application
     *
     * @example
     * ```ts
     * const add = (a: number, b: number) => a + b;
     * const addPartial = of(add);
     * const add5 = addPartial(5);
     * const result = add5(10); // 15
     * ```
     *
     * @template P - The type of the arguments array for the original function
     * @template R - The return type of the original function
     *
     * @param fn - The original function to be partially applied.
     * @returns A partial application function that can be called with any number of
     * its original arguments.
     */
    export function of<P extends Args, R>(
        fn: (...params: P) => R,
    ): PartialApplication<P, R> {
        /**
         * Accumulator function that collects arguments and either calls the
         * original function or returns a new function to collect more arguments.
         *
         * @param args1 - The initial set of arguments.
         * @returns Either the result of calling the original function or a new
         * accumulator function.
         */
        return function accumulator(...args1: any): any {
            return args1.length >= fn.length
                ? fn(...args1) // Call the original function if enough arguments are provided
                : (...args2: any[]) => accumulator(...args1.concat(args2)); // Return a new function to collect more arguments
        };
    }
}

/**
 * Represents a partially applied function
 */
export type PartialApplication<T extends Args, R> = <A extends Partial<T>>(
    ...args: A
) => Length<A> extends Length<T>
    ? R
    : PartialApplication<ShiftN<T, Length<A>>, R>;

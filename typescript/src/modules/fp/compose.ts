import type { Args } from "~/types";

/**
 * Composes two functions, creating a new function that applies them in sequence.
 * This overload returns a curried function that then returns the final composed function.
 *
 * @template T - The type(s) of the arguments for the innermost function.
 * @template RInner - The return type of the inner function and input type of the outer function.
 * @template ROuter - The return type of the outer function and the final composed function.
 * @param f - The outer function to be composed, which takes the result of the inner function.
 * @returns A function that accepts the inner function and returns the final composed function.
 *
 * @note In Haskell, this is the infix operator `(.)`.
 *
 * @example
 * const double = (x: number) => x * 2;
 * const addOne = (x: number) => x + 1;
 * const doubleThenAddOne = compose(addOne)(double);
 * console.log(doubleThenAddOne(3)); // Output: 7
 */
export function compose<RInner, ROuter>(
    f: (arg: RInner) => ROuter,
): <AInner extends Args>(
    g: (...args: AInner) => RInner,
) => (...args: AInner) => ROuter;
/**
 * Composes two functions, creating a new function that applies them in sequence.
 * This overload directly returns the composed function.
 *
 * @template AInner - The type(s) of the arguments for the innermost function.
 * @template RInner - The return type of the inner function and input type of the outer function.
 * @template ROuter - The return type of the outer function and the final composed function.
 * @param f - The outer function to be composed, which takes the result of the inner function.
 * @param g - The inner function to be composed, which is applied first.
 * @returns A new function that applies both functions in sequence.
 *
 * @example
 * const double = (x: number) => x * 2;
 * const addOne = (x: number) => x + 1;
 * const doubleThenAddOne = compose(addOne, double);
 * console.log(doubleThenAddOne(3)); // Output: 7
 */
export function compose<AInner extends Args, RInner, ROuter>(
    f: (arg: RInner) => ROuter,
    g: (...args: AInner) => RInner,
): (...args: AInner) => ROuter;
export function compose<AInner extends Args, RInner, ROuter>(
    f: (arg: RInner) => ROuter,
    g?: (...args: AInner) => RInner,
) {
    if (g) {
        return (...args: AInner) => f(g(...args));
    }
    return (g: (...args: AInner) => RInner) =>
        (...args: AInner) =>
            f(g(...args));
}

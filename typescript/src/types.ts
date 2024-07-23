/**
 * a collection of useful utility types
 *
 * @module
 */

/**
 * returns `true` if `T` is the `any` type, otherwise `false`
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

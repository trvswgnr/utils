/**
 * A collection of useful type-level utilities
 *
 * @module
 */

/**
 * A type-level utility for removing a specified number of elements from the
 * beginning of a tuple type.
 *
 * @template T - The input tuple type to be shifted
 * @template N - The number of elements to remove from the beginning of the
 * tuple
 *
 * @example
 * type Original = [1, 2, 3, 4, 5];
 * type ShiftedByTwo = ShiftN<Original, 2>; // [3, 4, 5]
 * type ShiftedByFour = ShiftN<Original, 4>; // [5]
 *
 * @remarks
 * This type uses a conditional type to handle different cases:
 * 1. If N is a key of ShiftNMap<T>, it uses the pre-computed shift from
 *    ShiftNMap.
 * 2. If N is a number but not a key of ShiftNMap<T>, it returns any[] as a
 *    fallback.
 * 3. For any other case, it returns never.
 *
 * The use of ShiftNMap allows for efficient shifting of up to 5 elements
 * without deep recursive type computations, which can be performance-intensive
 * in TypeScript.
 *
 * @returns
 * - If N is 0 to 5: Returns a new tuple type with N elements removed from the
 *   start.
 * - If N is greater than 5: Returns any[] as a fallback.
 * - If N is not a number: Returns never.
 */
export type ShiftN<T extends readonly any[], N> = N extends keyof ShiftNMap<T>
    ? ShiftNMap<T>[N]
    : N extends number
    ? any[]
    : never;

/**
 * Utility type that computes the length of a tuple type
 *
 * @template T - A readonly tuple type
 * @returns The numeric literal type representing the length of the tuple
 *
 * @example
 * ```typescript
 * type EmptyTuple = [];
 * type EmptyLength = Length<EmptyTuple>; // 0
 *
 * type StringNumberTuple = [string, number];
 * type StringNumberLength = Length<StringNumberTuple>; // 2
 *
 * type MixedTuple = [boolean, string, number, object];
 * type MixedLength = Length<MixedTuple>; // 4
 * ```
 *
 * This type leverages TypeScript's built-in "length" property of tuple types.
 * It's particularly useful in type-level programming and conditional types
 * where you need to reason about or compare the lengths of tuples.
 */
export type Length<T extends readonly any[]> = T["length"];

/**
 * A type-level mapping for shifting elements from the beginning of a tuple
 * type.
 *
 * This type provides a way to remove a specific number of elements (0 to 5)
 * from the beginning of a tuple type. It uses nested applications of the
 * `ShiftOne` type to achieve this.
 *
 * @template T - The input tuple type to be shifted
 *
 * @example
 * type Original = [1, 2, 3, 4, 5];
 * type ShiftedByTwo = ShiftNMap<Original>[2]; // [3, 4, 5]
 *
 * @note Can only shift up to 5 elements, we don't do deep nested type
 * computations
 *
 * @remarks
 * This type is used in conjunction with `ShiftN` to provide an efficient way of
 * removing elements from the beginning of a tuple type. It's limited to
 * shifting up to 5 elements for performance reasons, as deeply nested type
 * computations can be costly in TypeScript.
 */
export type ShiftNMap<T extends readonly any[]> = {
    0: T;
    1: ShiftOne<T>;
    2: ShiftOne<ShiftOne<T>>;
    3: ShiftOne<ShiftOne<ShiftOne<T>>>;
    4: ShiftOne<ShiftOne<ShiftOne<ShiftOne<T>>>>;
    5: ShiftOne<ShiftOne<ShiftOne<ShiftOne<ShiftOne<T>>>>>;
};

/**
 * A type-level utility for removing the first element from a tuple type.
 *
 * @template T - The input tuple type from which to remove the first element
 *
 * @example
 * type Original = [1, 2, 3, 4, 5];
 * type Shifted = ShiftOne<Original>; // [2, 3, 4, 5]
 *
 * type SingleElement = [string];
 * type EmptyAfterShift = ShiftOne<SingleElement>; // []
 *
 * type AlreadyEmpty = [];
 * type StillEmpty = ShiftOne<AlreadyEmpty>; // never
 *
 * @remarks
 * This type uses a conditional type to check if the input tuple has at least
 * one element. If it does, it extracts and returns the rest of the tuple (all
 * elements except the first). If the input is an empty tuple, it returns never.
 *
 * @returns
 * - If T has at least one element: A new tuple type with the first element
 *   removed.
 * - If T is an empty tuple: never
 */
export type ShiftOne<T extends readonly any[]> = T extends [any, ...infer U]
    ? U
    : never;

export type Args = readonly any[];
export type AnyFn = (...args: any[]) => any;

export type Params<F extends AnyFn> = F extends (...args: infer P) => any
    ? P
    : never;
export type Return<F extends AnyFn> = F extends (...args: any[]) => infer R
    ? R
    : never;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type IsNonFnObject<T> = T extends object
    ? T extends (...args: never[]) => unknown
        ? false
        : true
    : false;

/**
 * A type-level utility for extracting only the functions from an object type.
 *
 * @template T - The input object type
 *
 * @example
 * type MyObject = {
 *   a: () => void;
 *   b: string;
 *   c: () => number;
 * };
 * type X = OnlyFns<MyObject>; // { a: () => void; c: () => number }
 */
export type OnlyFns<T> = {
    [K in keyof T as T[K] extends AnyFn ? K : never]: T[K];
};

/**
 * A type-level utility for creating a constructor type.
 *
 * @template T - The type to be constructed, defaults to any object
 * @template A - The arguments to be passed to the constructor, defaults to []
 */
export type Constructor<T = {}, A extends Args = Args> = new (...args: A) => T;

/**
 * Forces TS to show the type without aliases.
 */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type RequireProperty<T, K extends keyof T> = Prettify<
    T & {
        [P in K]-?: T[P];
    }
>;

export type PickRequired<T, K extends keyof T> = Pick<Required<T>, K>;

export type NonEmptyArray<T> = [T, ...T[]];

export type Defined<T> = T extends undefined ? never : T;

export type RequireOne<T, K extends keyof T> = T &
    {
        [P in K]-?: { [Q in P]: Defined<T[Q]> };
    }[K];

export type RequireAll<T, K extends keyof T> = T & {
    [P in K]-?: Defined<T[P]>;
};

export type Intersect<A = {}, B = {}, C = {}, D = {}, E = {}, F = {}> = A &
    B &
    C &
    D &
    E &
    F;

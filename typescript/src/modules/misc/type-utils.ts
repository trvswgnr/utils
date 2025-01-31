export type Expect<T extends true> = T;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type Debug<T> = { [K in keyof T]: T[K] };
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
    ? 1
    : 2
    ? true
    : false;
export type IsPrimitive<T> = T extends Primitive ? true : false;
export type IsNever<T> = Equal<T, never>;

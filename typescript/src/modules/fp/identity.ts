import type { IsNonFnObject } from "../../types";

export type Identity<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : {
          [K in keyof T]: IsNonFnObject<T[K]> extends true
              ? Identity<T[K]>
              : T[K];
      } & {};

export const id = <T>(value: T): Identity<T> => value as any;

export const ID = Symbol("ID");
export type ID = typeof ID;

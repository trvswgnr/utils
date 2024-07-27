type IsNonFnObject<T> = T extends object
    ? T extends (...args: never[]) => unknown
        ? false
        : true
    : false;

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

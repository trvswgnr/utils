type NonFnObject<T> = T extends object
    ? T extends (...args: never[]) => unknown
        ? never
        : T
    : never;

export type Identity<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : {
          [K in keyof T]: T[K] extends NonFnObject<T[K]>
              ? Identity<T[K]>
              : T[K];
      } & {};

export const id = <T>(value: T): Identity<T> => value as any;

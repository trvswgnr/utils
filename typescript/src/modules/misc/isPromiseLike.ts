export const isPromiseLike = <T>(value: T | PromiseLike<T> | object): value is PromiseLike<T> => {
    return (
      value instanceof Promise ||
      (typeof value === "object" &&
        value !== null &&
        "then" in value &&
        typeof value.then === "function")
    );
  };
  
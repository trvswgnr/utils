// foldr :: (a -> b -> b) -> b -> [a] -> b

/**
 * foldr, applied to a binary operator, a starting value (typically the
 * right-identity of the operator), and a list, reduces the list using the
 * binary operator, from right to left.
 */
export const foldr =
    <A, B>(f: (a: A) => (b: B) => B) =>
    (z: B) =>
    (xs: Array<A>): B => {
        return xs.reduceRight((acc, x) => f(x)(acc), z);
    };

export const cons =
    <T>(head: T) =>
    (tail: Array<T>): Array<T> =>
        [head, ...tail];

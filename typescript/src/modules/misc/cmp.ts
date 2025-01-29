import type { Option } from "../option";

export const Ordering = {
    Less: -1,
    Equal: 0,
    Greater: 1,
} as const;

export type Ordering = (typeof Ordering)[keyof typeof Ordering];

export interface PartialEq<T> {
    eq<Rhs extends T>(other: Rhs): boolean;
    ne<Rhs extends T>(other: Rhs): boolean;
}

export interface PartialOrd<T> {
    partial_cmp<Rhs extends T>(other: Rhs): Option<Ordering>;
    lt<Rhs extends T>(other: Rhs): boolean;
    le<Rhs extends T>(other: Rhs): boolean;
    gt<Rhs extends T>(other: Rhs): boolean;
    ge<Rhs extends T>(other: Rhs): boolean;
}

export interface Ord<T> extends PartialEq<T>, PartialOrd<T> {
    cmp<Rhs extends T>(other: Rhs): Ordering;
    max<Rhs extends T>(other: Rhs): T;
    min<Rhs extends T>(other: Rhs): T;
    clamp<Rhs extends T>(lower: Rhs, upper: Rhs): T;
}

export type Comparable = number | string | Ord<any>;

export function isOrd(value: unknown): value is Ord<unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        "cmp" in value &&
        "max" in value &&
        "min" in value &&
        "clamp" in value
    );
}

export function compare<T extends Comparable>(a: T, b: T): Ordering {
    if (typeof a === "number" && typeof b === "number") {
        return a < b ? Ordering.Less : a > b ? Ordering.Greater : Ordering.Equal;
    }
    if (typeof a === "string" && typeof b === "string") {
        return a < b ? Ordering.Less : a > b ? Ordering.Greater : Ordering.Equal;
    }
    if (isOrd(a) && isOrd(b)) {
        return a.cmp(b);
    }
    throw new Error("Cannot compare values of different types");
}

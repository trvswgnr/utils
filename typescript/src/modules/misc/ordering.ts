export const Ordering = {
    Less: -1,
    Equal: 0,
    Greater: 1,
} as const;

export type Ordering = (typeof Ordering)[keyof typeof Ordering];

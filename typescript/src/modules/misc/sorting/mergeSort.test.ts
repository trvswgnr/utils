import { describe, test, expect } from "bun:test";
import { mergeSort } from "./mergeSort";
import { type Ord, Ordering } from "../cmp";
import type { Option } from "../../option";

describe("mergeSort", () => {
    test("should handle empty array", () => {
        expect(mergeSort([])).toEqual([]);
    });

    test("should handle single element array", () => {
        expect(mergeSort([1])).toEqual([1]);
    });

    test("should sort array with two elements", () => {
        expect(mergeSort([2, 1])).toEqual([1, 2]);
        expect(mergeSort([1, 2])).toEqual([1, 2]);
    });

    test("should sort array with multiple elements", () => {
        expect(mergeSort([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5])).toEqual([
            1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9,
        ]);
    });

    test("should handle already sorted array", () => {
        expect(mergeSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    test("should handle reverse sorted array", () => {
        expect(mergeSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
    });

    test("should handle array with all same elements", () => {
        expect(mergeSort([1, 1, 1, 1, 1])).toEqual([1, 1, 1, 1, 1]);
    });

    test("should handle array with negative numbers", () => {
        expect(mergeSort([-3, 1, -4, 5, -2])).toEqual([-4, -3, -2, 1, 5]);
    });

    test("should handle array with decimals", () => {
        expect(mergeSort([3.14, 1.41, 2.71, 0.58])).toEqual([0.58, 1.41, 2.71, 3.14]);
    });

    test("should handle array of strings", () => {
        expect(mergeSort(["banana", "apple", "cherry", "date"])).toEqual([
            "apple",
            "banana",
            "cherry",
            "date",
        ]);
    });

    test("should maintain stability for equal elements", () => {
        class Item implements Ord<Item> {
            value: number;
            id: number;
            constructor(value: number, id: number) {
                this.value = value;
                this.id = id;
            }
            cmp<Rhs extends Item>(other: Rhs): Ordering {
                if (this.value < other.value) return Ordering.Less;
                if (this.value > other.value) return Ordering.Greater;
                return Ordering.Equal;
            }
            max<Rhs extends Item>(other: Rhs): Item {
                return this.value >= other.value ? this : other;
            }
            min<Rhs extends Item>(other: Rhs): Item {
                return this.value <= other.value ? this : other;
            }
            clamp<Rhs extends Item>(lower: Rhs, upper: Rhs): Item {
                if (this.value < lower.value) return lower;
                if (this.value > upper.value) return upper;
                return this;
            }
            partial_cmp<Rhs extends Item>(other: Rhs): Option<Ordering> {
                return this.cmp(other);
            }
            lt<Rhs extends Item>(other: Rhs): boolean {
                return this.value < other.value;
            }
            le<Rhs extends Item>(other: Rhs): boolean {
                return this.value <= other.value;
            }
            gt<Rhs extends Item>(other: Rhs): boolean {
                return this.value > other.value;
            }
            ge<Rhs extends Item>(other: Rhs): boolean {
                return this.value >= other.value;
            }
            eq<Rhs extends Item>(other: Rhs): boolean {
                return this.value === other.value;
            }
            ne<Rhs extends Item>(other: Rhs): boolean {
                return this.value !== other.value;
            }
        }
        const input = [new Item(3, 1), new Item(1, 2), new Item(3, 3), new Item(2, 4)];
        const sorted = mergeSort(input);
        expect(sorted.map((item) => item.value)).toEqual([1, 2, 3, 3]);
        // Check stability: first 3 should have id 1, second 3 should have id 3
        expect(sorted[2].id).toBe(1);
        expect(sorted[3].id).toBe(3);
    });
});

import { type Comparable, Ordering, compare } from "../cmp";

export function mergeSort<T extends Comparable>(arr: T[]): T[] {
    if (arr.length < 2) return arr;
    const mid = Math.floor(arr.length / 2);
    const l = mergeSort(arr.slice(0, mid));
    const r = mergeSort(arr.slice(mid));
    return merge(l, r);
}

function merge<T extends Comparable>(first: T[], second: T[]): T[] {
    const result: T[] = [];
    let i = 0;
    let j = 0;

    while (i < first.length && j < second.length) {
        if (compare(first[i]!, second[j]!) !== Ordering.Greater) {
            result.push(first[i]!);
            i++;
        } else {
            result.push(second[j]!);
            j++;
        }
    }

    while (i < first.length) {
        result.push(first[i]!);
        i++;
    }

    while (j < second.length) {
        result.push(second[j]!);
        j++;
    }

    return result;
}

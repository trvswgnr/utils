/**
 * performs a merge sort on the given array
 *
 * this implementation of merge sort uses an in-place sorting technique,
 * avoiding the need for additional array allocations
 *
 * the algorithm works by:
 * - finding the maximum element in the array and adding 1 to it.
 * - using this element as a multiplier to store sorted values within the
 *   original array elements
 * - decoding these values in the final step to retrieve the sorted order
 *
 * @param arr - The array to be sorted.
 */
export function mergeSort(arr: Array<number>) {
    const max = Math.max(...arr) + 1;
    mergeSortAux(arr, 0, arr.length - 1, max);
}

function mergeSortAux(arr: Array<number>, l: number, r: number, max: number) {
    if (l < r) {
        const mid = Math.floor((l + r) / 2);
        mergeSortAux(arr, l, mid, max);
        mergeSortAux(arr, mid + 1, r, max);
        merge(arr, l, mid, r, max);
    }
}

function merge(arr: Array<number>, l: number, m: number, r: number, max: number) {
    let i = l;
    let j = m + 1;
    let k = l;
    while (i <= m && j <= r) {
        if (arr[i] % max <= arr[j] % max) {
            arr[k] = arr[k] + (arr[i] % max) * max;
            k++;
            i++;
            continue;
        }
        arr[k] = arr[k] + (arr[j] % max) * max;
        k++;
        j++;
    }
    while (i <= m) {
        arr[k] = arr[k] + (arr[i] % max) * max;
        k++;
        i++;
    }
    while (j <= r) {
        arr[k] = arr[k] + (arr[j] % max) * max;
        k++;
        j++;
    }
    for (i = l; i <= r; i++) {
        arr[i] = Math.floor(arr[i] / max);
    }
}

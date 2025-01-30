export interface List<T> {
    readonly [index: number]: T;
    readonly length: number;
    toString(): string;
    toLocaleString(): string;
    toLocaleString(
        locales: string | string[],
        options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions,
    ): string;
    concat(...items: ConcatArray<T>[]): List<T>;
    concat(...items: T[]): List<T>;
    concat(items: List<T>): List<T>;
    join(separator?: string): string;
    slice(start?: number, end?: number): List<T>;
    indexOf(searchElement: T, fromIndex?: number): number;
    lastIndexOf(searchElement: T, fromIndex?: number): number;
    every<S extends T, This = undefined>(
        predicate: (value: T, index: number, array: List<T>) => value is S,
        thisArg?: This,
    ): this is List<S>;
    some<S extends T, This = undefined>(
        predicate: (value: T, index: number, array: List<T>) => value is S,
        thisArg?: This,
    ): this is List<T | S>;
    forEach(
        callbackfn: (value: T, index: number, array: List<T>) => void,
        thisArg?: any,
    ): void;
    map<U>(
        callbackfn: (value: T, index: number, array: List<T>) => U,
        thisArg?: any,
    ): List<U>;
    filter<S extends T>(
        predicate: (value: T, index: number, array: List<T>) => value is S,
        thisArg?: any,
    ): List<S>;
    filter(
        predicate: (value: T, index: number, array: List<T>) => unknown,
        thisArg?: any,
    ): List<T>;
    reduce(
        callbackfn: (
            previousValue: T,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => T,
    ): T;
    reduce(
        callbackfn: (
            previousValue: T,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => T,
        initialValue: T,
    ): T;
    reduce<U>(
        callbackfn: (
            previousValue: U,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => U,
        initialValue: U,
    ): U;
    reduceRight(
        callbackfn: (
            previousValue: T,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => T,
    ): T;
    reduceRight(
        callbackfn: (
            previousValue: T,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => T,
        initialValue: T,
    ): T;
    reduceRight<U>(
        callbackfn: (
            previousValue: U,
            currentValue: T,
            currentIndex: number,
            array: List<T>,
        ) => U,
        initialValue: U,
    ): U;
    find<S extends T>(
        predicate: (value: T, index: number, obj: List<T>) => value is S,
        thisArg?: any,
    ): S | undefined;
    find(
        predicate: (value: T, index: number, obj: List<T>) => unknown,
        thisArg?: any,
    ): T | undefined;
    findIndex(
        predicate: (value: T, index: number, obj: List<T>) => unknown,
        thisArg?: any,
    ): number;
    entries(): IterableIterator<[number, T]>;
    keys(): IterableIterator<number>;
    values(): IterableIterator<T>;
    includes(searchElement: T, fromIndex?: number): boolean;
    flatMap<U, This = undefined>(
        callback: (
            this: This,
            value: T,
            index: number,
            array: List<T>,
        ) => U | readonly U[],
        thisArg?: This | undefined,
    ): List<U>;
    flat<A, D extends number = 1>(this: A, depth?: D | undefined): FlatArray<A, D>[];
    at(index: number): T | undefined;
    findLast<S extends T>(
        predicate: (value: T, index: number, array: List<T>) => value is S,
        thisArg?: any,
    ): S | undefined;
    findLast(
        predicate: (value: T, index: number, array: List<T>) => unknown,
        thisArg?: any,
    ): T | undefined;
    findLastIndex(
        predicate: (value: T, index: number, array: List<T>) => unknown,
        thisArg?: any,
    ): number;
    toReversed(): List<T>;
    toSorted(compareFn?: ((a: T, b: T) => number) | undefined): List<T>;
    toSpliced(start: number, deleteCount: number, ...items: T[]): List<T>;
    toSpliced(start: number, deleteCount?: number): List<T>;
    with(index: number, value: T): List<T>;
    [Symbol.iterator](): IterableIterator<T>;
    [Symbol.unscopables]: {
        readonly [x: number]: boolean | undefined;
        readonly length?: boolean;
        toString?: boolean;
        toLocaleString?: boolean;
        concat?: boolean;
        join?: boolean;
        slice?: boolean;
        indexOf?: boolean;
        lastIndexOf?: boolean;
        every?: boolean;
        some?: boolean;
        forEach?: boolean;
        map?: boolean;
        filter?: boolean;
        reduce?: boolean;
        reduceRight?: boolean;
        find?: boolean;
        findIndex?: boolean;
        entries?: boolean;
        keys?: boolean;
        values?: boolean;
        includes?: boolean;
        flatMap?: boolean;
        flat?: boolean;
        at?: boolean;
        findLast?: boolean;
        findLastIndex?: boolean;
        toReversed?: boolean;
        toSorted?: boolean;
        toSpliced?: boolean;
        with?: boolean;
        [Symbol.iterator]?: boolean;
        readonly [Symbol.unscopables]?: boolean;
    };
}

export interface ListConstructor {
    new <A extends readonly unknown[]>(...items: A): List<A[number]>;
    new <T>(arrayLength: number): List<T>;
    new (arrayLength?: number): List<unknown>;

    <A extends readonly unknown[]>(...items: A): List<A[number]>;
    <T>(arrayLength: number): List<T>;
    (arrayLength?: number): List<unknown>;

    readonly prototype: List<unknown>;
    readonly [Symbol.species]: ListConstructor;

    isArray: <T>(arg: T | List<T>) => arg is List<T>;

    from<T>(arrayLike: ArrayLike<T>): List<T>;
    from<T, U, ThisArg>(
        arrayLike: ArrayLike<T>,
        mapfn: (v: T, k: number) => U,
        thisArg?: ThisArg,
    ): List<U>;
    from<T>(iterable: Iterable<T> | ArrayLike<T>): List<T>;
    from<T, U, ThisArg>(
        iterable: Iterable<T> | ArrayLike<T>,
        mapfn: (v: T, k: number) => U,
        thisArg?: ThisArg,
    ): List<U>;

    of<T>(...items: T[]): List<T>;

    fromAsync<T>(
        iterableOrArrayLike:
            | AsyncIterable<T>
            | Iterable<T | PromiseLike<T>>
            | ArrayLike<T | PromiseLike<T>>,
    ): Promise<List<T>>;
    fromAsync<T, U, ThisArg>(
        iterableOrArrayLike: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
        mapFn: (value: Awaited<T>) => U,
        thisArg?: ThisArg,
    ): Promise<List<U>>;
    fromAsync<T>(
        arrayLike: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
    ): Promise<List<T>>;
    fromAsync<T, U, ThisArg>(
        arrayLike: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
        mapFn: (value: T, index: number) => U,
        thisArg?: ThisArg,
    ): Promise<Awaited<U>[]>;

    empty: <T>() => List<T>;
}

export const List: ListConstructor = function (this: unknown, ...args: unknown[]) {
    const arr = this instanceof List ? Array(...args) : new Array(...args);
    Object.setPrototypeOf(arr, List.prototype);
    return arr;
} as unknown as ListConstructor;
for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(Array))) {
    if (typeof descriptor.value !== "function") continue;
    Object.defineProperty(List, key, descriptor);
}

for (const [key, descriptor] of Object.entries(
    Object.getOwnPropertyDescriptors(Array.prototype),
)) {
    if (key === "constructor" || typeof descriptor.value !== "function") continue;
    Object.defineProperty(List.prototype, key, descriptor);
}

Object.defineProperty(List, "empty", {
    value: () => new List(),
    writable: true,
    enumerable: false,
    configurable: true,
});

Object.defineProperty(List, Symbol.species, {
    ...Object.getOwnPropertyDescriptor(Array, Symbol.species),
    get: () => List,
});

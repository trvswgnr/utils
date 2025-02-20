export class AssertionError extends Error {
    public override readonly name = "AssertionError";
    constructor(a: string);
    constructor(a: unknown, b: unknown);
    constructor(a: unknown, b?: unknown) {
        let message: string;
        try {
            const aJSON = JSON.stringify(a);
            const bJSON = JSON.stringify(b);
            message = `${aJSON} !== ${bJSON}`;
        } catch (e) {
            message = "deepEqual failed and could not stringify values";
        }
        super(message);
        this.name = "AssertionError";
    }
}

export function deepEquals<A, B>(objA: A | B, objB: B): objA is B {
    return deepEqualHelper(objA, objB, new WeakMap());
}

export function assertDeepEquals<A, B>(objA: A | B, objB: B): asserts objA is B {
    if (!deepEquals(objA, objB)) {
        throw new AssertionError(objA, objB);
    }
}

function deepEqualHelper<A, B>(objA: A, objB: B, map: WeakMap<A & object, B>): boolean {
    if (Object.is(objA, objB)) return true;

    if (typeof objA !== typeof objB) return false;

    if (
        (objA instanceof String && objB instanceof String) ||
        (objA instanceof Number && objB instanceof Number) ||
        (objA instanceof Boolean && objB instanceof Boolean)
    ) {
        return Object.is(objA.valueOf(), objB.valueOf());
    }

    // handle typed arrays
    if (ArrayBuffer.isView(objA) && ArrayBuffer.isView(objB)) {
        if (objA.constructor !== objB.constructor) return false;
        if (objA.byteLength !== objB.byteLength) return false;

        if (objA instanceof Float32Array || objA instanceof Float64Array) {
            return Array.from(objA).every(
                (value, index) =>
                    Object.is(value, objB[index as never]) ||
                    (Object.is(value, +0) && Object.is(objB[index as never], -0)) ||
                    (Object.is(value, -0) && Object.is(objB[index as never], +0)),
            );
        }

        const viewA = new Uint8Array(objA.buffer, objA.byteOffset, objA.byteLength);
        const viewB = new Uint8Array(objB.buffer, objB.byteOffset, objB.byteLength);
        return viewA.every((value, index) => value === viewB[index]);
    }

    // handle ArrayBuffer and SharedArrayBuffer
    if (
        (objA instanceof ArrayBuffer || objA instanceof SharedArrayBuffer) &&
        (objB instanceof ArrayBuffer || objB instanceof SharedArrayBuffer)
    ) {
        if (objA.byteLength !== objB.byteLength) return false;
        const viewA = new Uint8Array(objA);
        const viewB = new Uint8Array(objB);
        return viewA.every((value, index) => value === viewB[index]);
    }

    // handle Date objects
    if (objA instanceof Date && objB instanceof Date) {
        return objA.getTime() === objB.getTime();
    }

    // handle RegExp objects
    if (objA instanceof RegExp && objB instanceof RegExp) {
        return objA.toString() === objB.toString();
    }

    if (typeof objA !== "object" || typeof objB !== "object") {
        return false;
    }

    if (objA === null || objB === null) return false;

    // handle Symbol.toPrimitive
    if (Symbol.toPrimitive in objA || Symbol.toPrimitive in objB) {
        return objA[Symbol.toPrimitive as never] === objB[Symbol.toPrimitive as never];
    }

    // handle iterables (including Arrays)
    if (Symbol.iterator in objA && Symbol.iterator in objB) {
        if (!isIterable(objA) || !isIterable(objB)) return false;

        const iterA = Array.from(objA);
        const iterB = Array.from(objB);

        if (iterA.length !== iterB.length) return false;

        return iterA.every((value, index) =>
            deepEqualHelper(value, iterB[index], new WeakMap()),
        );
    }

    // check for circular references
    if (map.get(objA) === objB) return true;
    map.set(objA, objB);

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // sort keys to make sure comparison is consistent
    keysA.sort();
    keysB.sort();

    // check all properties
    return keysA.every((key, index) => {
        if (key !== keysB[index]) return false;
        return deepEqualHelper((objA as any)[key], (objB as any)[key], map);
    });
}

function isIterable(x: unknown): x is Iterable<unknown> {
    return (
        typeof x === "object" &&
        x !== null &&
        Symbol.iterator in x &&
        typeof x[Symbol.iterator] === "function"
    );
}

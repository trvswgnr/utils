import type { Result, Ok, Err } from "../result/result";

export async function fetchJson<T>(
    url: string | Request | URL,
    predicate: (x: unknown) => x is Ok<T>,
    init?: FetchRequestInit,
): Promise<Result<T, Error>> {
    return await fetch(url, init)
        .then(parseWith(isOkResponse, "expected ok response"))
        .then((r) => r.json())
        .then(parseWith(predicate, "invalid data"))
        .catch(intoError);
}

export function parseWith<T>(
    predicate: (x: unknown) => x is T,
    message?: string,
): (x: unknown) => T {
    return (x) => {
        if (!predicate(x)) throw new Error(message ?? `failed to parse value`);
        return x;
    };
}

export function isOkResponse(r: unknown): r is Response & { ok: true } {
    return r instanceof Response && r.ok;
}

export function intoError(e: unknown): Err<Error> {
    if (e instanceof Error) return e;
    if (typeof e === "object" && e !== null) {
        const x = resultOf(JSON.stringify, e);
        if (x instanceof Error) return x;
        return new Error(x);
    }
    return new Error(String(e));
}

export function resultOf<A extends readonly any[], R>(
    fn: (...args: A) => Ok<R>,
    ...args: A
): Result<R, Error> {
    try {
        return fn(...args);
    } catch (e) {
        return intoError(e);
    }
}

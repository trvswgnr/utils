import { spawn as bunSpawn } from "bun";

// class SpawnError extends Error {
//     public readonly type = "SpawnError";
//     constructor(public code: unknown) {
//         const c = SpawnError.getCode(code);
//         super(`Command failed with code ${c}`);
//     }

//     static from(x: unknown) {
//         if (x instanceof SpawnError) return x;
//         if (typeof x === "number") return new SpawnError(x);
//         return new SpawnError(69);
//     }

//     static getCode(x: unknown) {
//         if (x instanceof SpawnError) return x.code;
//         if (typeof x === "number") return x;
//         return 69;
//     }
// }

export function spawn(cmds: string[]): Catchable<string, Error> {
    return Catchable(async () => {
        const p = bunSpawn(cmds, {
            stdout: "pipe",
            stderr: "pipe",
        });
        const stdout: ReadableStream<Uint8Array> = p.stdout;
        const stderr: ReadableStream<Uint8Array> = p.stderr;

        const stdoutBuf: Array<number> = [];
        const stderrBuf: Array<number> = [];
        const stdoutChunks = await Bun.readableStreamToArray(stdout);
        for (const chunk of stdoutChunks) {
            stdoutBuf.push(...chunk);
        }
        const stderrChunks = await Bun.readableStreamToArray(stderr);
        for (const chunk of stderrChunks) {
            stderrBuf.push(...chunk);
        }
        await p.exited;
        if (p.exitCode !== 0) {
            throw Buffer.from(stderrBuf).toString().trim();
        }
        return Buffer.from(stdoutBuf).toString().trim();
    });
}

type Catchable<T, in out E> = {
    then<U>(fn: (x: T) => U): Catchable<U, E>;
    catch<U>(fn: (e: E) => U): Catchable<T | U, E>;
};

// biome-ignore lint/suspicious/noRedeclare: <explanation>
async function Catchable<T>(
    p: (() => Promise<T>) | Promise<T>,
    // @ts-expect-error
): Catchable<T, Error>;
// biome-ignore lint/suspicious/noRedeclare: <explanation>
async function Catchable<T, E>(
    intoErrorFn: (x: unknown) => E,
    p: (() => Promise<T>) | Promise<T>,
    // @ts-expect-error
): Catchable<T, E>;
async function Catchable<T, E>(
    intoErrorFn: ((x: unknown) => E) | (() => Promise<T>) | Promise<T>,
    _p?: (() => Promise<T>) | Promise<T>,
) {
    let p = _p;
    let _intoErrFn = intoError;
    // check if Err is an object with a from method
    if (typeof p !== "undefined") {
        _intoErrFn = intoErrorFn as any;
    } else {
        p = intoErrorFn as any;
    }
    try {
        if (typeof p === "function") {
            return (await p().catch((e) => {
                throw e;
            })) as Catchable<T, E>;
        }
        return (await p!.catch((e) => {
            throw e;
        })) as Catchable<T, E>;
    } catch (e) {
        throw _intoErrFn(e);
    }
}

function intoError(x: unknown): Error {
    if (x instanceof Error) return x;
    if (typeof x === "string") return new Error(x);
    return new Error("unknown error", { cause: x });
}

const x = await spawn(["node", "-dv"]).catch((e) => {
    if (e instanceof Error) {
        console.log("should be here");
    }
    return e;
});

console.log(x.toString());

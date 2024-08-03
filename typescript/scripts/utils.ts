import path from "node:path";
import fs from "node:fs";
import { $, type ShellExpression, type ShellPromise } from "bun";

export const PACKAGE_NAME = "@travvy/utils";

/**
 * finds the bun workspace root directory
 *
 * looks for a package.json file, if it exists then it looks to see if it has a
 * "workspaces" property. if it does then that is the workspace root. if it
 * doesn't then it will continue to look for a package.json file in the parent
 * directories until it finds the workspace root.
 */
export function findProjectRootFrom(cwd: string) {
    const filePath = path.join(cwd, "package.json");
    const exists = fs.existsSync(filePath);
    const parentDir = path.join(cwd, "..");

    if (!exists) {
        return findProjectRootFrom(parentDir);
    }

    const pkgRaw = fs.readFileSync(filePath, "utf8");
    const pkg = JSON.parse(pkgRaw);

    if (pkg.name === PACKAGE_NAME) {
        return cwd;
    }

    return findProjectRootFrom(parentDir);
}

export function joinPaths(...paths: Array<string>) {
    return path.join(...paths);
}

export function pathFromRoot(...paths: Array<string>) {
    const root = findProjectRootFrom(process.cwd());
    return joinPaths(root, ...paths);
}

export function mkdir(dirpath: string) {
    if (!fs.existsSync(dirpath)) {
        return fs.mkdirSync(dirpath, { recursive: true });
    }
    return undefined;
}

export function readdir(dirpath: string) {
    return fs.readdirSync(dirpath, { withFileTypes: true });
}

export function exists(filepath: string) {
    return fs.existsSync(filepath);
}

export function rmDir(dirpath: string, force = false) {
    return fs.rmSync(dirpath, { recursive: true, force });
}

export function rmFile(filepath: string, force = false) {
    return fs.rmSync(filepath, { force });
}

export function assertInProjectRoot() {
    const root = findProjectRootFrom(process.cwd());
    if (root !== process.cwd()) {
        console.error(`Must be run from project root: ${root}`);
        process.exit(1);
    }
}

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | Array<JsonValue>
    | { [key: string]: JsonValue }
    | { toJSON(): JsonValue };

export async function writeJson<V extends JsonValue>(
    path: string,
    value: V,
): Promise<number> {
    return await Bun.write(path, JSON.stringify(value, null, 4) + "\n");
}

export async function writeText(path: string, text: string) {
    return await Bun.write(path, text);
}

export async function readJson<V extends JsonValue>(
    path: string,
    validator?: (value: JsonValue) => value is V,
): Promise<V> {
    const value = await Bun.file(path).json();
    if (validator && !validator(value)) {
        throw new Error(`Invalid JSON value at ${path}`);
    }
    return value;
}

export async function getConfirmation(message: string): Promise<boolean> {
    const prompt = message + " (y/n): ";
    process.stdout.write(prompt);
    for await (const line of console) {
        if (line === "y" || line === "yes") {
            return true;
        }
        if (line === "n" || line === "no") {
            return false;
        }
        process.stdout.write(prompt);
    }
    throw new Error("no confirmation received");
}

export async function exec(cmd: string, quiet = true): Promise<number> {
    const p = Bun.spawn(cmd.split(" "), {
        stdout: "pipe",
        stderr: "pipe",
    });
    const stdout: ReadableStream<Uint8Array> = p.stdout;
    const stderr: ReadableStream<Uint8Array> = p.stderr;

    if (!quiet) {
        for (const chunk of await Bun.readableStreamToArray(stdout)) {
            process.stdout.write(chunk);
        }
        for (const chunk of await Bun.readableStreamToArray(stderr)) {
            process.stderr.write(chunk);
        }
    }
    await p.exited;
    return p.exitCode ?? 69;
}

export type TsUpConfig = {
    format: Array<string>;
    entry: Record<string, string>;
    outDir: string;
    dts: boolean;
    sourcemap: boolean;
    clean: boolean;
};

export type PackageJson = {
    name: string;
    version: string;
    main: string;
    type: string;
    exports: Record<string, { import: string; require: string }>;
    files: Array<string>;
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
};

export type JsrJson = {
    name: string;
    version: string;
    exports: Record<string, string>;
};

export type Log = Omit<Console, "log">;
export const Log = console;

export type AnyFn = (...args: never[]) => unknown;

export function exitAfter(x: unknown, exitCode?: number): never;
export function exitAfter<F extends AnyFn>(fn: F, exitCode?: number): never;
export function exitAfter(fn: unknown, exitCode = 0): never {
    if (typeof fn === "function") {
        fn();
    }
    process.exit(exitCode);
}

export async function commandOutput(
    strings: TemplateStringsArray,
    ...expressions: ShellExpression[]
): Promise<string | null> {
    try {
        return await $(strings, ...expressions)
            .quiet()
            .then((e) => e.text().trim());
    } catch (e) {
        return null;
    }
}

import path from "node:path";
import fs from "node:fs";

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

export function joinPaths(...paths: string[]) {
    return path.join(...paths);
}

export function pathFromRoot(...paths: string[]) {
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
        } else if (line === "n" || line === "no") {
            return false;
        }
        process.stdout.write(prompt);
    }
    throw new Error("no confirmation received");
}

export type TsUpConfig = {
    format: string[];
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
    files: string[];
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
};

export type JsrJson = {
    name: string;
    version: string;
    exports: Record<string, string>;
};

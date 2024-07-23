import path from "node:path";
import fs from "node:fs/promises";

/**
 * finds the bun workspace root directory
 *
 * looks for a package.json file, if it exists then it looks to see if it has a
 * "workspaces" property. if it does then that is the workspace root. if it
 * doesn't then it will continue to look for a package.json file in the parent
 * directories until it finds the workspace root.
 */
export async function findWorkspaceRootFrom(cwd: string) {
    const filePath = path.join(cwd, "package.json");
    const exists = await fs.exists(filePath);
    const parentDir = path.join(cwd, "..");

    if (!exists) {
        return findWorkspaceRootFrom(parentDir);
    }

    const pkgRaw = await fs.readFile(filePath, "utf8");
    const pkg = JSON.parse(pkgRaw);

    if (pkg.workspaces) {
        return cwd;
    }

    return findWorkspaceRootFrom(parentDir);
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

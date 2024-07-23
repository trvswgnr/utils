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

import fs from "node:fs/promises";
import path from "node:path";
import { findWorkspaceRootFrom } from "./utils";

await main();

async function main() {
    const ROOT_DIR = await findWorkspaceRootFrom(process.cwd());
    const pkg = process.argv[2];
    if (!pkg) {
        return await cleanAll(ROOT_DIR).catch(console.error);
    }

    const pkgDir = path.join(ROOT_DIR, "packages", pkg);
    await cleanDir(pkgDir).catch(console.error);
}

async function cleanAll(baseDir: string) {
    console.log("cleaning workspace root...");
    await cleanDir(baseDir);

    console.log("cleaning packages...");
    const packagesDir = path.join(baseDir, "packages");
    const packages = await fs.readdir(packagesDir, { withFileTypes: true });
    const packageDirs = packages
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(packagesDir, dirent.name));

    await Promise.all(packageDirs.map(cleanDir));

    console.log("cleanup complete!");
}

async function cleanDir(dir: string) {
    await Promise.all([
        fs.rm(path.join(dir, "node_modules"), { recursive: true, force: true }),
        fs.rm(path.join(dir, "bun.lockb"), { force: true }),
    ]);
    console.log(`cleaned ${dir}`);
}

import fs from "node:fs/promises";
import path from "node:path";
import { findWorkspaceRootFrom } from "./utils";

const ROOT_DIR = await findWorkspaceRootFrom(process.cwd());

await cleanAll(ROOT_DIR).catch(console.error);

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

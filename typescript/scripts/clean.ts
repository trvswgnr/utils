import fs from "node:fs/promises";
import path from "node:path";
import { findProjectRootFrom } from "./utils";

await main();

async function main() {
    const ROOT_DIR = await findProjectRootFrom(process.cwd());
    return await cleanAll(ROOT_DIR).catch(console.error);
}

async function cleanAll(baseDir: string) {
    console.log("cleaning...");
    await cleanDir(baseDir);
    console.log("cleanup complete!");
}

async function cleanDir(dir: string) {
    await Promise.all([
        fs.rm(path.join(dir, "node_modules"), { recursive: true, force: true }),
        fs.rm(path.join(dir, "bun.lockb"), { force: true }),
    ]);
    console.log(`cleaned ${dir}`);
}

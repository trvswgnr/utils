import { $ } from "bun";
import { findWorkspaceRootFrom } from "./utils";
import path from "path";
import fs from "fs/promises";

const ROOT_DIR = await findWorkspaceRootFrom(process.cwd());

await main();

async function main() {
    const packageName = process.argv[2];
    if (!packageName) {
        return await publishAll();
    }

    return await publishOne(packageName);
}

async function publishOne(packageName: string) {
    const packageDir = path.join(ROOT_DIR, "packages", packageName);
    const packageJsonPath = path.join(packageDir, "package.json");
    const packageJson = await Bun.file(packageJsonPath).json();
    const jsrJsonPath = path.join(packageDir, "jsr.json");
    const jsrJson = await Bun.file(jsrJsonPath).json();
    const [major, minor, patch] = packageJson.version.split(".");
    const version = `${major}.${minor}.${Number(patch) + 1}`;
    packageJson.version = version;
    jsrJson.version = version;

    await Promise.all([
        Bun.write(packageJsonPath, JSON.stringify(packageJson, null, 4)),
        Bun.write(jsrJsonPath, JSON.stringify(jsrJson, null, 4)),
    ]);

    await $`cd ${packageDir}`;
    await $`git add . && git commit -m "chore: publish ${packageName}@${version}" && git push`;
    await $`bunx jsr publish`;
    await $`cd ${ROOT_DIR}`;
}

async function publishAll() {
    // get all package dirs
    const packageDirs = await fs.readdir(path.join(ROOT_DIR, "packages"), {
        withFileTypes: true,
    });
    const promises = [];
    for (const packageDir of packageDirs) {
        if (packageDir.isDirectory()) {
            promises.push(publishOne(packageDir.name));
        }
    }
    await Promise.all(promises);
}

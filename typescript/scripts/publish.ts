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
    const jsrJsonPath = path.join(packageDir, "jsr.json");
    const jsrJson = await Bun.file(jsrJsonPath).json();
    const [major, minor, patch] = jsrJson.version.split(".");
    const newPatchVersion = Number(patch) + 1;
    const version = `${major}.${minor}.${newPatchVersion}`;
    jsrJson.version = version;

    await Bun.write(jsrJsonPath, JSON.stringify(jsrJson, null, 4));

    await runAllCommandsSync([
        $`cd ${ROOT_DIR}`,
        $`git add ${jsrJsonPath}`,
        $`git commit -m "chore: publish ${packageName}@${version}"`,
        $`cd ${packageDir}`,
        $`bunx jsr publish`,
        $`cd ${ROOT_DIR}`,
        $`git push`,
    ]).catch(async () => {
        console.error("\nerror publishing, rolling back...\n");
        const prevVersion = `${major}.${minor}.${Number(patch) - 1}`;
        jsrJson.version = prevVersion;
        await runAllCommandsSync([
            Bun.write(jsrJsonPath, JSON.stringify(jsrJson, null, 4)),
            $`cd ${ROOT_DIR}`,
            // reset to last commit
            $`git reset HEAD~`,
            $`git checkout -- ${jsrJsonPath}`,
        ]);
    });
}

async function runAllCommandsSync(promises: Promise<any>[]) {
    for (const promise of promises) {
        try {
            await promise;
        } catch (e) {
            throw e;
        }
    }
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

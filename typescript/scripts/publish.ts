import { $ } from "bun";
import {
    pathFromRoot,
    readJson,
    writeJson,
    type JsrJson,
    type PackageJson,
} from "./utils";

await publish();

async function publish() {
    const jsrJsonPath = pathFromRoot("jsr.json");
    const jsrJson = await readJson<JsrJson>(jsrJsonPath);
    const pkgJsonPath = pathFromRoot("package.json");
    const pkgJson = await readJson<PackageJson>(pkgJsonPath);

    const [major, minor, patch] = jsrJson.version.split(".");
    const newPatchVersion = Number(patch) + 1;
    const newVersion = `${major}.${minor}.${newPatchVersion}`;

    jsrJson.version = newVersion;
    pkgJson.version = newVersion;

    await checkGitState();

    await runAllCommandsSync([
        $`bun run build`,
        writeJson(jsrJsonPath, jsrJson),
        writeJson(pkgJsonPath, pkgJson),
        $`git add ${jsrJsonPath}`,
        $`git add ${pkgJsonPath}`,
        $`git commit -m "chore: publish v${newVersion}"`,
        // check if nvm command is available and use if so
        $`command -v nvm >/dev/null 2>&1 && nvm use || echo "nvm not found, skipping nvm use"`,
        $`npm publish`,
        $`bunx jsr publish --allow-slow-types`,
        $`git tag v${newVersion}`,
        $`git push`,
        $`git push --tags`,
    ]).catch(async (e) => {
        console.error("\nerror publishing, rolling back...\n");
        const prevVersion = `${major}.${minor}.${Number(newPatchVersion) - 1}`;

        jsrJson.version = prevVersion;
        pkgJson.version = prevVersion;

        await runAllCommandsSync([
            writeJson(jsrJsonPath, jsrJson),
            writeJson(pkgJsonPath, pkgJson),
            // reset to last commit
            $`git reset HEAD~`,
            $`git checkout -- ${jsrJsonPath} ${pkgJsonPath}`,
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

/**
 * checks if there are any uncommitted changes in the git repository. if there
 * are, it will throw an error. also checks if the current branch is the main
 * branch.
 */
async function checkGitState() {
    const branch = await $`git branch --show-current`.text();
    if (branch.trim() !== "main") {
        console.error("not on main branch, aborting publish");
        process.exit(1);
    }

    const status = await $`git status --porcelain`.text();
    if (status.trim()) {
        console.error("there are uncommitted changes, aborting publish");
        process.exit(1);
    }
}

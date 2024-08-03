import { SemVer } from "../src/modules/misc/semver";
import { $ } from "bun";
import {
    pathFromRoot,
    readJson,
    writeJson,
    type JsonValue,
    type JsrJson,
    type PackageJson,
} from "./utils";
import { Ordering } from "../src/modules/misc/ordering";

await publish();

async function publish() {
    const jsrJsonPath = pathFromRoot("jsr.json");
    const jsrJson = await readJson<JsrJson>(jsrJsonPath);
    const pkgJsonPath = pathFromRoot("package.json");
    const pkgJson = await readJson<PackageJson>(pkgJsonPath);

    const [major, minor, patch] = jsrJson.version.split(".");
    const newPatchVersion = Number(patch) + 1;
    const newVersion = SemVer.unsafe_parse(
        `${major}.${minor}.${newPatchVersion}`,
    );

    jsrJson.version = SemVer.toString(newVersion);
    pkgJson.version = SemVer.toString(newVersion);

    await checkGitState();

    const logFile = pathFromRoot("published.json");
    const defaultLog = {
        jsr: {
            version: "0.0.0",
            date: new Date().toISOString(),
        },
        npm: {
            version: "0.0.0",
            date: new Date().toISOString(),
        },
    };
    const logRaw = await readJson(logFile).catch(() => defaultLog);
    const log = unsafe_parsePublishedLog(logRaw);
    const currentNpmVersion = log.npm.version;
    const currentJsrVersion = log.jsr.version;

    const publish_npm =
        SemVer.compare(currentNpmVersion, newVersion) === Ordering.Less
            ? $`npm publish`.then(() => updateNpmLog(pkgJson.version))
            : Promise.resolve();
    const publish_jsr =
        SemVer.compare(currentJsrVersion, newVersion) === Ordering.Less
            ? $`bunx jsr publish --allow-slow-types`.then(() =>
                  updateJsrLog(pkgJson.version),
              )
            : Promise.resolve();

    await runAllCommandsSync([
        $`bun run build`,
        writeJson(jsrJsonPath, jsrJson),
        writeJson(pkgJsonPath, pkgJson),
        $`git add ${jsrJsonPath}`,
        $`git add ${pkgJsonPath}`,
        $`git commit -m "chore: publish v${newVersion}"`,
        // check if nvm command is available and use if so
        $`command -v nvm && nvm use || echo "nvm not found, skipping nvm use"`,
        publish_npm,
        publish_jsr,
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

type PublishedLog = {
    jsr: {
        version: SemVer;
        date: Date;
    };
    npm: {
        version: SemVer;
        date: Date;
    };
};

function unsafe_parsePublishedLog(publishedLogRaw: JsonValue): PublishedLog {
    if (
        typeof publishedLogRaw !== "object" ||
        publishedLogRaw === null ||
        !("jsr" in publishedLogRaw) ||
        publishedLogRaw.jsr === null ||
        !("npm" in publishedLogRaw) ||
        publishedLogRaw.npm === null ||
        typeof publishedLogRaw.jsr !== "object" ||
        typeof publishedLogRaw.npm !== "object" ||
        !(
            "version" in publishedLogRaw.jsr &&
            "date" in publishedLogRaw.jsr &&
            "version" in publishedLogRaw.npm &&
            "date" in publishedLogRaw.npm
        ) ||
        typeof publishedLogRaw.jsr.version !== "string" ||
        typeof publishedLogRaw.jsr.date !== "string" ||
        typeof publishedLogRaw.npm.version !== "string" ||
        typeof publishedLogRaw.npm.date !== "string"
    ) {
        throw new Error("published log is invalid");
    }

    const jsr = {
        version: SemVer.unsafe_parse(publishedLogRaw.jsr.version),
        date: new Date(publishedLogRaw.jsr.date),
    };
    const npm = {
        version: SemVer.unsafe_parse(publishedLogRaw.npm.version),
        date: new Date(publishedLogRaw.npm.date),
    };

    return { jsr, npm };
}

async function updateNpmLog(version: string) {
    const publishedLogPath = pathFromRoot("published.json");
    const publishedLogRaw = await readJson(publishedLogPath);
    const publishedLog = unsafe_parsePublishedLog(publishedLogRaw);
    const npm = {
        version,
        date: new Date(),
    };
    const newPublishedLog = {
        ...publishedLog,
        npm,
    };
    await writeJson(
        publishedLogPath,
        JSON.parse(JSON.stringify(newPublishedLog)),
    );
}

async function updateJsrLog(version: string) {
    const jsrLogPath = pathFromRoot("jsr.json");
    const jsrLogRaw = await readJson(jsrLogPath);
    const jsrLog = unsafe_parsePublishedLog(jsrLogRaw);
    const newJsrLog = {
        ...jsrLog,
        version,
        date: new Date(),
    };
    await writeJson(jsrLogPath, JSON.parse(JSON.stringify(newJsrLog)));
}

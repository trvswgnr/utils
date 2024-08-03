import { SemVer } from "../src/modules/misc/semver";
import { $ } from "bun";
import {
    pathFromRoot,
    readJson,
    writeJson,
    commandOutput,
    type JsonValue,
    type JsrJson,
    type PackageJson,
} from "./utils";
import { Ordering } from "../src/modules/misc/ordering";

let jsrWasPublished = false;
let npmWasPublished = false;

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

    // check the node version
    await checkNodeVersion();

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

    const runAll = async () => {
        await $`bun run build`;
        console.log("built");
        await writeJson(jsrJsonPath, jsrJson);
        console.log("wrote jsr.json");
        await writeJson(pkgJsonPath, pkgJson);
        console.log("wrote package.json");
        await $`git add -A`;
        console.log("added all files");
        await $`git commit -m "chore: publish v${newVersion}"`
            .then(() => console.log("committed"))
            .catch(() => console.log("no changes to commit"));
        if (SemVer.compare(currentNpmVersion, newVersion) === Ordering.Less) {
            await $`npm publish`.then(
                async () => await updateNpmLog(pkgJson.version),
            );
        } else {
            console.log("npm version is up to date, skipping npm publish");
        }
        if (SemVer.compare(currentJsrVersion, newVersion) === Ordering.Less) {
            await $`bunx jsr publish --allow-slow-types`.then(
                async () => await updateJsrLog(pkgJson.version),
            );
        } else {
            console.log("jsr version is up to date, skipping jsr publish");
        }
        await $`git tag ${SemVer.toString(newVersion)}`;
        await $`git push`;
        await $`git push --tags`;
    };
    await runAll().catch(async (e) => {
        console.error("\nerror publishing, rolling back...\n");
        const prevVersion = `${major}.${minor}.${Number(newPatchVersion) - 1}`;

        jsrJson.version = prevVersion;
        pkgJson.version = prevVersion;

        jsrWasPublished ? void 0 : await writeJson(jsrJsonPath, jsrJson);
        npmWasPublished ? void 0 : await writeJson(pkgJsonPath, pkgJson);
        // reset to last commit
        await $`git add -A && git commit -m "rollback failed publish"`.nothrow();
    });
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
        date: new Date().toISOString(),
    };
    const newPublishedLog = {
        jsr: {
            version: SemVer.toString(publishedLog.jsr.version),
            date: publishedLog.jsr.date.toISOString(),
        },
        npm,
    };
    await writeJson(publishedLogPath, newPublishedLog);

    await $`git add -A && git commit --amend -m "chore: publish v${version}"`.nothrow();
    npmWasPublished = true;
}

async function updateJsrLog(version: string) {
    const publishedLogPath = pathFromRoot("published.json");
    const publishedLogRaw = await readJson(publishedLogPath);
    const publishedLog = unsafe_parsePublishedLog(publishedLogRaw);
    const jsr = {
        version: SemVer.toString(publishedLog.jsr.version),
        date: new Date().toISOString(),
    };
    const newPublishedLog = {
        npm: {
            version: SemVer.toString(publishedLog.npm.version),
            date: publishedLog.npm.date.toISOString(),
        },
        jsr,
    };
    await writeJson(publishedLogPath, newPublishedLog);

    await $`git add -A && git commit --amend -m "chore: publish v${version}"`.nothrow();
    jsrWasPublished = true;
}

async function checkNodeVersion() {
    const nodeVersionRaw = (await commandOutput`node -v`)?.replace("v", "");
    const nodeVersion = SemVer.unsafe_parse(nodeVersionRaw);
    const minNodeVersionRaw = "18.13.0";
    const minNodeVersion = SemVer.unsafe_parse(minNodeVersionRaw);

    if (SemVer.compare(nodeVersion, minNodeVersion) === Ordering.Less) {
        console.error(
            `node version ${nodeVersionRaw} is less than the minimum required version ${minNodeVersionRaw}`,
        );
        process.exit(1);
    }
}

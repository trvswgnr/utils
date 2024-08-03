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

interface PublishedLog {
    jsr: {
        version: SemVer;
        date: Date;
    };
    npm: {
        version: SemVer;
        date: Date;
    };
}

async function main() {
    try {
        await publish();
    } catch (error) {
        console.error("Error during publication:", error);
    }
}

async function publish() {
    const { jsrJson, pkgJson, jsrJsonPath, pkgJsonPath } =
        await loadJsonFiles();
    const newVersion = incrementVersion(jsrJson.version);

    await checkNodeVersion();
    await checkGitState();

    const log = await loadPublishLog();

    await updateVersions(jsrJson, pkgJson, newVersion);
    await commitChanges(newVersion);
    await publishIfNecessary(log, newVersion);
    await pushChanges(newVersion);
}

async function loadJsonFiles() {
    const jsrJsonPath = pathFromRoot("jsr.json");
    const pkgJsonPath = pathFromRoot("package.json");
    const jsrJson = await readJson<JsrJson>(jsrJsonPath);
    const pkgJson = await readJson<PackageJson>(pkgJsonPath);
    return { jsrJson, pkgJson, jsrJsonPath, pkgJsonPath };
}

function incrementVersion(currentVersion: string): SemVer {
    const [major, minor, patch] = currentVersion.split(".");
    const newPatchVersion = Number(patch) + 1;
    return SemVer.unsafe_parse(`${major}.${minor}.${newPatchVersion}`);
}

async function loadPublishLog(): Promise<PublishedLog> {
    const logFile = pathFromRoot("published.json");
    const defaultLog = {
        jsr: { version: "0.0.0", date: new Date().toISOString() },
        npm: { version: "0.0.0", date: new Date().toISOString() },
    };
    const logRaw = await readJson(logFile).catch(() => defaultLog);
    return unsafe_parsePublishedLog(logRaw);
}

async function updateVersions(
    jsrJson: JsrJson,
    pkgJson: PackageJson,
    newVersion: SemVer,
) {
    const versionString = SemVer.toString(newVersion);
    jsrJson.version = versionString;
    pkgJson.version = versionString;
    await writeJson(pathFromRoot("jsr.json"), jsrJson);
    await writeJson(pathFromRoot("package.json"), pkgJson);
}

async function commitChanges(newVersion: SemVer) {
    await $`bun run build`;
    await $`git add -A`;
    await $`git commit -m "chore: publish v${SemVer.toString(
        newVersion,
    )}"`.catch(() => console.log("No changes to commit"));
}

async function publishIfNecessary(log: PublishedLog, newVersion: SemVer) {
    if (SemVer.compare(log.npm.version, newVersion) === Ordering.Less) {
        await $`npm publish`.then(() =>
            updatePublishLog("npm", SemVer.toString(newVersion)),
        );
    } else {
        console.log("npm version is up to date, skipping npm publish");
    }

    if (SemVer.compare(log.jsr.version, newVersion) === Ordering.Less) {
        await $`bunx jsr publish --allow-slow-types`
            .nothrow()
            .then(() => updatePublishLog("jsr", SemVer.toString(newVersion)));
    } else {
        console.log("jsr version is up to date, skipping jsr publish");
    }
}

async function pushChanges(newVersion: SemVer) {
    await $`git tag ${SemVer.toString(newVersion)}`.nothrow();
    await $`git push`.nothrow();
    await $`git push --tags`.nothrow();
}

async function checkGitState() {
    const branch = await $`git branch --show-current`.nothrow().text();
    if (branch.trim() !== "main") {
        throw new Error("Not on main branch, aborting publish");
    }

    const status = await $`git status --porcelain`.nothrow().text();
    if (status.trim()) {
        throw new Error("There are uncommitted changes, aborting publish");
    }
}

function unsafe_parsePublishedLog(publishedLogRaw: JsonValue): PublishedLog {
    if (!isValidPublishedLog(publishedLogRaw)) {
        throw new Error("Published log is invalid");
    }

    return {
        jsr: {
            version: SemVer.unsafe_parse(publishedLogRaw.jsr.version),
            date: new Date(publishedLogRaw.jsr.date),
        },
        npm: {
            version: SemVer.unsafe_parse(publishedLogRaw.npm.version),
            date: new Date(publishedLogRaw.npm.date),
        },
    };
}

function isValidPublishedLog(log: any): log is Required<PublishedLog> {
    return (
        typeof log === "object" &&
        log !== null &&
        typeof log.jsr === "object" &&
        typeof log.npm === "object" &&
        typeof log.jsr.version === "string" &&
        typeof log.jsr.date === "string" &&
        typeof log.npm.version === "string" &&
        typeof log.npm.date === "string"
    );
}

async function updatePublishLog(type: "npm" | "jsr", version: string) {
    const publishedLogPath = pathFromRoot("published.json");
    const publishedLogRaw = await readJson<Record<string, any>>(
        publishedLogPath,
    );

    const updatedLog = {
        ...publishedLogRaw,
        [type]: {
            version,
            date: new Date().toISOString(),
        },
    };

    await writeJson(publishedLogPath, updatedLog);
    await $`git add -A && git commit --amend -m "chore: publish v${version}"`.nothrow();
}

async function checkNodeVersion() {
    const nodeVersionRaw = (await commandOutput`node -v`)?.replace("v", "");
    const nodeVersion = SemVer.unsafe_parse(nodeVersionRaw);
    const minNodeVersion = SemVer.unsafe_parse("18.13.0");

    if (SemVer.compare(nodeVersion, minNodeVersion) === Ordering.Less) {
        throw new Error(
            `Node version ${nodeVersionRaw} is less than the minimum required version 18.13.0`,
        );
    }
}

await main();

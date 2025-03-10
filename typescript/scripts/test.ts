import {
    assertInProjectRoot,
    exec,
    exists,
    joinPaths,
    pathFromRoot,
    readdir,
    exitAfter,
} from "./utils";

assertInProjectRoot();

const moduleName: string | undefined = process.argv[2];
if (!moduleName) {
    exitAfter(await exec("bun test"));
}

await runModuleTests(moduleName);

async function runModuleTests(moduleName: string) {
    const modulePath = pathFromRoot("src", "modules", moduleName);
    if (!exists(modulePath)) {
        throw new Error(`module ${moduleName} does not exist`);
    }
    const testFiles = readdir(modulePath)
        .filter((file) => file.name.endsWith(".test.ts"))
        .map((file) => joinPaths(modulePath, file.name));
    await exec(`bun test ${testFiles.join(" ")}`);
}

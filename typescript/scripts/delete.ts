import {
    pathFromRoot,
    readJson,
    writeJson,
    getConfirmation,
    rmDir,
    type JsrJson,
    type PackageJson,
    type TsUpConfig,
} from "./utils";

const moduleName = process.argv[2];
if (!moduleName) {
    console.error("Must provide a module name");
    process.exit(1);
}

await deleteModule(moduleName);

async function deleteModule(name: string) {
    const confirmed = await getConfirmation(
        `Are you sure you want to delete the module "${name}"?`,
    );
    if (!confirmed) {
        console.log("Deletion cancelled.");
        return;
    }

    const moduleDir = pathFromRoot("src", "modules", name);

    try {
        rmDir(moduleDir);
        console.log(`Deleted module directory: ${moduleDir}`);

        await Promise.all([
            updatePackageJson(name),
            updateTsUpConfig(name),
            updateJsrJson(name),
        ]);

        console.log(`Successfully deleted module: ${name}`);
    } catch (error) {
        console.error(`Error deleting module ${name}:`, error);
    }
}

async function updatePackageJson(moduleName: string) {
    const filepath = pathFromRoot("package.json");
    const packageJson = await readJson<PackageJson>(filepath);
    delete packageJson.exports[`./${moduleName}`];
    await writeJson(filepath, packageJson);
}

async function updateTsUpConfig(moduleName: string) {
    const filepath = pathFromRoot("tsup-config.json");
    const config = await readJson<TsUpConfig>(filepath);
    delete config.entry[moduleName];
    await writeJson(filepath, config);
}

async function updateJsrJson(moduleName: string) {
    const filepath = pathFromRoot("jsr.json");
    const jsrJson = await readJson<JsrJson>(filepath);
    delete jsrJson.exports[`./${moduleName}`];
    await writeJson(filepath, jsrJson);
}

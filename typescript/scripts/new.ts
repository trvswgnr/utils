import {
    joinPaths,
    mkdir,
    pathFromRoot,
    readJson,
    writeJson,
    writeText,
    type JsrJson,
    type PackageJson,
    type TsUpConfig,
} from "./utils";

const moduleName = process.argv[2];
if (!moduleName) {
    console.error("must provide a module name");
    process.exit(1);
}

await createNewModule(moduleName);

async function createNewModule(name: string) {
    // create the module
    const moduleDir = pathFromRoot("src", "modules", name);
    mkdir(moduleDir);
    const indexFilePath = joinPaths(moduleDir, "index.ts");
    const mainFilePath = joinPaths(moduleDir, `${name}.ts`);

    await Promise.all([
        writeText(indexFilePath, `export * from "./${name}";`),
        writeText(mainFilePath, `export {}`),
        updatePackageJson(name),
        updateTsUpConfig(name),
        updateJsrJson(name),
    ]);
}

async function updatePackageJson(moduleName: string) {
    const filepath = pathFromRoot("package.json");
    const packageJson = await readJson<PackageJson>(filepath);
    packageJson.exports[`./${moduleName}`] = {
        import: `./dist/${moduleName}.js`,
        require: `./dist/${moduleName}.cjs`,
    };
    await writeJson(filepath, packageJson);
}

async function updateTsUpConfig(moduleName: string) {
    const filepath = pathFromRoot("tsup-config.json");
    const config = await readJson<TsUpConfig>(filepath);
    config.entry[moduleName] = `src/modules/${moduleName}/index.ts`;
    await writeJson(filepath, config);
}

async function updateJsrJson(moduleName: string) {
    const filepath = pathFromRoot("jsr.json");
    const jsrJson = await readJson<JsrJson>(filepath);
    jsrJson.exports[`./${moduleName}`] = `./src/modules/${moduleName}/index.ts`;
    await writeJson(filepath, jsrJson);
}

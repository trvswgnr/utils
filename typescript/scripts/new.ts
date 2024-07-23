import fs from "node:fs/promises";
import path from "node:path";
import { findWorkspaceRootFrom } from "./utils";

const ROOT_DIR = await findWorkspaceRootFrom(process.cwd());

const packageName = process.argv[2];
if (!packageName) {
    console.error("must provide a package name");
    process.exit(1);
}

await createNewPackage(ROOT_DIR, packageName).catch(console.error);

async function createNewPackage(baseDir: string, name: string) {
    const packagesDir = path.join(baseDir, "packages");
    const newPackageDir = path.join(packagesDir, name);

    console.log(`creating new package: ${name}`);

    // create package directory
    await fs.mkdir(newPackageDir, { recursive: true });

    const readmeContent = `# ${name}

# installation

\`\`\`sh
bunx jsr add @trav/${name}
\`\`\`
`;

    const packageJson = {
        name: `@trav/${name}`,
        version: "0.0.1",
        dependencies: {},
    };

    const tsconfigJson = {
        extends: path.relative(
            newPackageDir,
            path.join(baseDir, "tsconfig.json"),
        ),
    };

    const jsrJson = {
        name: `@trav/${name}`,
        version: "0.0.1",
        exports: {
            ".": "./index.ts",
        },
    };

    await Promise.all([
        fs.writeFile(path.join(newPackageDir, "README.md"), readmeContent),
        fs.writeFile(
            path.join(newPackageDir, "index.ts"),
            "// your code here\n",
        ),
        fs.writeFile(
            path.join(newPackageDir, "package.json"),
            JSON.stringify(packageJson, null, 4),
        ),
        fs.writeFile(
            path.join(newPackageDir, "tsconfig.json"),
            JSON.stringify(tsconfigJson, null, 4) + "\n",
        ),
        fs.writeFile(
            path.join(newPackageDir, "jsr.json"),
            JSON.stringify(jsrJson, null, 4),
        ),
    ]);

    console.log(`package ${name} created successfully!`);
}

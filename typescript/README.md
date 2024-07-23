# @travvy/utils

this is a collection of typescript utils, it uses [**Bun**](https://bun.sh) as
the package manager, which supports workspaces via the "workspace" property in
package.json.

## developing

to install dependencies, make sure you are in the project root directory and
run:

```bash
bun i
```

to clean all node_modules and bun.lockb in the project:

```bash
bun run clean
```

to create a new module:

```bash
bun run new <module-name>
```

## publishing

this project is published to [NPM](https://www.npmjs.com) and
[jsr](https://jsr.io).

to publish a new version, make sure you are in the project root directory and
run:

```bash
bun run release
```

**note**: make sure you are on the main branch and have no uncommitted changes.

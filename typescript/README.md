# typescript-utils

this is the workspace for typescript utils, it uses [**Bun**](https://bun.sh) as the
package manager, which supports workspaces via the "workspace" property in
package.json.

## developing

to install dependencies across all packages:

make sure you are in the workspace root directory and run:

```bash
bun install
```

to clean all node_modules and bun.lockb in the workspace and all packages:

```bash
bun run clean
```

to create a new package:

```bash
bun run new <package-name>
```

## publishing packages

packages are published to the [jsr registry](https://jsr.io).

to publish an individual package (recommended):

```sh
bun run publish <package-name>
```

to publish all packages (not recommended), from the workspace root directory run:

```sh
bun run publish
```

or from the package directory run:

```sh
bunx jsr publish
```

**note**: it's probably not a good idea to publish packages from the workspace
root directory, as it will publish all packages in the workspace. instead,
publish from the package directory, or use the `bun run publish <package-name>`
command from the workspace root directory.

**note**: do not create new git repositories for packages. everything is tracked
via the main repository. instead, create a new branch and make your changes
there.

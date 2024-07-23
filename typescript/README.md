# typescript-utils

this is the workspace for typescript utils, it uses [Bun](https://bun.sh) as the
package manager, which supports workspaces via the "workspace" property in
package.json.

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

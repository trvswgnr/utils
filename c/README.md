# C Utils

This is a collection of C utils. It uses standard C compilation tools and Make
for building and testing.

## Developing

To compile and run the utils, make sure you have a C compiler (like gcc or
clang) and Make installed on your system.

To compile all utils, run:

```bash
make all
```

To clean all compiled objects and executables:

```bash
make clean
```

To create a new module:

```bash
./scripts/new_module.sh <module-name>
```

## Testing

To run all tests:

```bash
make test
```

To run tests for a specific module:

```bash
make test MODULE=<module-name>
```

## Project Structure

```
src/
└── modules/
    └── <module_name>/
        ├── <module_name>.c
        ├── <module_name>.h
        └── <module_name>_test.c
```

## Naming Convention

1. Use snake_case for file names and function names.
2. Use SCREAMING_SNAKE_CASE for constants and macros.
3. Use PascalCase for struct and enum names.
4. Prefix function names with the module name to avoid naming conflicts.

Example:

```c
// In hash_utils.h
#define HASH_UTILS_MAX_SIZE 1000

typedef struct HashTable {
// ...
} HashTable;

void hash_utils_init(HashTable\* table);
```

## Additional Guidelines

1. Always include header guards in your .h files.
2. Use const-correctness where appropriate.
3. Avoid global variables; use static variables within functions if necessary.
4. Write clear and concise comments for functions and complex logic.
5. Follow the principle of single responsibility for functions and modules.

## Usage

To use a module, simply copy the file into your project inside a folder named
"@travvy" and include the header file.

For example, to use the `string` module, copy the `string.h`
files into your project and include the header file.

```c
#include "@travvy/string.h"
``` 
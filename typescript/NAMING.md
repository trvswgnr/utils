# Utility Repository Modular Naming Convention

## Project Structure

```
- src
  - modules
    - [module-name]
      (module contents)
```

## Module Folder Naming

1. Use kebab-case (lowercase with hyphens).
2. Keep names short and descriptive.
3. Use singular nouns for modules representing a single concept.
4. Use plural nouns for modules containing multiple related components.

## File Naming Within Modules

### General Rules

1. Use kebab-case for file names.
2. Keep names descriptive but concise.
3. Use nouns for files that define things (types, classes, constants).
4. Use verbs or verb-noun combinations for files that primarily contain functions or actions.

### Common File Types and Naming Patterns

1. Main module file: `index.ts`
2. Type definitions: `types.ts`
3. Interfaces: `interfaces.ts`
4. Classes: `[name].ts` (e.g., `custom-text-encoder.ts`)
5. Enums: `[name]-enums.ts` (e.g., `encoding-enums.ts`)
6. Constants: `constants.ts`
7. Utility functions: `utils.ts`
8. Tests: `[name].test.ts` (e.g., `custom-text-encoder.test.ts`)
9. Benchmarks: `[name].bench.ts` (e.g., `custom-text-encoder.bench.ts`)

## Examples of Correct Usage

### Module Names
```
✅ http
✅ string
✅ data-process
✅ user
✅ auth
✅ data
```

### File Names
✅ index.ts
✅ types.ts
✅ user.ts
✅ status-enums.ts
✅ constants.ts
✅ utils.ts
✅ auth-service.ts
✅ user-controller.ts
✅ product-model.ts
✅ auth-service-test.ts

## Examples of Incorrect Usage

### Module Names
❌ User (uppercase)
❌ auth_module (underscore)
❌ dataProcessing (camelCase)
❌ API (all caps)

### File Names
❌ Index.ts (uppercase)
❌ user_types.ts (underscore)
❌ UserClass.ts (PascalCase)
❌ statusEnums.ts (camelCase)
❌ CONSTANTS.ts (all caps)
❌ helper-utils.ts (redundant "-utils" suffix)
❌ authService.ts (camelCase)
❌ UserController.ts (PascalCase)
❌ product.model.ts (dot notation)
❌ auth-service.test.ts (extra dot)

## Additional Guidelines

1. If a module grows too large, consider splitting it into sub-modules.
2. Keep related functionality together in the same module.
3. Use `index.ts` to export public interfaces of the module.
4. Avoid abbreviations unless they are widely recognized (e.g., `http`, `json`).
5. If multiple files of the same type are needed, add a descriptive prefix (e.g., `input-types.ts`, `output-types.ts`).
6. For files containing multiple small, related classes or functions, use a plural noun (e.g., `helpers.ts`, `validators.ts`).

## Example Module Structure

This example module will export something like `CustomTextEncoder`, and `CustomTextDecoder`.

Module Name: `codec`

```
src/
└── modules/
    └── codec/
        ├── index.ts
        ├── lib.ts
        ├── types.ts
        ├── codec.ts
        ├── codec.bench.ts
        └── codec.test.ts
```

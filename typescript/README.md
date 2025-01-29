# @travvy/utils

A collection of useful TypeScript utilities that I find myself using often.

To use the library, install it:
```bash
bun i @travvy/utils
# or
npm i @travvy/utils
# or
yarn add @travvy/utils
# or
pnpm add @travvy/utils
```

You can import specific modules like this:
```ts
import { Result } from "@travvy/utils/result";
import { Option } from "@travvy/utils/option";
import { Either } from "@travvy/utils/either";
import { hash_djb2 } from "@travvy/utils/hash";
```

## Modules

### Result
A zero-overhead Result type for robust error handling:
- `Result<T, E extends Error>` - Type representing either success (`T`) or failure (`E extends Error`)
- `Ok<T>` - Success case (cannot be an Error type)
- `Err<E>` - Failure case (must extend Error)
- Built-in TypeScript type narrowing via `instanceof Error`
- Zero runtime overhead compared to raw try/catch

Key functions:
- `Result.of()` - Safely execute functions that may throw
- `Result.ok(value)` - Create a success result
- `Result.err(error)` - Create a failure result
- `Result.isOk(result)` - Type guard for success case
- `Result.isErr(result)` - Type guard for failure case
- `Result.map(result, fn)` - Transform success values
- `Result.match(result, { Ok, Err })` - Pattern match on results
- `Result.orElse(result, fn)` - Chain error recovery
- `Result.getOk(result)` - Extract success value (throws if Err)
- `Result.getErr(result)` - Extract error value (throws if Ok)
- `Result.toArray(result)` - Convert to array ([value] or [])
- Custom error type factories via `Err.factory()`

Example:
```ts
import { Result, Ok, Err } from "@travvy/utils/result";

// Basic usage
const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return Err(new Error("Division by zero"));
  return Ok(a / b);
};

// Using Result.match for pattern matching
divide(10, 2).match({
  Ok: result => console.log(result), // 5
  Err: error => console.error(error.message)
});

// Using Result.of to catch errors
const parse = Result.of((str: string) => {
  const value = JSON.parse(str);
  return Ok(value);
});

// Custom error types
const ParseError = Err.factory(class ParseError extends Error {});
const safeParse = Result.of(ParseError)((str: string) => {
  const value = JSON.parse(str);
  return Ok(value);
});
```

#### Err
The `Err` namespace provides powerful error handling utilities:

- `Err(value)` - Convert any value into an Error
- `Err.from(value)` - Convert any value into an Error with smart handling:
  - Returns existing Error objects as-is
  - Stringifies objects using JSON.stringify
  - Converts other values to strings
- `Err.factory(ErrorClass)` - Create custom error type converters

Example:
```ts
import { Err } from "@travvy/utils/result";

// Basic error creation
const err1 = Err("something went wrong");
const err2 = Err({ code: 404, message: "Not found" });
const err3 = Err(new Error("existing error"));
// Convert any value to an Error
const err4 = Err.from("something went wrong");
// Custom error types
class ValidationError extends Error {}
const toValidationError = Err.factory(ValidationError);
function validate(input: unknown): Result<string, ValidationError> {
    if (typeof input !== "string") {
        return toValidationError(input); // Converts input to ValidationError
    }
    return input; // note that we don't need to wrap in Ok()!
}
```

### Option
A zero-overhead Option type for handling nullable values:
- `Option<T>` - Type representing either Some value (`T`) or None (`null | undefined`)
- `Some<T>` - Non-null value case
- `None` - Null/undefined case
- Built-in TypeScript type narrowing
- Minimal runtime overhead compared to raw null/undefined checks

Key functions:
- `Option.some(value)` - Create a Some value
- `Option.none()` - Create a None value
- `Option.isSome(value)` - Type guard for Some case
- `Option.isNone(value)` - Type guard for None case
- `Option.map(value, fn)` - Transform Some values
- `Option.from(value)` - Convert nullable value to Option
- `Option.of(fn, ...args)` - Safely execute functions that may throw
- `Option.match(value, { Some, None })` - Pattern match on options

Example:
```ts
import { Option, Some, None } from "@travvy/utils/option";

// Basic usage
const divide = (a: number, b: number): Option<number> => {
  if (b === 0) return None();
  return Some(a / b);
};

const x = divide(10, 2);

if (Option.isSome(x)) {
  console.log(x); // 5
}

if (Option.isNone(x)) {
  console.log("Division by zero");
}

// Using Option.match for pattern matching
divide(10, 2).match({
  Some: result => console.log(result), // 5
  None: () => console.error("Division by zero")
});

// Using Option.map to transform values
const doubled = Option.map(divide(10, 2), x => x * 2);

// Converting nullable values
const value: string | null = null;
const opt = Option.from(value); // None
```

### Effect
Effect monad implementation for handling side effects and error handling:
- `run` - Execute effects and handle errors
- `success` - Create successful effects
- `isFailure` - Type guard for failed effects

### Either
A comprehensive Either monad implementation for handling branching computations and error cases:
- `Either<L, R>` - Type representing two possibilities: Left (`L`) or Right (`R`)
- `Left<L>` - Typically represents failure/error cases
- `Right<R>` - Typically represents success/valid cases
- Full Functor, Applicative, and Monad typeclass implementations:
  - `fmap` - Transform Right values while preserving Left
  - `apply` - Apply functions wrapped in Either
  - `bind` - Chain Either computations
- Type-safe pattern matching via `match` method
- Type guards with `isLeft` and `isRight`
- Zero runtime overhead compared to manual branching
- Implements Higher-Kinded Types (HKT) for advanced type-level programming

Example:
```ts
import { Either, Left, Right } from "@travvy/utils/either";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Left("Division by zero") : Right(a / b);

divide(10, 2)
  .fmap(x => x * 2)
  .match({
    Left: err => console.error(err),
    Right: result => console.log(result) // 10
  });
```

### Other Functional Programming Utilities:
Comprehensive functional programming utilities:
- `Alternative` - Alternative typeclass implementation
- `Applicative` - Applicative functor typeclass
- `Compose` - Function composition utilities
- `Functor` - Functor typeclass implementation
- `HKT` - Higher-kinded types support
- `Identity` - Identity monad
- `Maybe` - Maybe monad with Functor/Applicative/Monad instances
- `Monad` - Monad typeclass implementation
- `Monoid` - Monoid typeclass implementation
- `Partial` - Partial application utilities
- `Semigroup` - Semigroup typeclass implementation

### Hash
Fast and efficient string hashing utilities with UTF-8 support:

- `hash_djb2(str)` - DJB2 hash algorithm (using TextEncoder)
- `hash_djb2_xor(str)` - DJB2 XOR variant for better distribution
- `hash_sdbm(str)` - SDBM hash algorithm for string hashing

All hash functions:
- Return 32-bit unsigned integers
- Handle UTF-8 strings correctly (including emoji and surrogate pairs)
- Are deterministic (same input always produces same output)
- Throw on non-string inputs

Example:
```ts
import { hash_djb2, hash_sdbm } from "@travvy/utils/hash";

// Basic usage
const hash1 = hash_djb2("hello world"); // 894552257
const hash2 = hash_sdbm("hello world"); // 430867652

// Works with Unicode
const hash3 = hash_djb2("Hello, 世界!"); // 2250154912
const hash4 = hash_djb2("😂🦀"); // Different hash for emoji
```

### Misc
Collection of miscellaneous utilities:
- `fetchJson` - Typed JSON fetching utility
- `SemVer` - Semantic versioning implementation
- `isConstructor` - Type guard for constructor functions
- `isType` - Type checking utilities
- `flip` - Function argument flipping
- `curry` - Function currying
- `StreamingResponse` - Enhanced Response class for streaming data

### Numbers
Numeric type utilities:
- `i64` - 64-bit integer operations
- `u64` - Unsigned 64-bit integer operations

## Development

This project uses [**Bun**](https://bun.sh) as the package manager, test runner, and runtime for utility scripts.

To install dependencies:
```bash
bun i
```

To clean all node_modules and bun.lockb:
```bash
bun run clean
```

To create a new module:
```bash
bun run new <module-name>
```

## Publishing

This project is published to [NPM](https://www.npmjs.com) and [jsr](https://jsr.io).

To publish a new version:
```bash
bun run release
```

**Note**: Make sure you are on the main branch and have no uncommitted changes.

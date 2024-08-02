# Rust Utils

This is a collection of Rust utils. It uses Cargo for building and testing.

## Developing

To compile and run the utils, make sure you have Rust and Cargo installed on your system.

To build the project:

```bash
cargo build
```

To run tests:

```bash
cargo test
```

To run the CLI:

```bash
cargo run
```

## Project Structure

```
src/
├── lib.rs
├── main.rs
├── modules.rs
└── modules/
    ├── misc.rs
    └── result.rs
```

## Usage

To use a module in your Rust project, add this crate as a dependency in your `Cargo.toml`:

```toml
[dependencies]
travvy-utils = { git = "https://github.com/yourusername/utils.git" }
```

Then, in your Rust code:

```rust
use travvy_utils::modules::misc::example_function;

fn main() {
    println!("{}", example_function());
}
```

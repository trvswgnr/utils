import { hash_djb2, encode, toUTF8Array } from "./fast";
import { Benchmark } from "../benchmark";
import { bench, group, run } from "mitata";

const benchmark = new Benchmark({ iterations: 600_000, warmupIterations: 1000 })
    .group("encoders")
    .withBench("TextEncoder", () =>
        hash_djb2("hello world", encode),
    )
    .withBench("custom", () => hash_djb2("hello world", toUTF8Array));

await benchmark.run();

group("encoders", () => {
    bench("TextEncoder", () => hash_djb2("hello world", encode));
    bench("custom", () => hash_djb2("hello world", toUTF8Array));
});

await run();
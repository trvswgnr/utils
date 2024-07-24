import { hash_djb2, encode as textEncoderEncode, toUTF8Array } from "./fast";
import { bench, group, run } from "mitata";

group("encoders", () => {
    bench("TextEncoder.prototype.encode", () => hash_djb2("hello world", textEncoderEncode));
    bench("custom", () => hash_djb2("hello world", toUTF8Array));
});

await run();

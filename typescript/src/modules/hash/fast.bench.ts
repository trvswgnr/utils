import {
    hash_djb2_manual_encoding,
    hash_djb2_buffer,
    hash_djb2_encoder,
    hash_djb2_custom_encoder_array,
} from "./fast";
import { bench, group, run } from "mitata";

group("encoders", () => {
    bench("TextEncoder", () => hash_djb2_encoder("hello world"));
    bench("Buffer", () => hash_djb2_buffer("hello world"));
    bench("custom encoder", () =>
        hash_djb2_custom_encoder_array("hello world"),
    );
    bench("manual encoding", () => hash_djb2_manual_encoding("hello world"));
});

await run();

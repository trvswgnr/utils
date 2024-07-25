// import { describe, test, expect } from "bun:test";
// import { run } from "./effect";
// import { ok, err, type Result } from "./result";

// describe("Effect", () => {
//     test("run handles successful effects", () => {
//         const effect = run(function* () {
//             const a = yield* ok(5);
//             const b = yield* ok(10);
//             return a + b;
//         });

//         expect(effect).toEqual(ok(15));
//     });

//     test("run handles errors", () => {
//         const effect = run(function* () {
//             const a = yield* ok(5);
//             const b = yield* err("error");
//             return a + b;
//         });

//         expect(effect).toEqual(err("error"));
//     });

//     test("run handles thrown errors", () => {
//         const effect = run(function* () {
//             yield* ok(5);
//             throw new Error("Unexpected error");
//         });

//         expect(effect).toEqual(err(new Error("Unexpected error")));
//     });
// });

import { describe, expect, it } from "bun:test";
import { Result } from "./result";

describe("Result", () => {
    it("should be ok for non-error values", () => {
        let result: unknown = 1;
        expect(Result.isOk(result)).toBe(true);

        result = "test";
        expect(Result.isOk(result)).toBe(true);

        result = true;
        expect(Result.isOk(result)).toBe(true);

        result = new Date();
        expect(Result.isOk(result)).toBe(true);

        result = new Error("test");
        expect(Result.isOk(result)).toBe(false);
    });

    it("should be Err for error values", () => {
        let result: unknown = new Error("test");
        expect(Result.isErr(result)).toBe(true);
        expect(Result.isOk(result)).toBe(false);

        result = "test";
        expect(Result.isErr(result)).toBe(false);
        expect(Result.isOk(result)).toBe(true);

        result = 1;
        expect(Result.isErr(result)).toBe(false);

        result = true;
        expect(Result.isErr(result)).toBe(false);
    });
});

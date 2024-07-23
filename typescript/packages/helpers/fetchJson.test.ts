import { describe, it, expect, spyOn } from "bun:test";
import { fetchJson } from "./fetchJson";

class MockResponse {
    static instanceCount = 0;
    constructor(
        public readonly ok: boolean,
        private jsonSuccess: boolean | "bad parse",
    ) {
        MockResponse.instanceCount++;
    }
    json() {
        if (this.jsonSuccess === "bad parse") {
            return JSON.parse("[");
        }
        if (this.jsonSuccess) {
            return Promise.resolve({ foo: "bar" });
        }
        return Promise.reject(new Error("json error"));
    }
}

describe("fetchJson", () => {
    it("should return successful response when fetch is successful and OK, with no predicate", async () => {
        setupMocks({
            fetchResult: { success: true, ok: true },
            jsonResult: { success: true, data: { foo: "bar" } },
        });

        const result = await fetchJson("test", returnTrue);
        expect(result).toEqual({ foo: "bar" });

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.Response.prototype.json).toHaveBeenCalledTimes(1);
        expect(MockResponse.instanceCount).toEqual(1);
    });

    it("should return successful response when fetch is successful and OK, with valid predicate", async () => {
        setupMocks({
            fetchResult: { success: true, ok: true },
            jsonResult: { success: true, data: { foo: "bar" } },
        });
        const predicate = (x: unknown): x is { foo: "bar" } => {
            return (
                typeof x === "object" &&
                x !== null &&
                "foo" in x &&
                x.foo === "bar"
            );
        };
        const result = await fetchJson("test", predicate);
        expect(result).toEqual({ foo: "bar" });
    });

    it("should return Error 'fetch error' when fetch is unsuccessful", async () => {
        setupMocks({
            fetchResult: { success: false, ok: false },
            jsonResult: { success: true, data: { foo: "bar" } },
        });
        const result = await fetchJson("test", returnTrue);
        expect(result).toBeInstanceOf(Error);
        expect(result).toEqual(new Error("fetch error"));
    });

    it("should return Error 'expected ok response' when fetch is successful but not OK", async () => {
        setupMocks({
            fetchResult: { success: true, ok: false },
            jsonResult: { success: true, data: { foo: "bar" } },
        });

        const result = await fetchJson("test", returnTrue);
        expect(result).toBeInstanceOf(Error);
        expect(result).toEqual(new Error("expected ok response"));

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.Response.prototype.json).toHaveBeenCalledTimes(0);
        expect(MockResponse.instanceCount).toEqual(1);
    });

    it("should return Error 'json error' when fetch is successful and ok but json is unsuccessful", async () => {
        setupMocks({
            fetchResult: { success: true, ok: true },
            jsonResult: { success: false, data: { foo: "bar" } },
        });
        const result = await fetchJson("test", returnTrue);
        expect(result).toBeInstanceOf(Error);
        expect(result).toEqual(new Error("json error"));

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.Response.prototype.json).toHaveBeenCalledTimes(1);
        expect(MockResponse.instanceCount).toEqual(1);
    });

    it("should return Error 'invalid data' when fetch is successful and ok, json is ok, but validation fails", async () => {
        setupMocks({
            fetchResult: { success: true, ok: true },
            jsonResult: { success: true, data: { foo: "bar" } },
        });
        const predicate = (x: unknown): x is string => x === "lol no";
        const result = await fetchJson("test", predicate);
        expect(result).toBeInstanceOf(Error);
        expect(result).toEqual(new Error("invalid data"));

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.Response.prototype.json).toHaveBeenCalledTimes(1);
        expect(MockResponse.instanceCount).toEqual(1);
    });
});

function returnTrue<T>(x: unknown): x is T {
    return true;
}

function setupMocks<T>({
    fetchResult,
    jsonResult,
}: {
    fetchResult: { success: boolean; ok: boolean };
    jsonResult: { success: boolean; data: T };
}) {
    clearMocks();
    MockResponse.instanceCount = 0;

    const response = Object.setPrototypeOf(
        new MockResponse(fetchResult.ok, jsonResult.success),
        new Response(),
    );
    spyOn(globalThis.Response.prototype, "json").mockImplementation(() => {
        if (jsonResult.success) {
            return Promise.resolve(jsonResult.data);
        }
        return Promise.reject(new Error("json error"));
    });
    spyOn(globalThis, "fetch").mockImplementation(() => {
        if (fetchResult.success) {
            return Promise.resolve(response);
        }
        return Promise.reject(new Error("fetch error"));
    });
}

function clearMocks() {
    spyOn(globalThis, "fetch").mockClear();
    spyOn(globalThis.Response.prototype, "json").mockClear();
}

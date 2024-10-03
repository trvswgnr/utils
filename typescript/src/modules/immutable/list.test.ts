import { expect, describe, it } from "bun:test";
import { List } from "./list";

describe("List", () => {
    it("should be a function", () => {
        expect(List).toBeInstanceOf(Function);
    });
    it("should be instanceof List", () => {
        expect(new List()).toBeInstanceOf(List);
        expect(new List()).not.toBeInstanceOf(Array);
    });
    it("should have all static properties", () => {
        expect(List.empty).toBeInstanceOf(Function);
    });

    it("should have all instance methods", () => {
        for (const name of Object.getOwnPropertyNames(Array.prototype)) {
            const val = List.prototype[name as any];
            if (typeof val !== "function") continue;
            expect(val).toBeInstanceOf(Function);
            expect(compareDescriptors(Array.prototype, List.prototype, name)).toBe(true);
        }
    });
});

function compareDescriptors(CtorA: any, CtorB: any, name: string) {
    const a = Object.getOwnPropertyDescriptor(CtorA, name);
    const b = Object.getOwnPropertyDescriptor(CtorB, name);
    if (!a || !b) return false;
    return (
        a.writable === b.writable &&
        a.enumerable === b.enumerable &&
        a.configurable === b.configurable
    );
}

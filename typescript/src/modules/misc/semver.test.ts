import { describe, it, test, expect } from "bun:test";
import { SemVer } from "./semver";
import { Ordering } from "./cmp";

describe("parse", () => {
    describe("X.Y.Z", () => {
        it.each([
            ["0.0.0", [0n, 0n, 0n, [], []]], // i guess ¯\_(ツ)_/¯
            ["0.0.1", [0n, 0n, 1n, [], []]],
            ["1.2.3", [1n, 2n, 3n, [], []]],
            ["10.20.30", [10n, 20n, 30n, [], []]],
            ["123.456.789", [123n, 456n, 789n, [], []]],
        ])(
            "parses well-formed X.Y.Z: %s",
            (ver, [major, minor, patch, prerelease, metadata]) => {
                const result = SemVer.parse(ver);
                expect(result).toEqual({
                    major,
                    minor,
                    patch,
                    prerelease,
                    metadata,
                } as any);
            },
        );
        test.each(["-1.2.3", "1.-2.3", "1.2.-3"])(
            "returns ParseError for containing negative integers: %s",
            (ver) => {
                const result = SemVer.parse(ver);
                expect(result).toBeInstanceOf(SemVer.Error);
            },
        );
        test.each(["01.2.3", "1.02.3", "1.2.03"])(
            "returns ParseError for containing leading zeros: %s",
            (ver) => {
                const result = SemVer.parse(ver);
                expect(result).toBeInstanceOf(SemVer.Error);
            },
        );
        test.each(["1.2.3.4", "1.2.3.04", "1.2.3.5", "1.2", "1-3"])(
            "returns ParseError for X.Y.Z containing less or more than three components: %s",
            (ver) => {
                const result = SemVer.parse(ver);
                expect(result).toBeInstanceOf(SemVer.Error);
            },
        );
    });
    describe("pre-release", () => {
        it.each([
            ["1.2.3-alpha", [1n, 2n, 3n, ["alpha"], []]],
            ["1.2.3-beta.2", [1n, 2n, 3n, ["beta", "2"], []]],
            ["1.2.3-rc.1.2", [1n, 2n, 3n, ["rc", "1", "2"], []]],
            ["1.2.3-0.3.7", [1n, 2n, 3n, ["0", "3", "7"], []]],
            ["1.2.3-x.7.z.92", [1n, 2n, 3n, ["x", "7", "z", "92"], []]],
        ])(
            "parses well-formed pre-release identifiers: %s",
            (ver, [major, minor, patch, prerelease, metadata]) => {
                const result = SemVer.parse(ver);
                expect(result).toEqual({
                    major,
                    minor,
                    patch,
                    prerelease,
                    metadata,
                } as any);
            },
        );

        test.each([
            "1.2.3-",
            "1.2.3-.",
            "1.2.3-alpha.",
            "1.2.3-.alpha",
            "1.2.3-alpha..beta",
            "1.2.3-alpha.01",
            "1.2.3-01",
        ])(
            "returns ParseError for invalid pre-release identifiers: %s",
            (ver) => {
                const result = SemVer.parse(ver);
                expect(result).toBeInstanceOf(SemVer.Error);
            },
        );
    });

    describe("build metadata", () => {
        it.each([
            ["1.2.3+0", [1n, 2n, 3n, [], ["0"]]],
            ["1.2.3+build", [1n, 2n, 3n, [], ["build"]]],
            ["1.2.3+build.1", [1n, 2n, 3n, [], ["build", "1"]]],
            ["1.2.3+0.3.7", [1n, 2n, 3n, [], ["0", "3", "7"]]],
            ["1.2.3+x.y.z", [1n, 2n, 3n, [], ["x", "y", "z"]]],
            ["1.2.3-alpha+001", [1n, 2n, 3n, ["alpha"], ["001"]]],
            [
                "1.2.3-beta+exp.sha.5114f85",
                [1n, 2n, 3n, ["beta"], ["exp", "sha", "5114f85"]],
            ],
        ])(
            "parses well-formed build metadata: %s",
            (ver, [major, minor, patch, prerelease, metadata]) => {
                const result = SemVer.parse(ver);
                expect(result).toEqual({
                    major,
                    minor,
                    patch,
                    prerelease,
                    metadata,
                } as any);
            },
        );

        test.each([
            "1.2.3+",
            "1.2.3+.",
            "1.2.3+build.",
            "1.2.3+.build",
            "1.2.3+build..info",
        ])("returns ParseError for invalid build metadata: %s", (ver) => {
            const result = SemVer.parse(ver);
            expect(result).toBeInstanceOf(SemVer.Error);
        });
    });

    describe("examples from spec", () => {
        it.each([
            ["1.9.0", [1n, 9n, 0n, [], []]],
            ["1.10.0", [1n, 10n, 0n, [], []]],
            ["1.11.0", [1n, 11n, 0n, [], []]],
            ["1.0.0-alpha", [1n, 0n, 0n, ["alpha"], []]],
            ["1.0.0-alpha.1", [1n, 0n, 0n, ["alpha", "1"], []]],
            ["1.0.0-0.3.7", [1n, 0n, 0n, ["0", "3", "7"], []]],
            ["1.0.0-x.7.z.92", [1n, 0n, 0n, ["x", "7", "z", "92"], []]],
            ["1.0.0-x-y-z.--", [1n, 0n, 0n, ["x-y-z", "--"], []]],
            ["1.0.0-alpha+001", [1n, 0n, 0n, ["alpha"], ["001"]]],
            ["1.0.0+20130313144700", [1n, 0n, 0n, [], ["20130313144700"]]],
            [
                "1.0.0-beta+exp.sha.5114f85",
                [1n, 0n, 0n, ["beta"], ["exp", "sha", "5114f85"]],
            ],
            [
                "1.0.0+21AF26D3----117B344092BD",
                [1n, 0n, 0n, [], ["21AF26D3----117B344092BD"]],
            ],
        ])(
            "parses %s successfully",
            (ver, [major, minor, patch, prerelease, metadata]) => {
                const result = SemVer.parse(ver);
                expect(result).toEqual({
                    major,
                    minor,
                    patch,
                    prerelease,
                    metadata,
                } as any);
            },
        );
    });
});

describe("precedence", () => {
    it.each([
        ["1.0.0", "2.0.0", Ordering.Less],
        ["2.0.0", "2.1.0", Ordering.Less],
        ["2.1.0", "2.1.1", Ordering.Less],
        ["1.0.0-alpha", "1.0.0-alpha.1", Ordering.Less],
        ["1.0.0-alpha.1", "1.0.0-alpha.beta", Ordering.Less],
        ["1.0.0-beta", "1.0.0-beta.2", Ordering.Less],
        ["1.0.0-beta.2", "1.0.0-beta.11", Ordering.Less],
        ["1.0.0-beta.11", "1.0.0-rc.1", Ordering.Less],
        ["1.0.0-rc.1", "1.0.0", Ordering.Less],
    ])("%s is less than %s", (a, b, expected) => {
        const result = SemVer.compare(
            SemVer.unsafe_parse(a),
            SemVer.unsafe_parse(b),
        );
        expect(result).toBe(expected);
    });

    it.each([
        ["3.0.0", "2.9.9", Ordering.Greater],
        ["2.2.0", "2.1.9", Ordering.Greater],
        ["1.9.1", "1.9.0", Ordering.Greater],
        ["1.0.0", "1.0.0-rc.2", Ordering.Greater],
        ["1.0.0-beta.11", "1.0.0-beta.2", Ordering.Greater],
        ["1.0.0-alpha.beta", "1.0.0-alpha.1", Ordering.Greater],
        ["1.0.0-alpha.2", "1.0.0-alpha", Ordering.Greater],
        ["2.0.0-rc.1", "1.9.9", Ordering.Greater],
        ["1.0.0-alpha.1", "1.0.0-alpha.0", Ordering.Greater],
    ])("%s is greater than %s", (a, b, expected) => {
        const result = SemVer.compare(
            SemVer.unsafe_parse(a),
            SemVer.unsafe_parse(b),
        );
        expect(result).toBe(expected);
    });

    it.each([
        ["1.0.0", "1.0.0"],
        ["2.1.3", "2.1.3"],
        ["1.0.0-alpha", "1.0.0-alpha"],
        ["1.2.3-beta.4", "1.2.3-beta.4"],
        ["3.0.0-rc.1+build.123", "3.0.0-rc.1+build.456"],
    ])("%s is equal to %s", (a, b) => {
        const result = SemVer.compare(
            SemVer.unsafe_parse(a),
            SemVer.unsafe_parse(b),
        );
        expect(result).toBe(Ordering.Equal);
    });
});

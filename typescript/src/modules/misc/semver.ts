import { Result } from "../../modules/result";
import type { Branded } from "../../types";
import { Ordering } from "./ordering";
import { u64 } from "../../modules/numbers";

/**
 * A version that complies with the Semantic Versioning 2.0.0 specification
 *
 * @see https://semver.org
 */
export type SemVer = {
    readonly major: u64;
    readonly minor: u64;
    readonly patch: u64;
    readonly prerelease: SemVer.Identifiers;
    readonly metadata: SemVer.Identifiers;
};

export namespace SemVer {
    export const regex = combineRegex([
        /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)/,
        /(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?/,
        /(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    ]);

    export enum ReleaseType {
        Major = "major",
        Minor = "minor",
        Patch = "patch",
    }

    /**
     * A string that comprises only ASCII alphanumerics and hyphens
     * ([0-9A-Za-z-])
     */
    export type ValidIdentifier = Branded<string, "ValidToken">;

    /**
     * A list of valid identifiers
     */
    export type Identifiers = readonly ValidIdentifier[];

    /**
     * An error that occurs when working with semver
     */
    export class Error extends globalThis.Error {
        public override readonly name = "SemVerParseError";

        constructor(message: string, extra?: { cause: unknown }) {
            super(message, { ...extra });
        }

        public static from(cause: unknown): SemVer.Error {
            if (cause instanceof SemVer.Error) return cause;
            if (cause instanceof globalThis.Error) {
                return new SemVer.Error(cause.message, { cause });
            }
            return new SemVer.Error(`Unknown error`, { cause });
        }

        public static is(x: unknown): x is Error {
            return x instanceof Error;
        }
    }

    /**
     * Safely parse a semver string
     *
     * @returns a {@link Result} that is either a {@link SemVer} or a
     * {@link SemVer.Error}
     */
    export function parse(x: string): Result<SemVer, SemVer.Error> {
        return Result.of(SemVer.Error)(unsafe_parse, x);
    }

    /**
     * Parse a semver string, throwing an error if the string is not a valid
     * semver string
     *
     * ## Safety
     * This function is unsafe and can throw errors. Prefer {@link SemVer.parse}
     * instead.
     *
     * @throws a {@link SemVer.Error} if the string is not a valid semver string
     */
    export function unsafe_parse(x: string): SemVer {
        const match = x.match(SemVer.regex);

        validateMatch(match);

        const major = u64.unsafe_parse(match!.groups!.major);
        const minor = u64.unsafe_parse(match!.groups!.minor);
        const patch = u64.unsafe_parse(match!.groups!.patch);

        const prerelease = unsafe_parseIdentifiers(match!.groups!.prerelease);
        const metadata = unsafe_parseIdentifiers(match!.groups!.buildmetadata);

        return {
            major,
            minor,
            patch,
            prerelease,
            metadata,
        };
    }

    export function release(
        current: SemVer,
        type: ReleaseType,
        prerelease?: string,
        metadata?: string,
    ): Result<SemVer, SemVer.Error> {
        const proposed = Result.of(SemVer.Error)(() =>
            unsafe_getProposedRelease(current, type, prerelease, metadata),
        );
        if (Result.isErr(proposed)) return proposed;
        if (compare(proposed, current) !== Ordering.Greater) {
            return new SemVer.Error(
                `Proposed release (${toString(
                    proposed,
                )}) must be greater than current (${toString(current)})`,
            );
        }
        return proposed;
    }

    export function compare(a: SemVer, b: SemVer): Ordering {
        const xyz = compareXYZ(a, b);
        if (xyz !== Ordering.Equal) return xyz;

        // Compare prerelease
        const prereleaseComparison = unsafe_comparePrerelease(
            a.prerelease,
            b.prerelease,
        );
        if (prereleaseComparison !== Ordering.Equal) {
            return prereleaseComparison;
        }

        return Ordering.Equal;
    }

    export function toString(x: SemVer): string {
        const base = `${x.major}.${x.minor}.${x.patch}`;
        const prerelease =
            x.prerelease.length > 0 ? `-${x.prerelease.join(".")}` : "";
        const metadata =
            x.metadata.length > 0 ? `+${x.metadata.join(".")}` : "";
        return `${base}${prerelease}${metadata}`;
    }
}

export function validateMatch(match: RegExpMatchArray | null) {
    if (!match || !match.groups) {
        throw new SemVer.Error(`Malformed semver string`);
    }
    if (!match.groups.major) {
        throw new SemVer.Error(`Major version is missing`);
    }
    if (!match.groups.minor) {
        throw new SemVer.Error(`Minor version is missing`);
    }
    if (!match.groups.patch) {
        throw new SemVer.Error(`Patch version is missing`);
    }
}

function unsafe_comparePrerelease(
    a: SemVer.Identifiers,
    b: SemVer.Identifiers,
): Ordering {
    // a version with a prerelease has lower precedence than a version without,
    // e.g. 1.0.0-alpha < 1.0.0
    if (a.length > 0 && b.length === 0) return Ordering.Less;
    if (a.length === 0 && b.length > 0) return Ordering.Greater;

    const minLength = Math.min(a.length, b.length);

    for (let i = 0; i < minLength; i++) {
        const idA = a[i]!;
        const idB = b[i]!;

        if (isDigitString(idA) && isDigitString(idB)) {
            // Both are numeric identifiers, compare numerically
            const numA = u64.unsafe_parse(idA);
            const numB = u64.unsafe_parse(idB);
            if (numA > numB) return Ordering.Greater;
            if (numA < numB) return Ordering.Less;
        } else if (isDigitString(idA) && !isDigitString(idB)) {
            // Numeric identifiers have lower precedence
            return Ordering.Less;
        } else if (!isDigitString(idA) && isDigitString(idB)) {
            // Numeric identifiers have lower precedence
            return Ordering.Greater;
        } else {
            // Both are non-numeric identifiers or mixed, compare lexically
            const comparison = lexicalCompare(idA, idB);
            if (comparison !== Ordering.Equal) return comparison;
        }
    }

    // If all preceding identifiers are equal, the larger set has higher
    // precedence
    if (a.length > b.length) return Ordering.Greater;
    if (a.length < b.length) return Ordering.Less;

    return Ordering.Equal;
}

function isDigitString(x: string): boolean {
    return /^[0-9]+$/.test(x);
}

function lexicalCompare(a: string, b: string): Ordering {
    const minLen = Math.min(a.length, b.length);
    let ac: number;
    let bc: number;
    for (let i = 0; i < minLen; i++) {
        ac = a.charCodeAt(i);
        bc = b.charCodeAt(i);
        if (ac === bc) continue;
        return ac > bc ? Ordering.Greater : Ordering.Less;
    }
    if (a.length === b.length) return Ordering.Equal;
    return a.length > b.length ? Ordering.Greater : Ordering.Less;
}

function compareXYZ(a: SemVer, b: SemVer): Ordering {
    // Compare major version
    if (a.major > b.major) return Ordering.Greater;
    if (a.major < b.major) return Ordering.Less;

    // Compare minor version
    if (a.minor > b.minor) return Ordering.Greater;
    if (a.minor < b.minor) return Ordering.Less;

    // Compare patch version
    if (a.patch > b.patch) return Ordering.Greater;
    if (a.patch < b.patch) return Ordering.Less;

    return Ordering.Equal;
}

function unsafe_getProposedRelease(
    current: SemVer,
    type: SemVer.ReleaseType,
    prerelease?: string,
    metadata?: string,
): SemVer {
    const prerelease_ = unsafe_parseIdentifiers(prerelease);
    const metadata_ = unsafe_parseIdentifiers(metadata);
    switch (type) {
        case SemVer.ReleaseType.Major:
            return {
                major: (current.major + 1n) as u64,
                minor: 0n as u64,
                patch: 0n as u64,
                prerelease: prerelease_,
                metadata: metadata_,
            };
        case SemVer.ReleaseType.Minor:
            return {
                major: current.major,
                minor: (current.minor + 1n) as u64,
                patch: 0n as u64,
                prerelease: prerelease_,
                metadata: metadata_,
            };
        case SemVer.ReleaseType.Patch:
            return {
                major: current.major,
                minor: current.minor,
                patch: (current.patch + 1n) as u64,
                prerelease: prerelease_,
                metadata: metadata_,
            };
    }
}

function unsafe_parseIdentifiers(x?: string): SemVer.Identifiers {
    if (typeof x === "undefined") return [];
    const regex = /[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*$/;
    const wellFormed = x.match(regex);
    if (!wellFormed) {
        throw new SemVer.Error(`Malformed identifier string: ${x}`);
    }
    return x.split(".").map((x) => x as SemVer.ValidIdentifier);
}

function combineRegex(regexes: RegExp[]) {
    return new RegExp(regexes.map((x) => x.source).join(""));
}

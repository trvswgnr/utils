import { UTF8Encoder } from "./codec";

let encoder: TextEncoder | null = null;

export const hash_djb2 = hash_djb2_manual_encoding;

export function hash_djb2_encoder(s: string): number {
    if (typeof s !== "string") throw new Error("Expected a string");
    encoder ??= new TextEncoder();
    const bytes = encoder.encode(s);
    let hash = 5381;
    let c: number;
    for (let i = 0; i < bytes.length; i++) {
        c = bytes[i]!;
        hash = (hash << 5) + hash + c;
    }
    return hash >>> 0;
}

export function hash_djb2_buffer(s: string): number {
    const bytes = Buffer.from(s);

    let hash = 5381;
    let c: number;
    for (let i = 0; i < bytes.length; i++) {
        c = bytes[i]!;
        hash = (hash << 5) + hash + c;
    }
    return hash >>> 0;
}

export function hash_djb2_custom_encoder_array(s: string): number {
    const bytes = UTF8Encoder.encode(s);

    let hash = 5381;
    let c: number;
    for (let i = 0; i < bytes.length; i++) {
        c = bytes[i]!;
        hash = (hash << 5) + hash + c;
    }
    return hash >>> 0;
}

export function hash_djb2_manual_encoding(s: string): number {
    let hash = 5381;
    const len = s.length;
    let c: number;
    for (let i = 0; i < len; i++) {
        c = s.charCodeAt(i);
        if (c < 128) {
            hash = (hash << 5) + hash + c;
        } else if (c < 2048) {
            hash = (hash << 5) + hash + (192 | (c >> 6));
            hash = (hash << 5) + hash + (128 | (c & 63));
        } else if (c < 55296 || c >= 57344) {
            hash = (hash << 5) + hash + (224 | (c >> 12));
            hash = (hash << 5) + hash + (128 | ((c >> 6) & 63));
            hash = (hash << 5) + hash + (128 | (c & 63));
        } else {
            c = 65536 + (((c & 1023) << 10) | (s.charCodeAt(++i) & 1023));
            hash = (hash << 5) + hash + (240 | (c >> 18));
            hash = (hash << 5) + hash + (128 | ((c >> 12) & 63));
            hash = (hash << 5) + hash + (128 | ((c >> 6) & 63));
            hash = (hash << 5) + hash + (128 | (c & 63));
        }
    }
    return hash >>> 0;
}

export function hash_djb2_xor(s: string): number {
    encoder ??= new TextEncoder();
    const bytes = encoder.encode(s);

    let hash = 5381;
    let c: number;
    for (let i = 0; i < bytes.length; i++) {
        c = bytes[i]!;
        hash = ((hash << 5) + hash) ^ c;
    }

    return hash >>> 0;
}

/**
 * generates a hash code for a string using the sdbm algorithm
 *
 * @param s - the input string to hash
 * @returns a 32-bit unsigned integer hash code
 */
export function hash_sdbm(s: string): number {
    encoder ??= new TextEncoder();
    const bytes = encoder.encode(s);

    let hash = 0;
    let c: number;
    for (let i = 0; i < bytes.length; i++) {
        c = bytes[i]!;
        hash = c + (hash << 6) + (hash << 16) - hash;
    }

    return hash >>> 0;
}

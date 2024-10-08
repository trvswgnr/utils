export namespace UTF8Encoder {
    export function encode(str: string): Array<number> {
        const utf8: Array<number> = [];
        for (let i = 0; i < str.length; i++) {
            let charcode = str.charCodeAt(i);
            if (charcode < 0x80) {
                utf8.push(charcode);
                continue;
            }
            if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
                continue;
            }
            if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(
                    0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f),
                );
                continue;
            }
            if (charcode < 0xdc00 && i + 1 < str.length) {
                const nextCharCode = str.charCodeAt(i + 1);
                if (nextCharCode < 0xdc00 || nextCharCode > 0xe000) {
                    throw new Error(`Invalid surrogate pair at index ${i}`);
                }
                i++;
                charcode =
                    (0x10000 + ((charcode & 0x3ff) << 10)) |
                    (nextCharCode & 0x3ff);
                utf8.push(
                    0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f),
                );
                continue;
            }
            throw new Error(`Invalid Unicode code point at index ${i}`);
        }
        return utf8;
    }

    /**
     * Converts a UTF-8 byte array back to a string.
     *
     * @param utf8Array - The UTF-8 byte array to convert.
     * @returns The decoded string.
     * @throws {Error} If an invalid UTF-8 sequence is encountered.
     */
    export function decode(utf8Array: Uint8Array): string {
        let str = "";
        for (let i = 0; i < utf8Array.length; ) {
            let charcode: number;
            if (utf8Array[i]! < 0x80) {
                charcode = utf8Array[i++]!;
            } else if (utf8Array[i]! < 0xe0) {
                if (i + 1 >= utf8Array.length)
                    throw new Error("Invalid UTF-8 sequence");
                charcode =
                    ((utf8Array[i++]! & 0x1f) << 6) | (utf8Array[i++]! & 0x3f);
            } else if (utf8Array[i]! < 0xf0) {
                if (i + 2 >= utf8Array.length)
                    throw new Error("Invalid UTF-8 sequence");
                charcode =
                    ((utf8Array[i++]! & 0x0f) << 12) |
                    ((utf8Array[i++]! & 0x3f) << 6) |
                    (utf8Array[i++]! & 0x3f);
            } else {
                if (i + 3 >= utf8Array.length)
                    throw new Error("Invalid UTF-8 sequence");
                charcode =
                    ((utf8Array[i++]! & 0x07) << 18) |
                    ((utf8Array[i++]! & 0x3f) << 12) |
                    ((utf8Array[i++]! & 0x3f) << 6) |
                    (utf8Array[i++]! & 0x3f);
            }
            if (charcode <= 0xffff) {
                str += String.fromCharCode(charcode);
            } else {
                charcode -= 0x10000;
                str += String.fromCharCode(
                    (charcode >> 10) + 0xd800,
                    (charcode & 0x3ff) + 0xdc00,
                );
            }
        }
        return str;
    }
}

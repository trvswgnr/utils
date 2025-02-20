/** magic bytes to confirm correct format */
const MAGIC = [0x42, 0x53, 0x31, 0x00] as const; // "BS1\0"

/** type constants for binary encoding */
const TYPE = {
    NULL: 0,
    UNDEFINED: 1,
    BOOLEAN: 2,
    INT8: 3,
    UINT8: 4,
    INT16: 5,
    UINT16: 6,
    INT32: 7,
    UINT32: 8,
    FLOAT32: 9,
    FLOAT64: 10,
    STRING: 11,
    DATE: 12,
    ARRAY: 13,
    OBJECT: 14,
    MAP: 15,
    BINARY: 16,
    UUID: 17,
    REFERENCE: 18, // type for circular references
} as const;

let CRC32Table: Uint32Array | null = null;

/**
 * CRC32 implementation for checksum calculation
 */
export function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    CRC32Table = CRC32Table ?? generateCRC32Table();

    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ CRC32Table[(crc ^ data[i]!) & 0xff]!;
    }

    return ~crc >>> 0; // finalize the CRC
}

function generateCRC32Table(): Uint32Array {
    const table = new Uint32Array(256);

    for (let i = 0; i < 256; i++) {
        let crc = i;
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
        }
        table[i] = crc;
    }

    return table;
}

/**
 * BinarySerializer - A fast binary serialization format.
 * Includes CRC32 checksum for data integrity verification.
 * Handles circular references.
 */
export class BinarySerializer {
    private static GROWTH_FACTOR = 1.5;
    private static INITIAL_CAPACITY = 1024;
    private static MAX_DEPTH = 100;
    private static TEXT_ENCODER: TextEncoder | null = null;
    private buffer: ArrayBuffer;
    private dataView: DataView;
    private uint8View: Uint8Array;
    private position: number;
    private currentDepth: number;
    private objectRefs: Map<object, number>; // tracks object references
    private nextRefId: number;

    constructor() {
        this.buffer = new ArrayBuffer(BinarySerializer.INITIAL_CAPACITY);
        this.dataView = new DataView(this.buffer);
        this.uint8View = new Uint8Array(this.buffer);
        this.position = 0;
        this.currentDepth = 0;
        this.objectRefs = new Map();
        this.nextRefId = 0;
    }

    // make sure buffer has enough capacity
    private growBuffer(bytes: number): void {
        const requiredSize = this.position + bytes;
        if (requiredSize <= this.buffer.byteLength) return;

        const newSize = Math.ceil(requiredSize * BinarySerializer.GROWTH_FACTOR);
        const newBuffer = new ArrayBuffer(newSize);
        const newUint8View = new Uint8Array(newBuffer);
        newUint8View.set(this.uint8View);

        this.buffer = newBuffer;
        this.dataView = new DataView(newBuffer);
        this.uint8View = newUint8View;
    }

    // write a single byte
    private writeByte(value: number): void {
        this.growBuffer(1);
        this.dataView.setUint8(this.position, value);
        this.position += 1;
    }

    // write type tag
    private writeType(type: number): void {
        this.writeByte(type);
    }

    // write variable-length integer (LEB128 encoding)
    private writeVarUint(value: number): void {
        let v = value;
        do {
            let byte = v & 0x7f;
            v >>>= 7;
            if (v !== 0) {
                byte |= 0x80;
            }
            this.writeByte(byte);
        } while (v !== 0);
    }

    // write fixed-size integers
    private writeInt8(value: number): void {
        this.growBuffer(1);
        this.dataView.setInt8(this.position, value);
        this.position += 1;
    }

    private writeUint8(value: number): void {
        this.growBuffer(1);
        this.dataView.setUint8(this.position, value);
        this.position += 1;
    }

    private writeInt16(value: number): void {
        this.growBuffer(2);
        this.dataView.setInt16(this.position, value, true);
        this.position += 2;
    }

    private writeUint16(value: number): void {
        this.growBuffer(2);
        this.dataView.setUint16(this.position, value, true);
        this.position += 2;
    }

    private writeInt32(value: number): void {
        this.growBuffer(4);
        this.dataView.setInt32(this.position, value, true);
        this.position += 4;
    }

    private writeUint32(value: number): void {
        this.growBuffer(4);
        this.dataView.setUint32(this.position, value, true);
        this.position += 4;
    }

    private writeFloat64(value: number): void {
        this.growBuffer(8);
        this.dataView.setFloat64(this.position, value, true);
        this.position += 8;
    }

    // write string with length prefix
    private writeString(value: string): void {
        BinarySerializer.TEXT_ENCODER =
            BinarySerializer.TEXT_ENCODER ?? new TextEncoder();
        const encoded = BinarySerializer.TEXT_ENCODER.encode(value);
        this.writeVarUint(encoded.length);
        this.growBuffer(encoded.length);
        this.uint8View.set(encoded, this.position);
        this.position += encoded.length;
    }

    // write UUID as 16 bytes
    private writeUuid(value: string): void {
        this.growBuffer(16);
        // remove dashes and convert to bytes
        const hex = value.replace(/-/g, "");
        for (let i = 0; i < 16; i++) {
            const byte = Number.parseInt(hex.substr(i * 2, 2), 16);
            this.writeByte(byte);
        }
    }

    // write binary data with length prefix
    private writeBinary(value: Uint8Array): void {
        this.writeVarUint(value.length);
        this.growBuffer(value.length);
        this.uint8View.set(value, this.position);
        this.position += value.length;
    }

    // write Date as timestamp (milliseconds since epoch)
    private writeDate(value: Date): void {
        this.writeFloat64(value.getTime());
    }

    // write a reference to a previously serialized object
    private writeReference(refId: number): void {
        this.writeType(TYPE.REFERENCE);
        this.writeVarUint(refId);
    }

    // track and potentially get reference for an object
    private processObjectReference<T extends object>(obj: T): number | null {
        if (this.objectRefs.has(obj)) {
            return this.objectRefs.get(obj)!;
        }

        const refId = this.nextRefId++;
        this.objectRefs.set(obj, refId);
        return null;
    }

    // serialize a value based on its JavaScript type
    private serializeValue<T>(value: T): void {
        // check for max depth
        this.currentDepth++;
        if (this.currentDepth > BinarySerializer.MAX_DEPTH) {
            this.currentDepth--;
            throw new Error(
                `Max serialization depth (${BinarySerializer.MAX_DEPTH}) exceeded. Possible overly nested structure.`,
            );
        }

        try {
            if (value === null) {
                this.writeType(TYPE.NULL);
                return;
            }

            if (value === undefined) {
                this.writeType(TYPE.UNDEFINED);
                return;
            }

            // handle circular references for objects
            if (typeof value === "object" && value !== null) {
                const existingRef = this.processObjectReference(value);
                if (existingRef !== null) {
                    this.writeReference(existingRef);
                    return;
                }
            }

            switch (typeof value) {
                case "boolean":
                    this.writeType(TYPE.BOOLEAN);
                    this.writeByte(value ? 1 : 0);
                    break;

                case "number":
                    // choose the most efficient numeric representation
                    if (Number.isInteger(value)) {
                        if (value >= -128 && value <= 127) {
                            this.writeType(TYPE.INT8);
                            this.writeInt8(value);
                        } else if (value >= 0 && value <= 255) {
                            this.writeType(TYPE.UINT8);
                            this.writeUint8(value);
                        } else if (value >= -32768 && value <= 32767) {
                            this.writeType(TYPE.INT16);
                            this.writeInt16(value);
                        } else if (value >= 0 && value <= 65535) {
                            this.writeType(TYPE.UINT16);
                            this.writeUint16(value);
                        } else if (value >= -2147483648 && value <= 2147483647) {
                            this.writeType(TYPE.INT32);
                            this.writeInt32(value);
                        } else if (value >= 0 && value <= 4294967295) {
                            this.writeType(TYPE.UINT32);
                            this.writeUint32(value);
                        } else {
                            // for larger integers, always use Float64 to maintain precision
                            this.writeType(TYPE.FLOAT64);
                            this.writeFloat64(value);
                        }
                    } else {
                        // always use Float64 for non-integer values to maintain precision
                        this.writeType(TYPE.FLOAT64);
                        this.writeFloat64(value);
                    }
                    break;

                case "string":
                    // check if string is UUID format
                    if (
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                            value,
                        )
                    ) {
                        this.writeType(TYPE.UUID);
                        this.writeUuid(value);
                    } else {
                        this.writeType(TYPE.STRING);
                        this.writeString(value);
                    }
                    break;

                case "object":
                    if (value instanceof Date) {
                        this.writeType(TYPE.DATE);
                        this.writeDate(value);
                    } else if (value instanceof Uint8Array) {
                        this.writeType(TYPE.BINARY);
                        this.writeBinary(value);
                    } else if (Array.isArray(value)) {
                        this.writeType(TYPE.ARRAY);
                        this.writeVarUint(value.length);
                        for (let i = 0; i < value.length; i++) {
                            this.serializeValue(value[i]);
                        }
                    } else {
                        // handle regular objects
                        const entries = Object.entries(value);

                        // determine if object is a map (record) or a structured object
                        const isRecord = entries.every(
                            ([key]) => typeof key === "string",
                        );

                        if (isRecord) {
                            this.writeType(TYPE.MAP);
                            this.writeVarUint(entries.length);
                            for (const [key, val] of entries) {
                                this.writeString(key);
                                this.serializeValue(val);
                            }
                        } else {
                            this.writeType(TYPE.OBJECT);
                            this.writeVarUint(entries.length);
                            for (const [key, val] of entries) {
                                this.writeString(String(key));
                                this.serializeValue(val);
                            }
                        }
                    }
                    break;

                default:
                    throw new Error(`Unsupported value type: ${typeof value}`);
            }
        } finally {
            this.currentDepth--;
        }
    }

    // public serialize method
    serialize<T>(data: T): Uint8Array {
        this.position = 0;
        this.currentDepth = 0;
        this.objectRefs.clear(); // reset object references
        this.nextRefId = 0;

        // write magic bytes and version
        for (const byte of MAGIC) {
            this.writeByte(byte);
        }

        // reserve space for checksum (4 bytes)
        const checksumPosition = this.position;
        this.position += 4;

        // mark the start of data for checksum calculation
        const dataStartPosition = this.position;

        // serialize the data
        this.serializeValue(data);

        // calculate checksum on the serialized data
        const dataForChecksum = new Uint8Array(
            this.buffer.slice(dataStartPosition, this.position),
        );
        const checksum = crc32(dataForChecksum);

        // write checksum at the reserved position
        const currentPosition = this.position;
        this.position = checksumPosition;
        this.writeUint32(checksum);
        this.position = currentPosition;

        // return a copy of the used portion of the buffer
        return new Uint8Array(this.buffer.slice(0, this.position));
    }
}

export class BinaryDeserializer {
    private buffer: ArrayBufferLike;
    private dataView: DataView;
    private uint8View: Uint8Array;
    private textDecoder: TextDecoder;
    private position: number;
    private maxDepth: number;
    private currentDepth: number;
    private objectRefs: Map<number, object>; // track deserialized objects by reference ID

    constructor(buffer: ArrayBufferLike, maxDepth = 100) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.uint8View = new Uint8Array(buffer);
        this.textDecoder = new TextDecoder("utf-8");
        this.position = 0;
        this.maxDepth = maxDepth;
        this.currentDepth = 0;
        this.objectRefs = new Map();
    }

    // read a single byte
    private readByte(): number {
        if (this.position >= this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading");
        }
        return this.dataView.getUint8(this.position++);
    }

    // read type tag
    private readType(): number {
        return this.readByte();
    }

    // read variable-length integer (LEB128 encoding)
    private readVarUint(): number {
        let result = 0;
        let shift = 0;
        let byte: number;

        do {
            if (this.position >= this.buffer.byteLength) {
                throw new Error("Buffer overflow while reading variable-length integer");
            }
            byte = this.readByte();
            result |= (byte & 0x7f) << shift;
            shift += 7;
            // prevent malicious input from causing infinite loop
            if (shift > 35) {
                throw new Error("Variable-length integer too large");
            }
        } while (byte & 0x80);

        return result;
    }

    // read fixed-size integers
    private readInt8(): number {
        if (this.position + 1 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Int8");
        }
        return this.dataView.getInt8(this.position++);
    }

    private readUint8(): number {
        if (this.position + 1 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Uint8");
        }
        return this.dataView.getUint8(this.position++);
    }

    private readInt16(): number {
        if (this.position + 2 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Int16");
        }
        const value = this.dataView.getInt16(this.position, true);
        this.position += 2;
        return value;
    }

    private readUint16(): number {
        if (this.position + 2 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Uint16");
        }
        const value = this.dataView.getUint16(this.position, true);
        this.position += 2;
        return value;
    }

    private readInt32(): number {
        if (this.position + 4 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Int32");
        }
        const value = this.dataView.getInt32(this.position, true);
        this.position += 4;
        return value;
    }

    private readUint32(): number {
        if (this.position + 4 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Uint32");
        }
        const value = this.dataView.getUint32(this.position, true);
        this.position += 4;
        return value;
    }

    private readFloat32(): number {
        if (this.position + 4 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Float32");
        }
        const value = this.dataView.getFloat32(this.position, true);
        this.position += 4;
        return value;
    }

    private readFloat64(): number {
        if (this.position + 8 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading Float64");
        }
        const value = this.dataView.getFloat64(this.position, true);
        this.position += 8;
        return value;
    }

    // read string with length prefix
    private readString(): string {
        const length = this.readVarUint();
        if (this.position + length > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading string");
        }
        const bytes = this.uint8View.subarray(this.position, this.position + length);
        this.position += length;
        return this.textDecoder.decode(bytes);
    }

    // read UUID as 16 bytes
    private readUuid(): string {
        if (this.position + 16 > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading UUID");
        }
        let uuid = "";
        for (let i = 0; i < 16; i++) {
            const byte = this.readByte();
            uuid += byte.toString(16).padStart(2, "0");
            // add dashes in the standard UUID format
            if (i === 3 || i === 5 || i === 7 || i === 9) {
                uuid += "-";
            }
        }
        return uuid;
    }

    // read binary data with length prefix
    private readBinary(): Uint8Array {
        const length = this.readVarUint();
        if (this.position + length > this.buffer.byteLength) {
            throw new Error("Buffer overflow while reading binary data");
        }
        const bytes = this.uint8View.slice(this.position, this.position + length);
        this.position += length;
        return bytes;
    }

    // read Date from timestamp
    private readDate(): Date {
        const timestamp = this.readFloat64();
        return new Date(timestamp);
    }

    // read a reference to a previously deserialized object
    private readReference(): any {
        const refId = this.readVarUint();
        if (!this.objectRefs.has(refId)) {
            throw new Error(`Reference to unknown object ID: ${refId}`);
        }
        return this.objectRefs.get(refId);
    }

    // register an object in the references map
    private registerObject(refId: number, obj: any): void {
        this.objectRefs.set(refId, obj);
    }

    // deserialize a value based on its type tag
    private deserializeValue(): any {
        // check depth to prevent stack overflow from malicious input
        this.currentDepth++;
        if (this.currentDepth > this.maxDepth) {
            this.currentDepth--;
            throw new Error(
                `Max deserialization depth (${this.maxDepth}) exceeded. Possible overly nested structure or malformed data.`,
            );
        }

        try {
            const type = this.readType();

            // handle reference type specially
            if (type === TYPE.REFERENCE) {
                return this.readReference();
            }

            let result: any;

            switch (type) {
                case TYPE.NULL:
                    return null;

                case TYPE.UNDEFINED:
                    return undefined;

                case TYPE.BOOLEAN:
                    return this.readByte() === 1;

                case TYPE.INT8:
                    return this.readInt8();

                case TYPE.UINT8:
                    return this.readUint8();

                case TYPE.INT16:
                    return this.readInt16();

                case TYPE.UINT16:
                    return this.readUint16();

                case TYPE.INT32:
                    return this.readInt32();

                case TYPE.UINT32:
                    return this.readUint32();

                case TYPE.FLOAT32:
                    return this.readFloat32();

                case TYPE.FLOAT64:
                    return this.readFloat64();

                case TYPE.STRING:
                    return this.readString();

                case TYPE.UUID:
                    return this.readUuid();

                case TYPE.DATE:
                    result = this.readDate();
                    break;

                case TYPE.BINARY:
                    result = this.readBinary();
                    break;

                case TYPE.ARRAY: {
                    const length = this.readVarUint();

                    // create empty array and register it before filling
                    result = [];
                    // use the next object reference number
                    const refId = this.objectRefs.size;
                    this.registerObject(refId, result);

                    // then fill the array
                    for (let i = 0; i < length; i++) {
                        result.push(this.deserializeValue());
                    }
                    break;
                }

                case TYPE.OBJECT:
                case TYPE.MAP: {
                    // create empty object and register it before filling
                    result = {};
                    // use the next object reference number
                    const refId = this.objectRefs.size;
                    this.registerObject(refId, result);

                    const propertyCount = this.readVarUint();
                    for (let i = 0; i < propertyCount; i++) {
                        const key = this.readString();
                        result[key] = this.deserializeValue();
                    }
                    break;
                }

                default:
                    throw new Error(`Unsupported type tag: ${type}`);
            }

            return result;
        } finally {
            this.currentDepth--;
        }
    }

    // public deserialize method
    deserialize<F extends (data: unknown) => unknown>(
        parseFn?: F,
    ): F extends (x: unknown) => infer R ? R : unknown {
        this.currentDepth = 0;
        this.objectRefs.clear(); // reset object references

        try {
            // validate magic bytes and version
            for (let i = 0; i < MAGIC.length; i++) {
                if (this.readByte() !== MAGIC[i]) {
                    throw new Error("Invalid binary format or version");
                }
            }

            // read the checksum
            if (this.position + 4 > this.buffer.byteLength) {
                throw new Error("Buffer overflow while reading checksum");
            }
            const storedChecksum = this.readUint32();

            // mark data start position for checksum verification
            const dataStartPosition = this.position;

            // save current position to restore later
            const startPosition = this.position;

            // first, read the data to calculate checksum without advancing position permanently
            try {
                // create a copy of the data portion for checksum calculation
                const dataForChecksum = new Uint8Array(
                    this.buffer.slice(dataStartPosition),
                );

                // calculate checksum
                const calculatedChecksum = crc32(dataForChecksum);

                // verify checksum
                if (calculatedChecksum !== storedChecksum) {
                    throw new Error(
                        "Checksum verification failed. Data may be corrupted or tampered with.",
                    );
                }
            } catch (error) {
                // if error occurs during verification (not including checksum mismatch),
                // make sure it's not misreported as a checksum error
                if (
                    error instanceof Error &&
                    !error.message.includes("Checksum verification failed")
                ) {
                    throw new Error(
                        `Error during checksum calculation: ${error.message}`,
                    );
                }
                throw error;
            }

            // restore position to start of data
            this.position = startPosition;

            // deserialize the actual data
            const result = this.deserializeValue();

            // parse if function provided
            if (parseFn) {
                return parseFn(result) as never;
            }

            return result;
        } catch (error) {
            // add context to deserialization errors
            if (error instanceof Error) {
                throw new Error(`Deserialization error: ${error.message}`);
            }
            throw error;
        }
    }
}

/**
 * Serializes data to binary format with circular reference support.
 * The data is validated against the schema if provided, but the
 * serialization format is independent of the schema.
 * @param data The data to serialize
 * @returns A Uint8Array containing the binary serialized data
 */
export function serialize<T>(data: T): Uint8Array {
    const serializer = new BinarySerializer();
    return serializer.serialize(data);
}

/**
 * Deserializes binary data with circular reference support.
 * If a zod schema is provided, the deserialized data is validated against it.
 * @param buffer The binary data to deserialize
 * @param schema Optional Zod schema for validation
 * @returns The deserialized data object, or unknown if no schema is provided
 */
export function deserialize<F extends (x: unknown) => unknown>(
    buffer: Uint8Array | ArrayBuffer,
    parseFn?: F,
): F extends (x: unknown) => infer R ? R : unknown {
    const arrayBuffer = buffer instanceof Uint8Array ? buffer.buffer : buffer;
    const deserializer = new BinaryDeserializer(arrayBuffer);
    return deserializer.deserialize(parseFn) as never;
}

import { Queue } from "../queue";

class _LogLevel<V extends number, N extends string> {
    public readonly value: V;
    public readonly name: N;

    constructor(value: V, name: N) {
        this.value = value;
        this.name = name;
    }

    toString() {
        return this.name;
    }

    valueOf() {
        return this.value;
    }
}

export const LogLevel = {
    Debug: new _LogLevel(0, "DEBUG"),
    Info: new _LogLevel(1, "INFO"),
    Warn: new _LogLevel(2, "WARN"),
    Error: new _LogLevel(3, "ERROR"),
    Fatal: new _LogLevel(4, "FATAL"),
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

type JSONValue =
    | string
    | number
    | boolean
    | null
    | Array<JSONValue>
    | { [key: string]: JSONValue };

export interface Metadata {
    [key: string]: JSONValue;
}

export type Timestamp =
    `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;
export type LogMessage = `${Timestamp} [${LogLevel["name"]}] ${string} ${string}`;

export function formatLogMessage(
    level: LogLevel,
    message: string,
    metadata: Metadata,
): LogMessage {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}] ${message} ${JSON.stringify(metadata)}` as LogMessage;
}

/**
 * sink interface for log output destinations
 */
export interface Sink {
    /**
     * write a log message to the sink
     */
    write(level: LogLevel, message: string, metadata: Metadata): void;
}

/**
 * console sink implementation that writes to stdout/stderr
 */
export class ConsoleSink implements Sink {
    write(level: LogLevel, message: string, metadata: Metadata): void {
        const formattedMessage = formatLogMessage(level, message, metadata);

        switch (level) {
            case LogLevel.Debug:
            case LogLevel.Info:
                console.log(formattedMessage);
                break;
            case LogLevel.Warn:
                console.warn(formattedMessage);
                break;
            case LogLevel.Error:
            case LogLevel.Fatal:
                console.error(formattedMessage);
                break;
        }
    }
}

/**
 * file sink implementation that writes to a file
 */
export class FileSink implements Sink {
    private filePath: string;
    private fs: typeof import("node:fs/promises") | null = null;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private async getFs() {
        if (this.fs === null) {
            this.fs = await import("node:fs/promises");
        }
        return this.fs;
    }

    write(level: LogLevel, message: string, metadata: Metadata): void {
        const formattedMessage = formatLogMessage(level, message, metadata);
        const logLine = `${formattedMessage}\n`;

        // append to file using node fs api which is supported by bun
        this.getFs().then((fs) => fs.appendFile(this.filePath, logLine));
    }
}

export interface ILogger<Sinks extends Sink[]> {
    sinks: Sinks;
    minLevel: LogLevel;
    queue: Queue<QueueItem>;

    log(level: LogLevel, message: string, metadata?: Metadata): void;
    debug(message: string, metadata?: Metadata): void;
    info(message: string, metadata?: Metadata): void;
    warn(message: string, metadata?: Metadata): void;
    error(message: string, metadata?: Metadata): void;
    fatal(message: string, metadata?: Metadata): void;
}

interface QueueItem {
    level: LogLevel;
    message: string;
    metadata: Metadata;
}

export class Logger<Sinks extends Sink[]> implements ILogger<Sinks> {
    sinks: Sinks;
    minLevel: LogLevel;
    queue: Queue<QueueItem>;

    constructor(sinks: Sinks, minLevel: LogLevel) {
        this.sinks = sinks;
        this.minLevel = minLevel;
        this.queue = new Queue();
        this.processQueue();
    }

    log(level: LogLevel, message: string, metadata: Metadata): void {
        // add to queue
        this.queue.enqueue({ level, message, metadata });
    }

    private async processQueue(): Promise<void> {
        while (true) {
            if (this.queue.size === 0) {
                await new Promise((resolve) => setTimeout(resolve, 1));
                continue;
            }

            // Process all items currently in the queue
            const currentSize = this.queue.size;
            for (let i = 0; i < currentSize; i++) {
                const item = this.queue.dequeue();
                if (item) {
                    // send log to each sink that accepts this level
                    for (const sink of this.sinks) {
                        if (this.shouldLog(item.level, this.minLevel)) {
                            sink.write(item.level, item.message, item.metadata);
                        }
                    }
                }
            }
        }
    }

    /**
     * determine if a log should be processed based on level comparison
     */
    private shouldLog(messageLevel: LogLevel, sinkMinLevel: LogLevel): boolean {
        return messageLevel.value >= sinkMinLevel.value;
    }

    debug(message: string, metadata?: Metadata): void {
        this.log(LogLevel.Debug, message, metadata ?? {});
    }

    info(message: string, metadata?: Metadata): void {
        this.log(LogLevel.Info, message, metadata ?? {});
    }

    warn(message: string, metadata?: Metadata): void {
        this.log(LogLevel.Warn, message, metadata ?? {});
    }

    error(message: string, metadata?: Metadata): void {
        this.log(LogLevel.Error, message, metadata ?? {});
    }

    fatal(message: string, metadata?: Metadata): void {
        this.log(LogLevel.Fatal, message, metadata ?? {});
    }

    async wait<T>(fn: () => T): Promise<Awaited<T>> {
        // wait for the queue to be empty
        while (this.queue.size > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1));
        }
        return await fn();
    }
}

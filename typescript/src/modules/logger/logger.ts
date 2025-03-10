import { Queue } from "../queue";
import * as Mutex from "../mutex/mutex";

export const LogLevel = {
    Debug: { name: "DEBUG", value: 0 },
    Info: { name: "INFO", value: 1 },
    Warn: { name: "WARN", value: 2 },
    Error: { name: "ERROR", value: 3 },
    Fatal: { name: "FATAL", value: 4 },
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
    timestamp?: Timestamp,
): LogMessage {
    return `${timestamp ?? new Date().toISOString()} [${level.name}] ${message} ${JSON.stringify(metadata)}` as LogMessage;
}

/**
 * sink interface for log output destinations
 */
export interface Sink {
    id: string;
    /**
     * write a log message to the sink
     */
    write(level: LogLevel, message: string, metadata: Metadata): void;
}

/**
 * console sink implementation that writes to stdout/stderr
 */
export class ConsoleSink implements Sink {
    public static type = "console" as const;
    public id: string;

    constructor(id?: string) {
        this.id = id ?? "console";
    }

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
    public static type = "file" as const;
    public id: string;
    private filePath: string;
    private fs: typeof import("node:fs/promises") | null = null;

    constructor(filePath: string, id?: string) {
        this.id = id ?? "file";
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

export class WorkerSink implements Sink {
    public static type = "worker" as const;
    public id: string;
    private workerPool: Worker[];
    private currentWorkerIndex: number;
    constructor(workerUrl: string | URL, numWorkers: number, id?: string) {
        this.id = id ?? "worker";
        this.workerPool = Array(numWorkers)
            .fill(null)
            .map(() => new Worker(workerUrl));
        this.currentWorkerIndex = 0;
    }

    write(level: LogLevel, message: string, metadata: Metadata): void {
        // send log to worker
        this.getNextWorker().postMessage({ level, message, metadata });
    }

    private getNextWorker(): Worker {
        const worker = this.workerPool[this.currentWorkerIndex]!;
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workerPool.length;
        return worker;
    }

    public onmessage<T, R>(fn: (this: Worker, ev: MessageEvent<T>) => R) {
        for (const worker of this.workerPool) {
            worker.onmessage = fn;
        }
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

export class Logger<const Sinks extends Sink[]> implements ILogger<Sinks> {
    readonly sinks: Sinks;
    readonly minLevel: LogLevel;
    readonly queue: Queue<QueueItem>;
    private processingMutex: Mutex.Instance;

    constructor(sinks: Sinks, minLevel: LogLevel) {
        this.sinks = sinks;
        this.minLevel = minLevel;
        this.queue = new Queue();
        this.processingMutex = Mutex.create();
        this.triggerProcessing();
    }

    log(level: LogLevel, message: string, metadata: Metadata): void {
        // add to queue
        this.queue.enqueue({ level, message, metadata });
        this.triggerProcessing();
    }

    private triggerProcessing(): void {
        // Only start processing if:
        // 1. The mutex is not locked (no processing is happening)
        // 2. There are items in the queue
        if (!Mutex.isLocked(this.processingMutex) && this.queue.size > 0) {
            const release = Mutex.acquire(this.processingMutex);
            queueMicrotask(this.processQueue.bind(this));
            release(this.processingMutex);
        }
    }

    private async processQueue(): Promise<void> {
        // Acquire the mutex to indicate processing is active
        const release = Mutex.acquire(this.processingMutex);
        // Process all items in the queue
        while (!this.queue.isEmpty()) {
            const item = this.queue.dequeue();
            // Process the item
            for (const sink of this.sinks) {
                if (this.shouldLog(item.level, this.minLevel)) {
                    sink.write(item.level, item.message, item.metadata);
                }
            }
        }
        release(this.processingMutex);
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
        // Wait for the queue to be empty and processing to complete
        while (this.queue.size > 0 || Mutex.isLocked(this.processingMutex)) {
            await new Promise((resolve) => setTimeout(resolve, 1));
        }
        return await fn();
    }
}

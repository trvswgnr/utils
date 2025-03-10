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
 * interface for log output destinations
 */
export interface Sink {
    id: string;
    /**
     * write a log message to the sink
     */
    write(level: LogLevel, message: string, metadata: Metadata): void;
}

/**
 * writes logs to stdout/stderr based on log level
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

interface LogRotationOptions {
    /**
     * the frequency of log rotation
     * - "daily" - rotate daily
     * - "weekly" - rotate weekly
     * - "monthly" - rotate monthly
     * - number - size in bytes
     */
    frequency: "daily" | "weekly" | "monthly" | number;
    /**
     * the number of log files to keep before deleting the oldest ones
     */
    maxBackups: number;
    /**
     * post-rotation actions
     */
    postRotationActions: (() => void)[];
}

interface FileSinkOptions {
    filePath: string;
    rotationOptions?: LogRotationOptions;
    id?: string;
}

/**
 * persists logs to a file system location
 */
export class FileSink implements Sink {
    public static type = "file" as const;
    public id: string;
    private filePath: string;
    private rotationOptions: LogRotationOptions;
    private static fs: typeof import("node:fs/promises") | null = null;
    private static path: typeof import("node:path") | null = null;
    private static encoder: TextEncoder | null = null;
    private lastRotationCheck = 0;
    private static ROTATION_CHECK_INTERVAL_MS = 60000; // check once per minute

    constructor(options: FileSinkOptions) {
        this.id = options.id ?? "file";
        this.filePath = options.filePath;
        this.rotationOptions = {
            frequency: "daily",
            maxBackups: 7,
            postRotationActions: [],
            ...(options.rotationOptions ?? {}),
        };
    }
    private static async getDeps() {
        if (FileSink.fs === null) {
            FileSink.fs = await import("node:fs/promises");
        }
        if (FileSink.path === null) {
            FileSink.path = await import("node:path");
        }
        if (FileSink.encoder === null) {
            FileSink.encoder = new TextEncoder();
        }
        return { fs: FileSink.fs, path: FileSink.path, encoder: FileSink.encoder };
    }

    write(level: LogLevel, message: string, metadata: Metadata): void {
        const formattedMessage = formatLogMessage(level, message, metadata);
        const logLine = `${formattedMessage}\n`;

        type FileHandle = Awaited<ReturnType<typeof import("node:fs/promises")["open"]>>;
        let fileHandle: FileHandle | null = null;
        // lazy-load deps to improve startup time when not used
        FileSink.getDeps()
            .then(async ({ fs, path, encoder }) => {
                const filename = path.basename(this.filePath);
                const dirname = path.dirname(this.filePath);
                // create the directory if it doesn't exist
                await fs.mkdir(dirname, { recursive: true });
                const fullPath = path.join(dirname, filename);

                // check if rotation is needed
                await this.checkRotation(fullPath, fs, path);

                // open the file for appending
                fileHandle = await fs.open(fullPath, "a");
                // write the log line to the file
                await fileHandle.write(encoder.encode(logLine));
            })
            .finally(async () => {
                // close the file stream
                await fileHandle?.close();
            });
    }

    /**
     * checks if log rotation is needed based on configured frequency
     */
    private async checkRotation(
        fullPath: string,
        fs: typeof import("node:fs/promises"),
        path: typeof import("node:path"),
    ): Promise<void> {
        const now = Date.now();

        // throttle rotation checks to avoid excessive file stats
        if (now - this.lastRotationCheck < FileSink.ROTATION_CHECK_INTERVAL_MS) {
            return;
        }

        this.lastRotationCheck = now;

        // check if file exists before attempting rotation
        const stats = await fs.stat(fullPath).catch(() => null);
        if (!stats) return;

        const shouldRotate = await this.shouldRotate(stats, fullPath, fs);
        if (shouldRotate) {
            await this.rotateLog(fullPath, fs, path);
        }
    }

    /**
     * determines if rotation is needed based on time or size
     */
    private async shouldRotate(
        stats: Awaited<ReturnType<typeof import("node:fs/promises")["stat"]>>,
        fullPath: string,
        fs: typeof import("node:fs/promises"),
    ): Promise<boolean> {
        const { frequency } = this.rotationOptions;

        // size-based rotation
        if (typeof frequency === "number") {
            return stats.size >= frequency;
        }

        // time-based rotation
        try {
            // check for rotation marker file
            const markerPath = `${fullPath}.rotation_marker`;
            const marker = await fs.readFile(markerPath, "utf-8").catch(() => "");
            const lastRotation = marker ? new Date(marker) : new Date(0);
            const now = new Date();

            switch (frequency) {
                case "daily":
                    return (
                        now.getDate() !== lastRotation.getDate() ||
                        now.getMonth() !== lastRotation.getMonth() ||
                        now.getFullYear() !== lastRotation.getFullYear()
                    );
                case "weekly": {
                    // get the week number - wrapped in block to fix linter error
                    const getWeekNumber = (d: Date) => {
                        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
                        const pastDaysOfYear =
                            (d.getTime() - firstDayOfYear.getTime()) / 86400000;
                        return Math.ceil(
                            (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
                        );
                    };
                    return (
                        getWeekNumber(now) !== getWeekNumber(lastRotation) ||
                        now.getFullYear() !== lastRotation.getFullYear()
                    );
                }
                case "monthly":
                    return (
                        now.getMonth() !== lastRotation.getMonth() ||
                        now.getFullYear() !== lastRotation.getFullYear()
                    );
                default:
                    return false;
            }
        } catch (error) {
            // if we can't determine rotation time, default to rotating
            return true;
        }
    }

    /**
     * performs log rotation by renaming current log file and creating a new one
     */
    private async rotateLog(
        fullPath: string,
        fs: typeof import("node:fs/promises"),
        path: typeof import("node:path"),
    ): Promise<void> {
        const { maxBackups, postRotationActions } = this.rotationOptions;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dirname = path.dirname(fullPath);
        const basename = path.basename(fullPath);
        const rotatedFilename = `${basename}.${timestamp}`;
        const rotatedPath = path.join(dirname, rotatedFilename);

        try {
            // rename current log file with timestamp
            await fs.rename(fullPath, rotatedPath);

            // update rotation marker
            const markerPath = `${fullPath}.rotation_marker`;
            await fs.writeFile(markerPath, new Date().toISOString());

            // clean up old backups
            await this.cleanupOldBackups(dirname, basename, fs, path, maxBackups);

            // execute post-rotation actions
            for (const action of postRotationActions) {
                try {
                    action();
                } catch (error) {
                    // silently handle action errors to avoid disrupting logging
                }
            }
        } catch (error) {
            // silently handle rotation errors to avoid disrupting logging
        }
    }

    /**
     * removes old backup files when they exceed maxBackups
     */
    private async cleanupOldBackups(
        dirname: string,
        basename: string,
        fs: typeof import("node:fs/promises"),
        path: typeof import("node:path"),
        maxBackups: number,
    ): Promise<void> {
        try {
            // list all files in directory
            const files = await fs.readdir(dirname);

            // filter to find backup files matching our pattern
            const backupRegex = new RegExp(`^${basename}\\..*`);
            const backupFiles = files
                .filter((file) => backupRegex.test(file))
                .map((file) => ({
                    name: file,
                    path: path.join(dirname, file),
                    // extract timestamp from filename for sorting
                    timestamp: file.replace(`${basename}.`, ""),
                }))
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // newest first

            // delete files beyond the maxBackups limit
            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                for (const file of filesToDelete) {
                    await fs.unlink(file.path).catch(() => {});
                }
            }
        } catch (error) {
            // silently handle cleanup errors to avoid disrupting logging
        }
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
        // distribute log processing across worker pool for better throughput
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
        // queue logs to prevent blocking the main thread
        this.queue.enqueue({ level, message, metadata });
        this.triggerProcessing();
    }

    private triggerProcessing(): void {
        // only start processing when no active processing exists and queue has items
        // this prevents redundant processing attempts
        if (!Mutex.isLocked(this.processingMutex) && this.queue.size > 0) {
            const release = Mutex.acquire(this.processingMutex);
            queueMicrotask(this.processQueue.bind(this));
            release(this.processingMutex);
        }
    }

    private async processQueue(): Promise<void> {
        // mutex prevents concurrent queue processing which could lead to race conditions
        const release = Mutex.acquire(this.processingMutex);

        while (!this.queue.isEmpty()) {
            const item = this.queue.dequeue();

            for (const sink of this.sinks) {
                if (this.shouldLog(item.level, this.minLevel)) {
                    sink.write(item.level, item.message, item.metadata);
                }
            }
        }
        release(this.processingMutex);
    }

    /**
     * filters logs below configured threshold to reduce noise
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

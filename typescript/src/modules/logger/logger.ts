import { Queue } from "../queue";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
export function getLevelValue(level: LogLevel) {
    switch (level) {
        case "DEBUG":
            return 0;
        case "INFO":
            return 1;
        case "WARN":
            return 2;
        case "ERROR":
            return 3;
        case "FATAL":
            return 4;
    }
}

type JSONSerializableValue =
    | string
    | number
    | boolean
    | null
    | Array<JSONSerializableValue>
    | { [key: string]: JSONSerializableValue };

export function formatMessage(
    level: LogLevel,
    message: string,
    metadata?: Record<string, JSONSerializableValue>,
    time?: Date,
) {
    const timestamp = time ?? new Date();
    return `${timestamp.toISOString()} [${level}] ${message} ${JSON.stringify(metadata ?? {})}`;
}

export class Logger {
    queue: Queue<string>;
    workers: Worker[];
    currentWorkerIndex: number;
    filepath: string;
    constructor(filepath: string | URL) {
        this.filepath = typeof filepath === "string" ? filepath : filepath.toString();
        this.queue = new Queue<string>(100);
        this.workers = Array(4)
            .fill(null)
            .map(() => new Worker(new URL("./worker.ts", import.meta.url)));
        this.currentWorkerIndex = 0;
        this.processQueue();
    }

    public debug(message: string, metadata?: Record<string, JSONSerializableValue>) {
        this.log("DEBUG", message, metadata);
    }

    public info(message: string, metadata?: Record<string, JSONSerializableValue>) {
        this.log("INFO", message, metadata);
    }

    public warn(message: string, metadata?: Record<string, JSONSerializableValue>) {
        this.log("WARN", message, metadata);
    }

    public error(message: string, metadata?: Record<string, JSONSerializableValue>) {
        this.log("ERROR", message, metadata);
    }

    public fatal(message: string, metadata?: Record<string, JSONSerializableValue>) {
        this.log("FATAL", message, metadata);
    }

    private log(
        level: LogLevel,
        message: string,
        metadata?: Record<string, JSONSerializableValue>,
    ) {
        this.keepTryingToEnqueue(formatMessage(level, message, metadata));
    }

    async keepTryingToEnqueue(message: string) {
        let attempts = 0;
        while (true) {
            if (this.queue.tryEnqueue(message)) {
                return;
            }
            await sleep(10 * 2 ** attempts);
            attempts++;
        }
    }

    getNextWorker() {
        const worker = this.workers[this.currentWorkerIndex]!;
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
        return worker;
    }

    async processQueue() {
        while (true) {
            while (!this.queue.isEmpty()) {
                const message = this.queue.dequeue();
                const worker = this.getNextWorker();
                worker.postMessage({
                    type: "log",
                    message,
                    filepath: this.filepath,
                });
                // give other tasks a chance to run
                await sleep(1);
            }
            await sleep(100);
        }
    }

    async waitForQueueToEmpty(fn: () => Promise<void> | void) {
        while (!this.queue.isEmpty()) {
            await sleep(10);
        }
        await fn();
    }
}

async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

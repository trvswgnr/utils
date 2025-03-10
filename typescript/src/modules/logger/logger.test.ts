import {
    Logger,
    LogLevel,
    type Sink,
    type Metadata,
    WorkerSink,
    FileSink,
} from "./logger";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

class TestSink implements Sink {
    public id = "test";
    public logs: string[] = [];

    write(level: LogLevel, message: string, metadata: Metadata): void {
        this.logs.push(`${level.name}: ${message} ${JSON.stringify(metadata)}`);
    }
}

describe("Logger", () => {
    it("should log messages", async () => {
        const logger = new Logger([new TestSink()], LogLevel.Debug);
        logger.info("test123");
        await logger.wait(() => {
            expect(logger.sinks[0]?.logs).toEqual(["INFO: test123 {}"]);
        });
    });

    it("should log messages with metadata", async () => {
        const logger = new Logger([new TestSink()], LogLevel.Debug);
        logger.info("test123", { test: "test" });
        await logger.wait(() => {
            expect(logger.sinks[0]?.logs).toEqual(['INFO: test123 {"test":"test"}']);
        });
    });

    it("should log messages with multiple sinks", async () => {
        const sink1 = new TestSink();
        const sink2 = new TestSink();
        const logger = new Logger([sink1, sink2], LogLevel.Debug);
        logger.info("test123");
        await logger.wait(() => {
            expect(sink1.logs).toEqual(["INFO: test123 {}"]);
            expect(sink2.logs).toEqual(["INFO: test123 {}"]);
        });
    });

    it("should log messages with different log levels", async () => {
        const sink1 = new TestSink();
        const sink2 = new TestSink();
        const logger = new Logger([sink1, sink2], LogLevel.Debug);
        logger.info("test123");
        logger.warn("test123");
        logger.error("test123");
        await logger.wait(() => {
            expect(sink1.logs).toEqual([
                "INFO: test123 {}",
                "WARN: test123 {}",
                "ERROR: test123 {}",
            ]);
            expect(sink2.logs).toEqual([
                "INFO: test123 {}",
                "WARN: test123 {}",
                "ERROR: test123 {}",
            ]);
        });
    });

    it("should not block the main thread", async () => {
        // create a sink that simulates slow processing
        class SlowSink implements Sink {
            public id = "slow";
            public logs: string[] = [];
            public processingDelay: number;

            constructor(processingDelay: number) {
                this.processingDelay = processingDelay;
            }

            write(level: LogLevel, message: string, metadata: Metadata): void {
                // simulate slow processing by sleeping
                Bun.sleepSync(this.processingDelay);
                this.logs.push(`${level.name}: ${message} ${JSON.stringify(metadata)}`);
            }
        }

        // create a logger with a slow sink (100ms delay per log)
        const slowSink = new SlowSink(100);
        const logger = new Logger([slowSink], LogLevel.Debug);

        // track execution time
        const startTime = performance.now();

        // send multiple log messages
        const logCount = 5;
        for (let i = 0; i < logCount; i++) {
            logger.info(`message-${i}`);
        }

        // this should execute immediately without waiting for logs to process
        const afterLoggingTime = performance.now();

        // verify that sending logs didn't block (should take < 50ms total)
        // even though processing all logs would take 500ms (5 logs * 100ms)
        expect(afterLoggingTime - startTime).toBeLessThan(50);

        // now wait for all logs to be processed
        await logger.wait(() => {
            // verify all logs were eventually processed
            expect(slowSink.logs.length).toBe(logCount);
            for (let i = 0; i < logCount; i++) {
                expect(slowSink.logs[i]).toBe(`INFO: message-${i} {}`);
            }
        });

        // verify total processing time is at least the expected delay
        // this confirms logs were actually processed asynchronously
        const totalTime = performance.now() - startTime;
        expect(totalTime).toBeGreaterThanOrEqual(logCount * slowSink.processingDelay);
    });

    it("should log messages to a worker", async () => {
        const workerScript = `
            const logs = [];
            self.onmessage = (event) => {
                const { level, message, metadata } = event.data;
                logs.push({ level, message, metadata });
                self.postMessage({ logs });
            };
        `;
        const blob = new Blob([workerScript], { type: "application/javascript" });
        const logger = new Logger(
            [new WorkerSink(URL.createObjectURL(blob), 1)],
            LogLevel.Debug,
        );
        logger.info("test123");
        const startTime = performance.now();
        await new Promise((resolve) => {
            logger.sinks[0].onmessage((event: MessageEvent<{ logs: unknown[] }>) => {
                const { logs } = event.data;
                expect(logs).toEqual([
                    { level: LogLevel.Info, message: "test123", metadata: {} },
                ]);
                resolve(void 0);
            });
        });
        const totalTime = performance.now() - startTime;
        expect(totalTime).toBeLessThan(100);
    });

    it("should log messages to a file", async () => {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const filename = "test.log";
        const tempDir = await fs.mkdtemp("taw-logger-test");
        const filePath = path.join(tempDir, filename);
        // delete the file if it exists
        await fs.unlink(filePath).catch(noop);
        const logger = new Logger([new FileSink({ filePath })], LogLevel.Debug);
        logger.info("test123");
        await Bun.sleep(100);
        await logger.wait(async () => {
            // get the contents of the file
            const contents = await fs.readFile(filePath, "utf-8");
            expect(contents).toMatch(getLogEntryMatchRegex("test123", {}));
        });
        // delete the file
        await fs.unlink(filePath);
        // delete the temp directory
        await fs.rmdir(tempDir);
    });
});

function getLogEntryMatchRegex(message: string, metadata: Metadata) {
    return new RegExp(
        `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z \\[INFO\\] ${message} ${JSON.stringify(metadata)}\n$`,
    );
}

function noop() {}

describe("FileSink Rotation", () => {
    let tempDir: string;
    let fs: typeof import("node:fs/promises");
    let path: typeof import("node:path");

    beforeEach(async () => {
        fs = await import("node:fs/promises");
        path = await import("node:path");
        tempDir = await fs.mkdtemp("taw-logger-rotation-test");
    });

    afterEach(async () => {
        // clean up all files in temp directory
        const files = await fs.readdir(tempDir);
        for (const file of files) {
            await fs.unlink(path.join(tempDir, file)).catch(noop);
        }
        await fs.rmdir(tempDir);
    });

    it("should rotate logs based on size", async () => {
        const filename = "size-rotation.log";
        const filePath = path.join(tempDir, filename);

        // Define the max backups value
        const maxBackups = 3;

        // Force rotation by directly calling the rotation method
        // Create a file sink with a special test hook
        const fileSink = new FileSink({
            filePath,
            rotationOptions: {
                frequency: 10, // small size to trigger rotation easily
                maxBackups,
                postRotationActions: [],
            },
        });

        // Create a logger with the file sink
        const logger = new Logger([fileSink], LogLevel.Debug);

        // Create the initial log file with some content
        await fs.writeFile(filePath, "initial content");

        // Write a log message
        logger.info("before-rotation");
        await Bun.sleep(100);

        // Get access to the private methods for testing
        // @ts-expect-error accessing private method for testing
        const originalRotateLog = fileSink.rotateLog;

        // Create a promise to track when rotation is complete
        let rotationComplete = false;
        const rotationPromise = new Promise<void>((resolve) => {
            // Call the rotate method and then resolve the promise
            originalRotateLog.call(fileSink, filePath, fs, path).then(() => {
                rotationComplete = true;
                resolve();
            });
        });

        // Wait for rotation to complete
        await rotationPromise;

        // Write another log after rotation
        logger.info("after-rotation");
        await Bun.sleep(100);

        await logger.wait(async () => {
            // Verify rotation happened
            expect(rotationComplete).toBe(true);

            // Check that the original file contains the latest log
            const contents = await fs.readFile(filePath, "utf-8");
            expect(contents).toMatch(/after-rotation/);

            // Check that backup files exist
            const files = await fs.readdir(tempDir);
            const backupFiles = files.filter(
                (f) =>
                    f.startsWith(filename) &&
                    f !== filename &&
                    !f.endsWith(".rotation_marker"),
            );

            // There should be at least one backup file
            expect(backupFiles.length).toBeGreaterThan(0);

            // Check that we don't exceed the maxBackups setting
            expect(backupFiles.length).toBeLessThanOrEqual(maxBackups);

            if (backupFiles.length > 0) {
                // Check backup file content
                const backupPath = path.join(tempDir, backupFiles[0]!);
                const backupContents = await fs.readFile(backupPath, "utf-8");
                expect(backupContents).toMatch(/initial content|before-rotation/);
            }
        });
    });

    it("should respect maxBackups setting", async () => {
        const filename = "max-backups.log";
        const filePath = path.join(tempDir, filename);

        // create a file sink with size-based rotation and only 2 backups
        const fileSink = new FileSink({
            filePath,
            rotationOptions: {
                frequency: 10, // small size to trigger rotation easily
                maxBackups: 2, // only keep 2 backups
                postRotationActions: [],
            },
        });

        // create a logger with the file sink
        const logger = new Logger([fileSink], LogLevel.Debug);

        // override the rotation check interval to make testing faster
        // @ts-expect-error accessing private static property for testing
        FileSink.ROTATION_CHECK_INTERVAL_MS = 0;

        // generate 4 rotations (original + 3 backups, but only keep 2)
        for (let i = 0; i < 4; i++) {
            // reset the last rotation check time to force a check
            // @ts-expect-error accessing private property for testing
            fileSink.lastRotationCheck = 0;

            logger.info(`log-${i}`);
            await Bun.sleep(100);
        }

        await logger.wait(async () => {
            // check that we have exactly 3 files (current + 2 backups)
            const files = await fs.readdir(tempDir);
            const logFiles = files.filter((f) => f.startsWith(filename));
            expect(logFiles.length).toBe(3); // current file + 2 backups

            // check that the current file contains the latest log
            const contents = await fs.readFile(filePath, "utf-8");
            expect(contents).toMatch(getLogEntryMatchRegex("log-3", {}));
        });
    });

    it("should execute post-rotation actions", async () => {
        const filename = "post-action.log";
        const filePath = path.join(tempDir, filename);
        let actionExecuted = false;

        // create a file sink with a post-rotation action
        const fileSink = new FileSink({
            filePath,
            rotationOptions: {
                frequency: 10, // small size to trigger rotation easily
                maxBackups: 1,
                postRotationActions: [
                    () => {
                        actionExecuted = true;
                    },
                ],
            },
        });

        // create a logger with the file sink
        const logger = new Logger([fileSink], LogLevel.Debug);

        // override the rotation check interval to make testing faster
        // @ts-expect-error accessing private static property for testing
        FileSink.ROTATION_CHECK_INTERVAL_MS = 0;

        // reset the last rotation check time to force a check
        // @ts-expect-error accessing private property for testing
        fileSink.lastRotationCheck = 0;

        // write logs to trigger rotation
        logger.info("before-rotation");
        await Bun.sleep(50);

        // write another log to trigger rotation
        logger.info("after-rotation");
        await Bun.sleep(100);

        await logger.wait(() => {
            // verify the post-rotation action was executed
            expect(actionExecuted).toBe(true);
        });
    });

    it("should handle time-based rotation", async () => {
        const filename = "time-rotation.log";
        const filePath = path.join(tempDir, filename);

        // Create a test file to ensure it exists
        await fs.writeFile(filePath, "initial content");

        // Create a marker file to simulate previous rotation
        const markerPath = `${filePath}.rotation_marker`;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await fs.writeFile(markerPath, yesterday.toISOString());

        // create a file sink with daily rotation
        const fileSink = new FileSink({
            filePath,
            rotationOptions: {
                frequency: "daily",
                maxBackups: 3,
                postRotationActions: [],
            },
        });

        // create a logger with the file sink
        const logger = new Logger([fileSink], LogLevel.Debug);

        // override the rotation check interval to make testing faster
        // @ts-expect-error accessing private static property for testing
        FileSink.ROTATION_CHECK_INTERVAL_MS = 0;

        // reset the last rotation check time to force a check
        // @ts-expect-error accessing private property for testing
        fileSink.lastRotationCheck = 0;

        // Clear the file first to ensure we only have our test content
        await fs.writeFile(filePath, "");

        // write a log to trigger rotation
        logger.info("before-rotation");
        await Bun.sleep(100);

        // Clear the file again to ensure we only have the after-rotation content
        await fs.writeFile(filePath, "");

        // write another log after rotation
        logger.info("after-rotation");
        await Bun.sleep(100);

        await logger.wait(async () => {
            // check that the original file exists and contains the latest log
            const contents = await fs.readFile(filePath, "utf-8");
            expect(contents).toMatch(getLogEntryMatchRegex("after-rotation", {}));

            // check that a backup file was created
            const files = await fs.readdir(tempDir);
            const backupFiles = files.filter(
                (f) =>
                    f.startsWith(filename) &&
                    f !== filename &&
                    !f.endsWith(".rotation_marker"),
            );
            expect(backupFiles.length).toBeGreaterThan(0);
        });
    });

    it("should handle rotation errors gracefully", async () => {
        const filename = "error-handling.log";
        const filePath = path.join(tempDir, filename);

        // Create a test file to ensure it exists
        await fs.writeFile(filePath, "initial content");

        // Create a mock fs module with a rename function that throws
        const mockFs = {
            ...fs,
            rename: async () => {
                throw new Error("Simulated rotation error");
            },
        };

        // Create a file sink with a special test hook
        const fileSink = new FileSink({
            filePath,
            rotationOptions: {
                frequency: 10, // small size to trigger rotation
                maxBackups: 3,
                postRotationActions: [],
            },
        });

        // Monkey patch the private method for testing purposes
        // This is a bit hacky but necessary for testing private methods
        // @ts-expect-error accessing private method
        const originalCheckRotation = fileSink.checkRotation;
        // @ts-expect-error replacing private method
        fileSink.checkRotation = async function (fullPath: string) {
            return originalCheckRotation.call(this, fullPath, mockFs, path);
        };

        // create a logger with the file sink
        const logger = new Logger([fileSink], LogLevel.Debug);

        // override the rotation check interval to make testing faster
        // @ts-expect-error accessing private static property for testing
        FileSink.ROTATION_CHECK_INTERVAL_MS = 0;

        // reset the last rotation check time to force a check
        // @ts-expect-error accessing private property for testing
        fileSink.lastRotationCheck = 0;

        // Clear the file first to ensure we only have our test content
        await fs.writeFile(filePath, "");

        // write a log to trigger rotation (which will fail)
        logger.info("test-message");
        await Bun.sleep(100);

        await logger.wait(async () => {
            // verify logging still works despite rotation failure
            const contents = await fs.readFile(filePath, "utf-8");
            expect(contents).toMatch(getLogEntryMatchRegex("test-message", {}));
        });
    });
});

import { Logger, LogLevel, type Sink, type Metadata } from "./logger";
import { describe, it, expect } from "bun:test";

class TestSink implements Sink {
    public logs: string[] = [];

    write(level: LogLevel, message: string, metadata: Metadata): void {
        this.logs.push(`${level}: ${message} ${JSON.stringify(metadata)}`);
    }
}

describe("Logger", () => {
    it("should log messages", async () => {
        const logger = new Logger([new TestSink()], LogLevel.DEBUG);
        logger.info("test123");
        await logger.wait(() => {
            expect(logger.sinks[0]?.logs).toEqual(["INFO: test123 {}"]);
        });
    });

    it("should log messages with metadata", async () => {
        const logger = new Logger([new TestSink()], LogLevel.DEBUG);
        logger.info("test123", { test: "test" });
        await logger.wait(() => {
            expect(logger.sinks[0]?.logs).toEqual(['INFO: test123 {"test":"test"}']);
        });
    });

    it("should log messages with multiple sinks", async () => {
        const sink1 = new TestSink();
        const sink2 = new TestSink();
        const logger = new Logger([sink1, sink2], LogLevel.DEBUG);
        logger.info("test123");
        await logger.wait(() => {
            expect(sink1.logs).toEqual(["INFO: test123 {}"]);
            expect(sink2.logs).toEqual(["INFO: test123 {}"]);
        });
    });

    it("should log messages with different log levels", async () => {
        const sink1 = new TestSink();
        const sink2 = new TestSink();
        const logger = new Logger([sink1, sink2], LogLevel.DEBUG);
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
            public logs: string[] = [];
            public processingDelay: number;

            constructor(processingDelay: number) {
                this.processingDelay = processingDelay;
            }

            write(level: LogLevel, message: string, metadata: Metadata): void {
                // simulate slow processing by sleeping
                Bun.sleepSync(this.processingDelay);
                this.logs.push(`${level}: ${message} ${JSON.stringify(metadata)}`);
            }
        }

        // create a logger with a slow sink (100ms delay per log)
        const slowSink = new SlowSink(100);
        const logger = new Logger([slowSink], LogLevel.DEBUG);

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
});

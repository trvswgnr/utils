import { Logger } from "./logger";
import { describe, it, expect, beforeEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(process.cwd(), "logger-test-"));
const logFilePath = path.join(tempDir, "app.log");

describe("Logger", () => {
    beforeEach(() => {
        // Clear the log file before each test
        fs.writeFileSync(logFilePath, "");
        console.log(`Log file cleared at ${logFilePath}`);
    });

    it("should log messages", async () => {
        const logger = new Logger(logFilePath);
        console.log("Created logger");

        // Log a test message
        logger.info("test");
        console.log("Logged test message");

        // Wait for the message to be written to the file
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if the message was written to the file
        await checkFile(logger, "test");
    });
});

async function checkFile(logger: Logger, expected: string | RegExp) {
    await logger.waitForQueueToEmpty(async () => {
        // Read the file content
        const fileContent = fs.readFileSync(logger.filepath, "utf-8");
        console.log(`File content: "${fileContent}"`);

        // Check if the file contains the expected content
        if (typeof expected === "string") {
            expect(fileContent).toContain(expected);
        } else {
            expect(fileContent).toMatch(expected);
        }
    });
}

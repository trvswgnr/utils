import { Logger } from "./logger";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-test-"));
const logFilePath = path.join(tempDir, "app.log");

describe("Logger", () => {
    let logger: Logger;
    beforeEach(() => {
        logger = new Logger(logFilePath);
        // Clear the log file before each test
        fs.writeFileSync(logFilePath, "");
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should log messages", async () => {
        logger.info("test");
        await checkFile(logger, [["INFO", "test"]]);
    });
});

async function checkFile(logger: Logger, expectedLines: [string, string][]) {
    await logger.waitForQueueToEmpty(async () => {
        // Read the file content
        const fileContent = fs.readFileSync(logger.filepath, "utf-8");
        const lines = fileContent.split("\n");
        const last = lines.pop(); // remove the last empty line
        expect(last).toBe("");
        expect(lines.length).toBe(expectedLines.length);
        for (let i = 0; i < lines.length; i++) {
            matchesLogFormat(lines[i]!, expectedLines[i]![0], expectedLines[i]![1]);
        }
    });
}

function matchesLogFormat(line: string, level: string, message: string) {
    expect(line).toMatch(
        new RegExp(
            `\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z \\[${level}\\] ${message} \{\}`,
        ),
    );
}

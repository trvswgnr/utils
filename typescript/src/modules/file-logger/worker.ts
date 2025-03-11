import fs from "node:fs/promises";
import path from "node:path";
// biome-ignore lint/style/noVar: needed
declare var self: Worker;

self.onmessage = async (event) => {
    const { type, message, filepath } = event.data;
    console.log(`Worker received message: type=${type}, filepath=${filepath}`);
    if (type === "log") {
        try {
            await keepTryingToWrite(filepath, message);
            // Notify the main thread that the message was processed
            self.postMessage({ status: "success", message });
        } catch (error) {
            console.error("Worker failed to write message:", error);
            self.postMessage({ status: "error", error: String(error) });
        }
    }
};

async function keepTryingToWrite(filepath: string, message: string) {
    let attempts = 0;
    const directory = path.dirname(filepath);
    while (true) {
        const lockfilePath = path.join(directory, "log.lock");
        // check if the lock file exists
        if (await fs.exists(lockfilePath)) {
            console.log("lock file exists, sleeping");
            await sleep(100 * 2 ** attempts);
            attempts++;
            continue;
        }

        try {
            // make sure the log file exists
            if (!(await fs.exists(filepath))) {
                await fs.writeFile(filepath, "");
            }

            // create lock file
            const lock = await fs.open(lockfilePath, "w");
            await lock.write("1");
            await lock.close();

            // append message to log file
            await fs.appendFile(filepath, `${message}\n`);

            // remove lock file
            await fs.unlink(lockfilePath);

            // successfully wrote message, exit the loop
            break;
        } catch (error) {
            console.error("Error writing to log file:", error);
            attempts++;
            await sleep(100 * 2 ** attempts);

            // try to clean up lock file if it exists
            try {
                if (await fs.exists(lockfilePath)) {
                    await fs.unlink(lockfilePath);
                }
            } catch {
                // ignore errors when cleaning up lock file
            }
            if (attempts > 10) {
                throw new Error("Failed to write to log file after 10 attempts");
            }
        }
    }
}

async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

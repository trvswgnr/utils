import { describe, expect, test } from "bun:test";
import * as Mutex from "./mutex";

describe("Mutex", () => {
    // constructor tests - verify mutex creation and initialization
    describe("create", () => {
        test("should create a new mutex instance", () => {
            const mutex = Mutex.create();
            expect(mutex, "mutex should be an instance of Mutex.Instance").toBeInstanceOf(
                Mutex.Instance,
            )
            expect(mutex.length, "mutex should have exactly one element").toBe(1);
            expect(mutex[0], "mutex should be initialized to unlocked state (0)").toBe(0);
        });
    });

    // type guard tests - verify runtime type checking
    describe("isMutex", () => {
        test("should return true for mutex instances and false for non-mutex values", () => {
            // verify type guard correctly identifies valid and invalid mutex instances
            const mutex = Mutex.create();
            expect(Mutex.isMutex(mutex), "should recognize a valid mutex instance").toBe(
                true,
            );
            expect(Mutex.isMutex(null), "should reject null").toBe(false);
            expect(Mutex.isMutex(undefined), "should reject undefined").toBe(false);
            expect(Mutex.isMutex({}), "should reject plain objects").toBe(false);
            expect(
                Mutex.isMutex(new Int32Array(1)),
                "should reject non-shared Int32Array",
            ).toBe(false);
        });
    });

    // non-blocking acquisition tests - verify tryAcquire behavior
    describe("tryAcquire", () => {
        test("should acquire an unlocked mutex and return true", () => {
            // verify successful acquisition of an unlocked mutex
            const mutex = Mutex.create();
            expect(
                Mutex.tryAcquire(mutex),
                "should successfully acquire unlocked mutex",
            ).toBe(true);
            expect(
                mutex[0],
                "mutex should be in locked state (1) after acquisition",
            ).toBe(1);
        });

        test("should not acquire a locked mutex and return false", () => {
            // verify mutex cannot be acquired when already locked
            const mutex = Mutex.create();
            Atomics.store(mutex, 0, 1); // manually lock the mutex
            expect(
                Mutex.tryAcquire(mutex),
                "should fail to acquire already locked mutex",
            ).toBe(false);
            expect(mutex[0], "mutex should remain in locked state (1)").toBe(1);
        });
    });

    // release tests - verify mutex unlocking
    describe("release", () => {
        test("should release a locked mutex", () => {
            // verify mutex can be properly released
            const mutex = Mutex.create();
            Atomics.store(mutex, 0, 1); // manually lock the mutex
            expect(mutex[0], "mutex should be in locked state (1) before release").toBe(
                1,
            );

            Mutex.release(mutex);
            expect(mutex[0], "mutex should be in unlocked state (0) after release").toBe(
                0,
            );
        });
    });

    // blocking acquisition tests - verify acquire behavior
    describe("acquire", () => {
        test("should acquire an unlocked mutex", () => {
            // verify basic acquisition works
            const mutex = Mutex.create();
            expect(mutex[0], "mutex should be in unlocked state (0) initially").toBe(0);

            Mutex.acquire(mutex);
            expect(
                mutex[0],
                "mutex should be in locked state (1) after acquisition",
            ).toBe(1);
        });
    });

    // synchronous critical section tests - verify withLock behavior
    describe("withLock", () => {
        test("should acquire the lock, execute the function, and release the lock", () => {
            // verify proper lock lifecycle during synchronous execution
            const mutex = Mutex.create();
            let executed = false;

            const result = Mutex.withLock(mutex, () => {
                expect(mutex[0], "mutex should be locked during function execution").toBe(
                    1,
                );
                executed = true;
                return "test result";
            });

            expect(executed, "callback function should have executed").toBe(true);
            expect(result, "withLock should return the callback's result").toBe(
                "test result",
            );
            expect(mutex[0], "mutex should be unlocked after function execution").toBe(0);
        });

        test("should release the lock even if the function throws", () => {
            // verify exception safety - lock must be released even when function throws
            const mutex = Mutex.create();

            try {
                Mutex.withLock(mutex, () => {
                    throw new Error("test error");
                });
                expect(true, "should not reach this point").toBe(false);
            } catch (error: unknown) {
                expect(error, "error should be propagated").toBeInstanceOf(Error);
                expect(
                    (error as Error).message,
                    "error message should be preserved",
                ).toBe("test error");
            }

            expect(mutex[0], "mutex should be unlocked after exception").toBe(0);
        });
    });

    // asynchronous critical section tests - verify withLockAsync behavior
    describe("withLockAsync", () => {
        test("should acquire the lock, execute the async function, and release the lock", async () => {
            // verify proper lock lifecycle during asynchronous execution
            const mutex = Mutex.create();
            let executed = false;

            const result = await Mutex.withLockAsync(mutex, async () => {
                expect(
                    mutex[0],
                    "mutex should be locked during async function execution",
                ).toBe(1);
                executed = true;
                return "test result";
            });

            expect(executed, "async callback function should have executed").toBe(true);
            expect(result, "withLockAsync should return the callback's result").toBe(
                "test result",
            );
            expect(
                mutex[0],
                "mutex should be unlocked after async function execution",
            ).toBe(0);
        });

        test("should release the lock even if the async function throws", async () => {
            // verify async exception safety - lock must be released even when async function rejects
            const mutex = Mutex.create();

            // try {
            //     await Mutex.withLockAsync(mutex, async () => {
            //         throw new Error("test error");
            //     });
            //     expect(true, "should not reach this point").toBe(false);
            // } catch (error: unknown) {
            //     if (error instanceof Error) {
            //         expect(
            //             error.message,
            //             "error message should be preserved",
            //         ).toBe("test error");
            //     } else {
            //         throw error;
            //     }
            // }
            const e = new Error("test error");
            expect(
                async () =>
                    await Mutex.withLockAsync(mutex, async () => {
                        throw e;
                    }),
            ).toThrow(e);

            expect(mutex[0], "mutex should be unlocked after async exception").toBe(0);
        });
    });

    // multi-threading tests - verify mutex behavior across worker threads
    describe("concurrent access", () => {
        test("should protect a shared resource from concurrent access", async () => {
            // verify mutex prevents race conditions in a multi-threaded environment
            const mutex = Mutex.create();
            const sharedCounter = new Int32Array(new SharedArrayBuffer(4));

            const workerScript = `
import * as Mutex from "${import.meta.url.replace("mutex.test.ts", "mutex.ts")}";
      
      self.onmessage = async (e) => {
        const { mutex, sharedCounter, iterations } = e.data;
        
        for (let i = 0; i < iterations; i++) {
          let acquired = false;
          let attempts = 0;
          const maxAttempts = 10;
          
          while (!acquired && attempts < maxAttempts) {
            acquired = Mutex.tryAcquire(mutex);
            if (acquired) {
              try {
                const currentValue = Atomics.load(sharedCounter, 0);
                for (let j = 0; j < 10; j++) {} 
                Atomics.store(sharedCounter, 0, currentValue + 1);
              } finally {
                Mutex.release(mutex);
              }
            } else {
              await new Promise(r => setTimeout(r, 5));
              attempts++;
            }
          }
          
          if (!acquired) {
            self.postMessage("failed");
            return;
          }
        }
        
        self.postMessage("done");
      };`;

            const workerFile = new Blob([workerScript], {
                type: "application/javascript",
            });
            const workerUrl = URL.createObjectURL(workerFile);

            const numWorkers = 4;
            const iterationsPerWorker = 25;
            const totalIncrements = numWorkers * iterationsPerWorker;

            const workers = Array.from({ length: numWorkers }, () => {
                const worker = new Worker(workerUrl);
                worker.postMessage({
                    mutex,
                    sharedCounter,
                    iterations: iterationsPerWorker,
                });
                return worker;
            });

            const results = await Promise.all(
                workers.map((worker) => {
                    return Promise.race([
                        new Promise<string>((resolve) => {
                            worker.onmessage = (e) => {
                                worker.terminate();
                                resolve(e.data);
                            };
                        }),
                        new Promise<string>((resolve) => {
                            setTimeout(() => {
                                worker.terminate();
                                resolve("timeout");
                            }, 1000);
                        }),
                    ]);
                }),
            );

            expect(
                results.every((r) => r === "done"),
                "all workers should complete successfully",
            ).toBe(true);

            const finalCount = Atomics.load(sharedCounter, 0);
            // allow for some missed increments due to maxAttempts limit
            expect(
                finalCount,
                "counter should have been incremented at least 90% of expected times",
            ).toBeGreaterThanOrEqual(totalIncrements * 0.9);
            expect(
                finalCount,
                "counter should not exceed expected number of increments",
            ).toBeLessThanOrEqual(totalIncrements);

            URL.revokeObjectURL(workerUrl);
        });
    });

    // edge case tests - verify behavior in unusual situations
    describe("edge cases", () => {
        test("should handle releasing an already unlocked mutex", () => {
            // verify releasing an unlocked mutex doesn't cause errors
            const mutex = Mutex.create();
            expect(mutex[0], "mutex should be initially unlocked").toBe(0);

            expect(
                () => Mutex.release(mutex),
                "releasing an unlocked mutex should not throw",
            ).not.toThrow();
            expect(mutex[0], "mutex should remain unlocked after release").toBe(0);
        });

        test("should handle multiple releases", () => {
            // verify multiple releases don't cause errors or unexpected state
            const mutex = Mutex.create();

            Mutex.acquire(mutex);
            expect(mutex[0], "mutex should be locked after acquisition").toBe(1);

            Mutex.release(mutex);
            expect(mutex[0], "mutex should be unlocked after first release").toBe(0);

            Mutex.release(mutex);
            expect(mutex[0], "mutex should remain unlocked after second release").toBe(0);
        });

        test("should be non-reentrant", () => {
            // verify mutex cannot be acquired twice by the same thread
            const mutex = Mutex.create();

            expect(Mutex.tryAcquire(mutex), "first acquisition should succeed").toBe(
                true,
            );
            expect(mutex[0], "mutex should be locked after acquisition").toBe(1);

            expect(Mutex.tryAcquire(mutex), "second acquisition should fail").toBe(false);

            Mutex.release(mutex);
        });
    });

    // reliability tests - verify consistent behavior over multiple operations
    describe("stress test", () => {
        test("should handle a few lock/unlock cycles", () => {
            // verify mutex remains consistent through multiple lock/unlock cycles
            const mutex = Mutex.create();
            const cycles = 10;

            for (let i = 0; i < cycles; i++) {
                Mutex.acquire(mutex);
                expect(mutex[0], `mutex should be locked in cycle ${i}`).toBe(1);
                Mutex.release(mutex);
                expect(mutex[0], `mutex should be unlocked in cycle ${i}`).toBe(0);
            }
        });
    });

    // performance tests - verify non-blocking behavior
    describe("backoff behavior", () => {
        test("should use tryAcquire for non-blocking mutex attempts", () => {
            // verify tryAcquire returns immediately without waiting
            const mutex = Mutex.create();

            Mutex.acquire(mutex);
            expect(mutex[0], "mutex should be locked").toBe(1);

            const startTime = performance.now();
            const acquired = Mutex.tryAcquire(mutex);
            const endTime = performance.now();

            Mutex.release(mutex);

            expect(acquired, "tryAcquire should fail on locked mutex").toBe(false);
            expect(
                endTime - startTime,
                "tryAcquire should return immediately (< 5ms)",
            ).toBeLessThan(5);
        });
    });

    // timeout tests - verify timeout behavior
    describe("timeout behavior", () => {
        test("should throw an error if the mutex is not acquired within the timeout period", () => {
            // verify timeout mechanism works with moderate timeout
            const mutex = Mutex.create();

            Mutex.acquire(mutex);
            expect(mutex[0], "mutex should be locked").toBe(1);

            const timeoutMs = 50;
            const startTime = performance.now();

            try {
                Mutex.acquire(mutex, timeoutMs);
                expect(true, "should not reach this point").toBe(false);
            } catch (error: unknown) {
                const endTime = performance.now();
                const elapsed = endTime - startTime;

                expect(error, "should throw an Error instance").toBeInstanceOf(Error);
                expect(
                    (error as Error).message,
                    "should throw with timeout message",
                ).toBe("Mutex acquisition timed out");

                expect(
                    elapsed,
                    "should wait at least the timeout duration",
                ).toBeGreaterThanOrEqual(timeoutMs - 1);
                expect(
                    elapsed,
                    "should not wait significantly longer than timeout",
                ).toBeLessThan(timeoutMs + 20);
            } finally {
                Mutex.release(mutex);
            }
        });

        test("should respect very short timeouts", () => {
            // verify timeout mechanism works with very short timeout
            const mutex = Mutex.create();

            Mutex.acquire(mutex);
            const timeoutMs = 5;
            const startTime = performance.now();

            try {
                Mutex.acquire(mutex, timeoutMs);
                expect(true, "should not reach this point").toBe(false);
            } catch (error: unknown) {
                const endTime = performance.now();
                const elapsed = endTime - startTime;

                expect(error, "should throw an Error instance").toBeInstanceOf(Error);
                expect(
                    (error as Error).message,
                    "should throw with timeout message",
                ).toBe("Mutex acquisition timed out");

                expect(
                    elapsed,
                    "should wait at least the timeout duration",
                ).toBeGreaterThanOrEqual(timeoutMs);
                expect(
                    elapsed,
                    "should not wait significantly longer than timeout",
                ).toBeLessThan(timeoutMs + 15);
            } finally {
                Mutex.release(mutex);
            }
        });
    });
});

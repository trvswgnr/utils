import { expect, test, describe } from "bun:test";
import { Queue } from "./queue";

describe("Queue", () => {
    // constructor tests - verify queue initialization
    describe("Constructor", () => {
        test("should create empty queue with valid size", () => {
            const queue = new Queue();
            expect(queue.size, "newly created queue should have zero size").toBe(0);
            expect(queue.isEmpty(), "newly created queue should be empty").toBe(true);
        });
    });

    // basic operation tests - verify core queue functionality
    describe("Basic Operations", () => {
        test("enqueue should add items correctly", () => {
            // verify enqueue properly adds items and updates size
            const queue = new Queue();
            queue.enqueue(1);
            expect(queue.size, "queue size should be 1 after adding one item").toBe(1);
            expect(queue.peek(), "peek should return the first item added").toBe(1);

            queue.enqueue(2);
            expect(queue.size, "queue size should be 2 after adding second item").toBe(2);
            expect(
                queue.peek(),
                "peek should still return the first item in FIFO order",
            ).toBe(1);
        });

        test("dequeue should remove and return items in FIFO order", () => {
            // verify dequeue maintains FIFO ordering and updates size
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            expect(queue.dequeue(), "first dequeue should return first item added").toBe(
                1,
            );
            expect(
                queue.dequeue(),
                "second dequeue should return second item added",
            ).toBe(2);
            expect(queue.dequeue(), "third dequeue should return third item added").toBe(
                3,
            );
            expect(
                queue.isEmpty(),
                "queue should be empty after dequeuing all items",
            ).toBe(true);
        });

        test("peek should return first item without removing it", () => {
            // verify peek returns but doesn't remove the first item
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);

            expect(queue.peek(), "peek should return the first item").toBe(1);
            expect(queue.size, "size should remain unchanged after peek").toBe(2);
            expect(queue.peek(), "repeated peek should return the same item").toBe(1);
        });

        test("clear should remove all items", () => {
            // verify clear empties the queue completely
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);
            queue.clear();

            expect(queue.isEmpty(), "queue should be empty after clear").toBe(true);
            expect(queue.size, "queue size should be 0 after clear").toBe(0);
        });
    });

    // error handling tests - verify queue handles edge cases
    describe("Capacity Handling", () => {
        test("should throw error when dequeuing from empty queue", () => {
            // verify proper error handling for empty queue operations
            const queue = new Queue();
            expect(
                () => queue.dequeue(),
                "dequeue on empty queue should throw error",
            ).toThrow("Queue is empty");
            expect(
                () => queue.peek(),
                "peek on empty queue should not throw",
            ).not.toThrow("Queue is empty");
            expect(queue.peek(), "peek on empty queue should return null").toBeNull();
        });
    });

    // safe operation tests - verify non-throwing alternatives
    describe("Safe Operations", () => {
        test("tryDequeue should return null when empty", () => {
            // verify tryDequeue provides safe alternative to dequeue
            const queue = new Queue();
            expect(
                queue.tryDequeue(),
                "tryDequeue on empty queue should return null",
            ).toBeNull();

            queue.enqueue(1);
            expect(
                queue.tryDequeue(),
                "tryDequeue on non-empty queue should return item",
            ).toBe(1);
            expect(
                queue.tryDequeue(),
                "tryDequeue after emptying queue should return null",
            ).toBeNull();
        });
    });

    // async operation tests - verify timeout-based dequeue
    describe("Async Operations", () => {
        test("dequeueWithTimeout should return null after timeout", async () => {
            // verify timeout behavior when no items are available
            const queue = new Queue();
            const result = await queue.dequeueWithTimeout(100);
            expect(
                result,
                "should return null when timeout expires with no items",
            ).toBeNull();
        });

        test("dequeueWithTimeout should return item if available", async () => {
            // verify immediate return when item is already available
            const queue = new Queue();
            queue.enqueue(42);
            const result = await queue.dequeueWithTimeout(100);
            expect(
                result,
                "should immediately return available item without waiting",
            ).toBe(42);
        });

        test("dequeueWithTimeout should return item when it becomes available", async () => {
            // verify waiting behavior when item arrives before timeout
            const queue = new Queue();
            setTimeout(() => queue.enqueue(42), 50);
            const result = await queue.dequeueWithTimeout(100);
            expect(result, "should return item that arrives before timeout expires").toBe(
                42,
            );
        });
    });

    // metrics tests - verify queue statistics tracking
    describe("Metrics", () => {
        test("should track basic metrics correctly", () => {
            // verify metrics accurately track queue operations
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);
            queue.dequeue();
            queue.enqueue(3);
            queue.enqueue(4);

            const metrics = queue.getMetrics();
            expect(
                metrics.enqueueCount,
                "should track total number of enqueue operations",
            ).toBe(4);
            expect(
                metrics.dequeueCount,
                "should track total number of successful dequeue operations",
            ).toBe(1);
            expect(metrics.peakSize, "should track maximum queue size reached").toBe(3);
            expect(
                metrics.underflowCount,
                "should track number of empty dequeue attempts",
            ).toBe(0);
            expect(typeof metrics.uptime, "uptime should be a numeric value").toBe(
                "number",
            );
        });

        test("should track overflow and underflow", () => {
            // verify underflow tracking for empty dequeue attempts
            const queue = new Queue();
            expect(() => queue.dequeue(), "dequeue on empty queue should throw").toThrow(
                "Queue is empty",
            );
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            const metrics = queue.getMetrics();
            expect(
                metrics.underflowCount,
                "should increment underflow count for empty dequeue attempts",
            ).toBe(1);
        });
    });

    // iterator tests - verify queue iteration
    describe("Iterator", () => {
        test("should be iterable", () => {
            // verify queue implements iterable protocol
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            const items = [...queue];
            expect(
                items,
                "spread operator should convert queue to array with all elements",
            ).toEqual([1, 2, 3]);
        });

        test("should not modify queue while iterating", () => {
            // verify iteration is non-destructive
            const queue = new Queue();
            queue.enqueue(1);
            queue.enqueue(2);

            [...queue]; // iterate through queue
            expect(queue.size, "queue size should remain unchanged after iteration").toBe(
                2,
            );
            expect(
                queue.peek(),
                "first element should remain unchanged after iteration",
            ).toBe(1);
        });
    });

    // concurrency tests - verify thread safety
    describe("Thread Safety", () => {
        test("should handle concurrent operations safely", async () => {
            // verify queue remains consistent under concurrent access
            const queue = new Queue<number>();
            const operations = 100;
            const producers = 5;
            const consumers = 5;

            // producers
            const producerPromises = Array.from({ length: producers }).map(async () => {
                for (let i = 0; i < operations; i++) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, Math.random() * 10),
                    );
                    queue.enqueue(i);
                }
            });

            // consumers
            const consumerPromises = Array.from({ length: consumers }).map(async () => {
                for (let i = 0; i < operations; i++) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, Math.random() * 10),
                    );
                    queue.tryDequeue();
                }
            });

            await Promise.all([...producerPromises, ...consumerPromises]);

            const metrics = queue.getMetrics();
            expect(
                metrics.dequeueCount + metrics.underflowCount,
                "total consumer operations should match expected count",
            ).toBe(consumers * operations);
        });
    });

    // type safety tests - verify generic implementation
    describe("Type Safety", () => {
        test("should handle various data types", () => {
            // verify queue works with different data types
            const mixedQueue = new Queue<unknown>();
            mixedQueue.enqueue("string");
            mixedQueue.enqueue({ complex: "object" });
            mixedQueue.enqueue([1, 2, 3]);
            mixedQueue.enqueue(null);
            mixedQueue.enqueue(undefined);

            expect(mixedQueue.dequeue(), "should handle string values").toBe("string");
            expect(mixedQueue.dequeue(), "should handle object values").toEqual({
                complex: "object",
            });
            expect(mixedQueue.dequeue(), "should handle array values").toEqual([1, 2, 3]);
            expect(mixedQueue.dequeue(), "should handle null values").toBeNull();
            expect(
                mixedQueue.dequeue(),
                "should handle undefined values",
            ).toBeUndefined();
        });

        test("should maintain type safety with generics", () => {
            // verify type constraints are enforced at compile time
            const stringQueue = new Queue<string>();
            stringQueue.enqueue("test");
            // @ts-expect-error - number not assignable to string
            stringQueue.enqueue(42);

            const objectQueue = new Queue<{ id: number }>();
            objectQueue.enqueue({ id: 1 });
            // @ts-expect-error - missing id prop
            objectQueue.enqueue({});
        });
    });

    // lock mechanism tests - verify mutex behavior
    describe("Lock Mechanism", () => {
        test("should handle rapid lock/unlock cycles", async () => {
            // verify internal locking mechanism remains stable under stress
            const queue = new Queue<number>();
            const operations = 1000;
            const threads = 10;
            let errors = 0;

            // rapid concurrent operations
            await Promise.all(
                Array.from({ length: threads }).map(async (_, threadId) => {
                    try {
                        for (let i = 0; i < operations; i++) {
                            if (Math.random() > 0.5) {
                                queue.enqueue(threadId * operations + i);
                            } else {
                                queue.tryDequeue();
                            }
                        }
                    } catch (e) {
                        errors++;
                    }
                }),
            );

            expect(errors, "no errors should occur during concurrent operations").toBe(0);
            // queue should still be in a valid state
            expect(
                () => queue.enqueue(1),
                "queue should accept new items after stress test",
            ).not.toThrow();
            expect(
                (() => {
                    const item = queue.tryDequeue();
                    return typeof item === "number" || item === null;
                })(),
                "queue should return valid results after stress test",
            ).toBe(true);
        });

        test("should prevent deadlocks under extreme contention", async () => {
            // verify queue operations don't deadlock under extreme contention
            const queue = new Queue<number>();
            const start = Date.now();
            const timeout = 1000; // 1 second timeout

            const tasks = Array<Promise<void>>(20)
                .fill(Promise.resolve())
                .map(async () => {
                    while (Date.now() - start < timeout) {
                        await Promise.all([
                            queue.enqueue(1),
                            queue.tryDequeue(),
                            queue.size,
                            queue.isEmpty(),
                        ]);
                    }
                });

            await Promise.all(tasks);
            // if we reach here, no deadlock occurred
            expect(true, "test should complete without deadlocking").toBe(true);
        });
    });

    // performance tests - verify efficiency
    describe("Performance", () => {
        test("should handle large number of operations efficiently", () => {
            // verify queue performance with bulk operations
            const largeQueue = new Queue<number>();
            const operationCount = 100_000;
            const start = performance.now();

            // bulk enqueue
            for (let i = 0; i < operationCount; i++) {
                largeQueue.enqueue(i);
            }

            // bulk dequeue
            for (let i = 0; i < operationCount; i++) {
                largeQueue.dequeue();
            }

            const duration = performance.now() - start;
            expect(
                duration,
                "bulk operations should complete within time limit",
            ).toBeLessThan(1000);
            expect(
                largeQueue.isEmpty(),
                "queue should be empty after bulk operations",
            ).toBe(true);
        });

        test("should maintain performance under mixed operations", () => {
            // verify queue performance with mixed operation patterns
            const queue = new Queue<number>();
            const operations = 10000;
            const start = performance.now();

            for (let i = 0; i < operations; i++) {
                if (i % 2 === 0) {
                    queue.enqueue(i);
                } else {
                    queue.tryDequeue();
                }

                if (i % 100 === 0) {
                    queue.size;
                    queue.isEmpty();
                }
            }

            const duration = performance.now() - start;
            expect(
                duration,
                "mixed operations should complete within time limit",
            ).toBeLessThan(500);
        });
    });

    // advanced async tests - verify complex timeout scenarios
    describe("Improved Async Operations", () => {
        test("should handle multiple timeout scenarios", async () => {
            // verify different timing scenarios for async dequeue
            const queue = new Queue<number>();

            // test immediate availability
            queue.enqueue(1);
            const immediate = await queue.dequeueWithTimeout(1);
            expect(immediate, "should immediately return available item").toBe(1);

            // test exact timeout
            const beforeTimeout = await queue.dequeueWithTimeout(50);
            expect(
                beforeTimeout,
                "should return null after timeout with no items",
            ).toBeNull();

            // test race condition between timeout and enqueue
            const timeoutPromise = queue.dequeueWithTimeout(1000);
            await new Promise((resolve) => setTimeout(resolve, 10));
            queue.enqueue(2);
            const result = await timeoutPromise;
            expect(result, "should return item that arrives while waiting").toBe(2);
        });

        test("should handle concurrent timeouts correctly", async () => {
            // verify multiple concurrent timeout operations
            const queue = new Queue<number>();
            const timeoutPromises = Array.from({ length: 10 }).map(() =>
                queue.dequeueWithTimeout(100),
            );

            // enqueue items after a small delay
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    queue.enqueue(i);
                }
            }, 50);

            const results = await Promise.all(timeoutPromises);
            const validResults = results.filter((r) => r !== null);
            expect(
                validResults.length,
                "should fulfill exactly 5 promises with values",
            ).toBe(5);
            expect(
                results.filter((r) => r === null).length,
                "should timeout exactly 5 promises",
            ).toBe(5);
        });
    });

    // drain tests - verify bulk removal
    describe("Drain", () => {
        test("should drain the queue", () => {
            // verify drain removes and returns all items
            const queue = new Queue<number>();
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            const d = queue.drain();
            const drained = [...d];
            expect(drained, "drain should return all items in correct order").toEqual([
                1, 2, 3,
            ]);
            expect(queue.size, "queue should be empty after drain").toBe(0);
        });
    });
});

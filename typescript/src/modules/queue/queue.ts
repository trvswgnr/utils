import { SinglyLinkedList as List } from "../list";
import * as Mutex from "../mutex";

export class QueueError extends Error {
    public static override readonly name = "QueueError";
    constructor(message: string) {
        super(message);
        this.name = QueueError.name;
    }
}

/**
 * metrics for monitoring queue performance and health
 */
export interface QueueMetrics {
    /** total successful enqueues */
    enqueueCount: number;
    /** total successful dequeues */
    dequeueCount: number;
    /** maximum number of items ever in queue */
    peakSize: number;
    /** number of failed dequeues due to queue being empty */
    underflowCount: number;
    /** uptime of the queue */
    uptime: number;
}

/**
 * A thread-safe, bounded FIFO queue
 */
export class Queue<T> {
    private readonly _items: List<T>;
    private readonly _metrics: QueueMetrics;
    private readonly _createdAt: number;
    private readonly _lock: Mutex.Instance;

    constructor() {
        this._items = new List<T>();
        this._createdAt = Date.now();
        this._metrics = {
            enqueueCount: 0,
            dequeueCount: 0,
            peakSize: 0,
            underflowCount: 0,
            uptime: 0,
        };
        this._lock = Mutex.create();
    }

    /**
     * Adds an item to the end of the queue
     */
    enqueue(item: T): void {
        Mutex.withLock(this._lock, () => {
            const currentSize = this._items.length;
            this._items.insertBack(item);
            this._metrics.enqueueCount++;
            this._metrics.peakSize = Math.max(this._metrics.peakSize, currentSize + 1);
        });
    }

    /**
     * Removes and returns the first item in the queue
     * @throws {QueueError} If queue is empty
     */
    dequeue(): T {
        return Mutex.withLock(this._lock, () => {
            if (this.isEmpty()) {
                this._metrics.underflowCount++;
                throw new QueueError("Queue is empty");
            }

            const item = this._items.removeFront();
            this._metrics.dequeueCount++;
            return item;
        });
    }

    /**
     * Returns the first item without removing it
     */
    peek(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        return this._items.head?.data ?? null;
    }

    /**
     * Attempts to dequeue an item with a timeout
     * @param timeoutMs Timeout in milliseconds
     * @returns The dequeued item or null if timeout occurs
     */
    async dequeueWithTimeout(timeoutMs: number): Promise<T | null> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            if (!this.isEmpty()) {
                return this.dequeue();
            }
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return null;
    }

    /**
     * Safely attempts to dequeue an item
     * @returns The dequeued item or `null` if queue is empty
     */
    tryDequeue(): T | null {
        try {
            return this.dequeue();
        } catch {
            return null;
        }
    }

    /**
     * Returns current queue metrics
     */
    getMetrics(): QueueMetrics {
        return {
            ...this._metrics,
            uptime: Date.now() - this._createdAt,
        };
    }

    /**
     * Clears all items from the queue
     */
    clear(): void {
        Mutex.withLock(this._lock, () => {
            this._items.clear();
        });
    }

    /**
     * Returns the current size of the queue
     */
    get size(): number {
        return this._items.length;
    }

    /**
     * Checks if the queue is empty
     */
    isEmpty(): boolean {
        return this._items.length === 0;
    }

    /**
     * Returns an iterator for the queue
     */
    *[Symbol.iterator](): Iterator<T> {
        yield* this._items;
    }

    public *drain() {
        while (!this.isEmpty()) {
            yield this.dequeue();
        }
    }
}

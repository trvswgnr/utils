/** size of an i32 in bytes - required for proper memory allocation */
const I32_SIZE = 4;

/**
 * maximum backoff in milliseconds - prevents excessive wait times
 * while still allowing for effective contention management
 */
const MAX_BACKOFF_MS = 1000;

/**
 * represents a mutex as a single-element typed array over a shared buffer
 * the mutex is locked when the value is 1, unlocked when 0
 */
export type Instance = Int32Array<SharedArrayBuffer> & { length: 1 };
export const Instance = Int32Array<SharedArrayBuffer>;

/**
 * creates a new mutex instance backed by a shared buffer
 * the mutex is initially unlocked (set to 0)
 */
export function create(): Instance {
    return new Int32Array<SharedArrayBuffer>(new SharedArrayBuffer(I32_SIZE)) as Instance;
}

/**
 * type guard to verify if a value is a valid mutex instance
 * critical for runtime type safety when working with mutexes
 */
export function isMutex(value: unknown): value is Instance {
    return (
        value instanceof Int32Array &&
        value.buffer instanceof SharedArrayBuffer &&
        value.length === 1
    );
}

/**
 * attempts to acquire the mutex lock without blocking
 *
 * uses atomic compare-and-exchange to safely attempt lock acquisition:
 * - if mutex value is 0 (unlocked), changes it to 1 (locked) and returns true
 * - if mutex value is already 1 (locked), leaves it unchanged and returns false
 *
 * this is non-blocking - it immediately returns the result without waiting
 */
export function tryAcquire(mutex: Instance): boolean {
    return Atomics.compareExchange(mutex, 0, 0, 1) === 0;
}

/**
 * acquires the lock using atomic operations with exponential backoff
 * this provides true thread safety without cpu-intensive busy waiting
 *
 * the exponential backoff with jitter helps prevent thundering herd problems
 * when multiple threads are contending for the same lock
 *
 * @param mutex the mutex to acquire
 * @param timeoutMs optional timeout in milliseconds. if specified, the function will throw an error if the mutex cannot be acquired within this time.
 * @throws {Error} if the mutex cannot be acquired within the timeout period
 */
export function acquire(
    mutex: Instance,
    timeoutMs?: number,
): ReturnType<typeof _release> {
    // optimistic fast path - most locks are uncontended
    if (tryAcquire(mutex)) {
        return _release(mutex);
    }

    // contention detected - use backoff strategy
    let attempts = 0;
    const startTime = Date.now();

    while (true) {
        if (tryAcquire(mutex)) {
            return _release(mutex);
        }

        // no timeout case - can wait indefinitely with backoff
        if (typeof timeoutMs === "undefined") {
            const backoff = Math.min(2 ** attempts, MAX_BACKOFF_MS);
            const jitter = Math.random() * backoff;
            Atomics.wait(mutex, 0, 1, Math.floor(jitter));
            attempts++;
            continue;
        }

        // timeout handling logic
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
            throw new Error("Mutex acquisition timed out");
        }

        // calculate remaining time before timeout
        const remainingTime = timeoutMs - elapsed;

        // backoff with jitter, bounded by remaining time
        const backoff = Math.min(2 ** attempts, MAX_BACKOFF_MS);
        const jitter = Math.random() * backoff;
        const waitTime = Math.min(Math.floor(jitter), remainingTime);

        // for very small wait times, use minimal wait to reduce overhead
        if (waitTime <= 1) {
            Atomics.wait(mutex, 0, 1, 1);
        } else {
            Atomics.wait(mutex, 0, 1, waitTime);
        }

        attempts++;
    }
}

function _release(mutex: Instance): () => void {
    return () => {
        Atomics.store(mutex, 0, 0);
        // wake exactly one waiting thread to prevent contention storms
        Atomics.notify(mutex, 0, 1);
    };
}

/**
 * releases a previously acquired mutex
 * notifies one waiting thread that the mutex is now available
 * calling this on an unlocked mutex is undefined behavior
 * @deprecated use {@link acquire `acquire`} to acquire a mutex which returns the release function
 */
export const release = _release;

/**
 * executes a function within a mutex lock, ensuring the lock is always released
 * provides exception safety through the try/finally pattern
 *
 * @param mutex the mutex to lock during execution
 * @param fn the function to execute while holding the lock
 * @returns the result of the function execution
 */
export function withLock<R>(mutex: Instance, fn: () => R): R {
    acquire(mutex);
    try {
        return fn();
    } finally {
        _release(mutex);
    }
}

/**
 * executes an async function within a mutex lock
 * ensures the lock is released even if the promise rejects
 *
 * @note the mutex remains locked during async operations,
 * potentially leading to long lock hold times
 *
 * @param mutex the mutex to lock during execution
 * @param fn the async function to execute while holding the lock
 * @returns a promise resolving to the function's result
 */
export async function withLockAsync<R>(
    mutex: Instance,
    fn: () => Promise<R>,
): Promise<R> {
    acquire(mutex);
    try {
        return await fn();
    } finally {
        _release(mutex);
    }
}

export function isLocked(mutex: Instance): boolean {
    return Atomics.load(mutex, 0) === 1;
}

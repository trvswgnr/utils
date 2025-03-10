/**
 * custom error for linked list operations
 *
 * provides context about what went wrong during list operations
 * with specific error codes for different failure scenarios
 */
export class LinkedListError extends Error {
    public static override readonly name = "LinkedListError";
    constructor(message: string) {
        super(message);
        this.name = LinkedListError.name;

        // preserve proper stack trace in v8 environments
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, LinkedListError);
        }
    }
}

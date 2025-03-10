import { LinkedListError } from "./error";

/**
 * node in a doubly-linked list
 *
 * contains references to both next and previous nodes to enable
 * bidirectional traversal and O(1) operations at both ends
 */
class DLLNode<T> {
    data: T;
    next: DLLNode<T> | null;
    prev: DLLNode<T> | null;

    constructor(data: T) {
        this.data = data;
        this.next = null;
        this.prev = null;
    }
}

/**
 * doubly linked list implementation
 *
 * - uses bidirectional links to support efficient operations at both ends
 * - maintains tail reference to avoid O(n) traversals for back operations
 * - tracks size internally to avoid O(n) counting operations
 */
export class DoublyLinkedList<T> implements Iterable<T> {
    private head: DLLNode<T> | null;
    private tail: DLLNode<T> | null;
    private _length: number;

    public constructor() {
        this.head = null;
        this.tail = null;
        this._length = 0;
    }

    /**
     * adds element to front of list
     *
     * - direct head manipulation provides O(1) performance regardless of list size
     */
    public insertFront(data: T): void {
        const newNode = new DLLNode(data);

        if (!this.head) {
            this.head = this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }

        this._length++;
    }

    /**
     * adds element to back of list
     *
     * - tail reference enables O(1) insertion without traversal
     */
    public insertBack(data: T): void {
        const newNode = new DLLNode(data);

        if (!this.tail) {
            this.head = this.tail = newNode;
        } else {
            newNode.prev = this.tail;
            this.tail.next = newNode;
            this.tail = newNode;
        }

        this._length++;
    }

    /**
     * adds element at specified index
     *
     * - optimizes traversal by starting from nearest end to reduce worst-case
     *   path length from O(n) to O(n/2)
     *
     * @throws {RangeError} when index is out of bounds
     */
    public insertAt(index: number, data: T): void {
        if (index < 0 || index > this._length) {
            throw new RangeError(`index ${index} is out of bounds`);
        }

        if (index === 0) {
            this.insertFront(data);
            return;
        }

        if (index === this._length) {
            this.insertBack(data);
            return;
        }

        // traverse to insertion point from whichever end is closer
        let current: DLLNode<T> | null = null;
        if (index <= this._length / 2) {
            current = this.head;
            for (let i = 0; i < index - 1 && current; i++) {
                current = current.next;
            }
        } else {
            current = this.tail;
            for (let i = this._length - 1; i > index - 1 && current; i--) {
                current = current.prev;
            }
        }

        if (!current || !current.next) {
            throw new LinkedListError("unexpected null pointer during insertion");
        }

        const newNode = new DLLNode(data);
        newNode.next = current.next;
        newNode.prev = current;
        current.next.prev = newNode;
        current.next = newNode;

        this._length++;
    }

    /**
     * removes and returns front element
     *
     * - direct head manipulation provides O(1) performance
     * - handles the edge case of removing the last element by updating both head and tail
     *
     * @throws {Error} when list is empty
     */
    public removeFront(): T {
        if (!this.head) {
            throw new LinkedListError("cannot remove from empty list");
        }

        const data = this.head.data;

        if (this.head === this.tail) {
            this.head = this.tail = null;
        } else {
            this.head = this.head.next;
            if (this.head) {
                this.head.prev = null;
            }
        }

        this._length--;
        return data;
    }

    /**
     * removes and returns back element
     *
     * - tail reference enables O(1) removal without traversal
     * - handles the edge case of removing the last element by updating both head and tail
     *
     * @throws {Error} when list is empty
     */
    public removeBack(): T {
        if (!this.tail) {
            throw new LinkedListError("cannot remove from empty list");
        }

        const data = this.tail.data;

        if (this.head === this.tail) {
            this.head = this.tail = null;
        } else {
            this.tail = this.tail.prev;
            if (this.tail) {
                this.tail.next = null;
            }
        }

        this._length--;
        return data;
    }

    /**
     * removes and returns element at index
     *
     * - optimizes traversal by starting from nearest end to reduce worst-case
     *   path length from O(n) to O(n/2)
     *
     * @throws {RangeError} when index is out of bounds
     */
    public removeAt(index: number): T {
        if (index < 0 || index >= this._length) {
            throw new RangeError(`index ${index} is out of bounds`);
        }

        if (index === 0) {
            return this.removeFront();
        }

        if (index === this._length - 1) {
            return this.removeBack();
        }

        // traverse to removal point from whichever end is closer
        let current: DLLNode<T> | null = null;
        if (index <= this._length / 2) {
            current = this.head;
            for (let i = 0; i < index && current; i++) {
                current = current.next;
            }
        } else {
            current = this.tail;
            for (let i = this._length - 1; i > index && current; i--) {
                current = current.prev;
            }
        }

        if (!current || !current.prev || !current.next) {
            throw new LinkedListError("unexpected null pointer during removal");
        }

        current.prev.next = current.next;
        current.next.prev = current.prev;

        this._length--;
        return current.data;
    }

    private getNodeAt(index: number): DLLNode<T> {
        if (index < 0 || index >= this._length) {
            throw new RangeError(`index ${index} is out of bounds`);
        }

        // traverse from whichever end is closer
        let current: DLLNode<T> | null = null;
        if (index <= this._length / 2) {
            current = this.head;
            for (let i = 0; i < index && current; i++) {
                current = current.next;
            }
        } else {
            current = this.tail;
            for (let i = this._length - 1; i > index && current; i--) {
                current = current.prev;
            }
        }

        if (!current) {
            throw new LinkedListError("unexpected null pointer during get");
        }

        return current;
    }

    /**
     * returns element at index without removing it
     *
     * - optimizes traversal by starting from nearest end to reduce worst-case
     *   path length from O(n) to O(n/2)
     *
     * @throws {RangeError} when index is out of bounds
     */
    public getAt(index: number): T {
        return this.getNodeAt(index).data;
    }

    /**
     * sets element at index
     *
     * - optimizes traversal by starting from nearest end to reduce worst-case
     *   path length from O(n) to O(n/2)
     *
     * @throws {RangeError} when index is out of bounds
     */
    public setAt(index: number, value: T): void {
        this.getNodeAt(index).data = value;
    }

    /**
     * returns index of first occurrence matching predicate
     *
     * - uses linear search as linked lists don't support random access
     *
     * @returns -1 when no match is found to align with array.findIndex behavior
     */
    public findIndex(fn: (data: T) => boolean): number | -1 {
        let current = this.head;
        for (let i = 0; i < this._length; i++) {
            if (current === null) return -1;
            if (fn(current.data)) return i;
            current = current.next;
        }
        return -1;
    }

    /**
     * removes all elements
     *
     * - explicitly breaks node references to prevent memory leaks
     *   and assist garbage collection with circular references
     */
    public clear(): void {
        // explicitly break references to help garbage collection
        let current = this.head;
        while (current) {
            const next = current.next;
            current.prev = current.next = null;
            current = next;
        }

        this.head = this.tail = null;
        this._length = 0;
    }

    /**
     * checks if list is empty
     *
     * - uses size tracking for O(1) check instead of head null check
     *   to maintain consistency with size property
     *
     * @returns true if list is empty, false otherwise
     */
    public isEmpty(): boolean {
        return this._length === 0;
    }

    /**
     * gets the number of elements in list
     *
     * - tracked during mutations to provide O(1) access
     *   without requiring O(n) traversal
     *
     * @returns number of elements in list
     */
    public get length(): number {
        return this._length;
    }

    /**
     * reverses the list in-place
     *
     * - swaps head/tail and all node pointers to avoid creating new nodes
     * - early return for empty or single-element lists avoids unnecessary work
     */
    public reverse(): void {
        if (this._length <= 1) {
            return;
        }

        let current = this.head;
        this.head = this.tail;
        this.tail = current;

        while (current) {
            // swap next and prev pointers
            const next = current.next;
            current.next = current.prev;
            current.prev = next;
            current = next;
        }
    }

    /**
     * implements iterable interface to enable for...of loops
     *
     * - provides forward iteration without exposing internal nodes
     * - allows list to be used with spread operator and destructuring
     */
    public [Symbol.iterator](): Iterator<T> {
        let current = this.head;
        return {
            next: () => {
                if (current) {
                    const value = current.data;
                    current = current.next;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }
}

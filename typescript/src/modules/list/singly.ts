/**
 * node in a singly linked list
 */
class Node<T> {
    public data: T;
    public next: Node<T> | null;

    constructor(data: T) {
        this.data = data;
        this.next = null;
    }
}

/**
 * singly linked list implementation
 *
 * - uses unidirectional links for memory efficiency
 * - maintains tail reference to avoid O(n) traversals for back operations
 * - tracks size internally to avoid O(n) counting operations
 */
export class SinglyLinkedList<T> implements Iterable<T> {
    private _head: Node<T> | null;
    private _tail: Node<T> | null;
    private _length: number;

    public constructor() {
        this._head = null;
        this._tail = null;
        this._length = 0;
    }

    get head() {
        return this._head;
    }

    get tail() {
        return this._tail;
    }

    /**
     * adds element to front of list
     *
     * - direct head manipulation provides O(1) performance regardless of list size
     */
    public insertFront(data: T): void {
        const newNode = new Node(data);

        if (!this._head) {
            this._head = this._tail = newNode;
        } else {
            newNode.next = this._head;
            this._head = newNode;
        }

        this._length++;
    }

    /**
     * adds element to back of list
     *
     * - tail reference enables O(1) performance regardless of list size
     */
    public insertBack(data: T): void {
        const newNode = new Node(data);

        if (!this._tail) {
            this._head = this._tail = newNode;
        } else {
            this._tail.next = newNode;
            this._tail = newNode;
        }

        this._length++;
    }

    /**
     * removes and returns element from front of list
     *
     * - direct head manipulation provides O(1) performance regardless of list size
     * - throws if list is empty
     */
    public removeFront(): T {
        if (!this._head) {
            throw new Error("cannot remove from empty list");
        }

        const removedNode = this._head;
        this._head = this._head.next;

        // if list is now empty, update tail
        if (!this._head) {
            this._tail = null;
        }

        this._length--;
        return removedNode.data;
    }

    /**
     * finds index of first element matching predicate
     *
     * - requires traversal, resulting in O(n) performance
     * - returns -1 if no match found
     */
    public findIndex(fn: (data: T) => boolean): number | -1 {
        let current = this._head;
        let index = 0;

        while (current) {
            if (fn(current.data)) {
                return index;
            }
            current = current.next;
            index++;
        }

        return -1;
    }

    /**
     * removes all elements from list
     */
    public clear(): void {
        this._head = null;
        this._tail = null;
        this._length = 0;
    }

    /**
     * checks if list is empty
     */
    public isEmpty(): boolean {
        return this._length === 0;
    }

    /**
     * gets number of elements in list
     */
    public get length(): number {
        return this._length;
    }
    /**
     * implements iterable protocol for use with for...of loops
     */
    public *[Symbol.iterator](): Iterator<T> {
        let current = this._head;
        while (current) {
            yield current.data;
            current = current.next;
        }
    }

    /**
     * converts list to array
     *
     * - requires traversal, resulting in O(n) performance
     */
    public toArray(): T[] {
        const result: T[] = [];
        let current = this._head;

        while (current) {
            result.push(current.data);
            current = current.next;
        }

        return result;
    }

    /**
     * creates string representation of list
     */
    public toString(): string {
        return `SinglyLinkedList(${this.toArray().join(" -> ")})`;
    }
}

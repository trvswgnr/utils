import { expect, test, describe } from "bun:test";
import { SinglyLinkedList as List } from "./singly";

describe("SinglyLinkedList", () => {
    // constructor tests - verify initial state is correctly established
    test("new list is empty", () => {
        const list = new List<number>();
        expect(list.isEmpty(), "newly created list should be empty").toBe(true);
        expect(list.length, "newly created list should have zero length").toBe(0);
    });

    // insertFront tests - verify head manipulation and link maintenance
    describe("insertFront", () => {
        test("insertFront on empty list", () => {
            const list = new List<number>();
            list.insertFront(1);
            expect(
                list.length,
                "list length should be 1 after inserting into empty list",
            ).toBe(1);
            expect(list.toArray()[0], "first element should be the inserted value").toBe(
                1,
            );
        });

        test("insertFront maintains order", () => {
            // elements should be in reverse order of insertion when using insertFront
            const list = new List<number>();
            list.insertFront(3);
            list.insertFront(2);
            list.insertFront(1);
            const array = list.toArray();
            expect(
                array[0],
                "first element should be the most recently inserted value",
            ).toBe(1);
            expect(array[1], "middle element should maintain correct position").toBe(2);
            expect(array[2], "last element should be the first inserted value").toBe(3);
        });
    });

    // insertBack tests - verify tail manipulation and link maintenance
    describe("insertBack", () => {
        test("insertBack on empty list", () => {
            const list = new List<number>();
            list.insertBack(1);
            expect(
                list.length,
                "list length should be 1 after inserting into empty list",
            ).toBe(1);
            expect(list.toArray()[0], "first element should be the inserted value").toBe(
                1,
            );
        });

        test("insertBack maintains order", () => {
            // elements should be in same order as insertion when using insertBack
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            const array = list.toArray();
            expect(array[0], "first element should be the first inserted value").toBe(1);
            expect(array[1], "middle element should maintain correct position").toBe(2);
            expect(
                array[2],
                "last element should be the most recently inserted value",
            ).toBe(3);
        });
    });

    // removeFront tests - verify head removal and pointer updates
    describe("removeFront", () => {
        test("removeFront throws on empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(
                () => list.removeFront(),
                "should throw with appropriate message for empty list",
            ).toThrow("cannot remove from empty list");
        });

        test("removeFront returns and removes first element", () => {
            // verify correct element is returned and removed
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            expect(list.removeFront(), "should return the first element").toBe(1);
            expect(list.length, "length should decrease by 1").toBe(1);
            expect(list.toArray()[0], "second element should become the first").toBe(2);
        });

        test("removeFront on single element list", () => {
            // verify list becomes empty when removing the only element
            const list = new List<number>();
            list.insertBack(1);
            expect(list.removeFront(), "should return the only element").toBe(1);
            expect(
                list.isEmpty(),
                "list should be empty after removing the only element",
            ).toBe(true);
        });
    });

    // findIndex tests - verify search functionality and edge cases
    describe("findIndex", () => {
        test("findIndex returns -1 for empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(
                list.findIndex((x) => x === 1),
                "should return -1 when list is empty",
            ).toBe(-1);
        });

        test("findIndex returns -1 when no match found", () => {
            // verify behavior when predicate never matches
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                list.findIndex((x) => x === 4),
                "should return -1 when no element matches predicate",
            ).toBe(-1);
        });

        test("findIndex returns correct index when match found", () => {
            // verify correct index is returned when predicate matches
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                list.findIndex((x) => x === 2),
                "should return index of matching element",
            ).toBe(1);
        });

        test("findIndex returns first matching index", () => {
            // verify first match is returned when multiple elements match
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                list.findIndex((x) => x === 2),
                "should return index of first matching element",
            ).toBe(1);
        });

        test("findIndex works with complex predicates", () => {
            // verify predicates can contain arbitrary logic
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            list.insertBack(4);
            expect(
                list.findIndex((x) => x % 2 === 0 && x > 2),
                "should work with complex predicates",
            ).toBe(3);
        });
    });

    // clear tests - verify complete list emptying behavior
    describe("clear", () => {
        test("clear empty list", () => {
            // verify clearing an already empty list is a no-op
            const list = new List<number>();
            list.clear();
            expect(list.isEmpty(), "list should remain empty after clearing").toBe(true);
            expect(list.length, "length should remain 0 after clearing empty list").toBe(
                0,
            );
        });

        test("clear non-empty list", () => {
            // verify list is properly emptied
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.clear();
            expect(list.isEmpty(), "list should be empty after clearing").toBe(true);
            expect(list.length, "length should be 0 after clearing").toBe(0);
        });
    });

    // isEmpty tests
    describe("isEmpty", () => {
        test("isEmpty returns true for empty list", () => {
            const list = new List<number>();
            expect(list.isEmpty(), "should return true for empty list").toBe(true);
        });

        test("isEmpty returns false for non-empty list", () => {
            const list = new List<number>();
            list.insertBack(1);
            expect(list.isEmpty(), "should return false for non-empty list").toBe(false);
        });

        test("isEmpty returns true after clearing", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.clear();
            expect(list.isEmpty(), "should return true after clearing").toBe(true);
        });

        test("isEmpty returns true after removing all elements", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.removeFront();
            expect(list.isEmpty(), "should return true after removing all elements").toBe(
                true,
            );
        });
    });

    // length tests
    describe("length", () => {
        test("length returns 0 for empty list", () => {
            const list = new List<number>();
            expect(list.length, "should return 0 for empty list").toBe(0);
        });

        test("length returns correct value after insertions", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            expect(list.length, "should return correct length after insertions").toBe(2);
        });

        test("length returns correct value after removals", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.removeFront();
            expect(list.length, "should return correct length after removal").toBe(1);
        });

        test("length returns 0 after clearing", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.clear();
            expect(list.length, "should return 0 after clearing").toBe(0);
        });
    });

    // toArray tests
    describe("toArray", () => {
        test("toArray returns empty array for empty list", () => {
            const list = new List<number>();
            expect(list.toArray(), "should return empty array for empty list").toEqual(
                [],
            );
        });

        test("toArray returns correct array for non-empty list", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                list.toArray(),
                "should return array with all elements in order",
            ).toEqual([1, 2, 3]);
        });
    });

    // toString tests
    describe("toString", () => {
        test("toString returns correct representation for empty list", () => {
            const list = new List<number>();
            expect(list.toString(), "should return correct string for empty list").toBe(
                "SinglyLinkedList()",
            );
        });

        test("toString returns correct representation for non-empty list", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(list.toString(), "should return correct string representation").toBe(
                "SinglyLinkedList(1 -> 2 -> 3)",
            );
        });
    });

    // iterator tests - verify iterable protocol implementation
    describe("iterator", () => {
        test("iterates over list", () => {
            // verify manual iteration works correctly
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            const result = [];
            for (const value of list) {
                result.push(value);
            }
            expect(result, "iterator should yield all elements in correct order").toEqual(
                [1, 2, 3],
            );
        });

        test("iterator works with empty list", () => {
            // verify iteration over empty list doesn't cause errors
            const list = new List<number>();
            const result = [];
            for (const value of list) {
                result.push(value);
            }
            expect(result, "iterator should yield no elements for empty list").toEqual(
                [],
            );
        });

        test("iterator works with spread operator", () => {
            // verify spread operator works with list iterator
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                [...list],
                "spread operator should convert list to array with all elements",
            ).toEqual([1, 2, 3]);
        });
    });

    // type safety tests - verify generic implementation correctness
    describe("type safety", () => {
        test("works with numbers", () => {
            // verify list works with number type
            const list = new List<number>();
            list.insertBack(1);
            expect(list.toArray()[0], "should store and retrieve numbers correctly").toBe(
                1,
            );
        });

        test("works with strings", () => {
            // verify list works with string type
            const list = new List<string>();
            list.insertBack("hello");
            expect(list.toArray()[0], "should store and retrieve strings correctly").toBe(
                "hello",
            );
        });

        test("works with objects", () => {
            // verify list works with object type
            const list = new List<{ x: number }>();
            list.insertBack({ x: 1 });
            expect(
                list.toArray()[0],
                "should store and retrieve objects correctly",
            ).toEqual({
                x: 1,
            });
        });

        test("works with mixed types via union", () => {
            // verify list works with union types
            const list = new List<number | string>();
            list.insertBack(1);
            list.insertBack("hello");
            const array = list.toArray();
            expect(array[0], "should store and retrieve first union type correctly").toBe(
                1,
            );
            expect(
                array[1],
                "should store and retrieve second union type correctly",
            ).toBe("hello");
        });

        test("doesn't accept different types", () => {
            // verify type safety at compile time
            const list = new List<number>();
            list.insertBack(1); // ok

            // @ts-expect-error - string not assignable to number
            list.insertBack("hello");
        });
    });

    // complex operations tests - verify behavior under multiple sequential operations
    describe("complex operations", () => {
        test("maintains correct size through multiple operations", () => {
            // verify size tracking remains accurate through various operations
            const list = new List<number>();
            list.insertBack(1);
            list.insertFront(2);
            expect(list.length, "length should be 2 after two insertions").toBe(2);
            list.removeFront();
            expect(list.length, "length should be 1 after one removal").toBe(1);
            list.clear();
            expect(list.length, "length should be 0 after clearing").toBe(0);
        });

        test("maintains correct order through multiple operations", () => {
            // verify element order remains correct through various operations
            const list = new List<number>();
            list.insertBack(1);
            list.insertFront(2);
            list.insertBack(3);
            expect(
                list.toArray(),
                "elements should be in correct order after multiple operations",
            ).toEqual([2, 1, 3]);
        });
    });

    // head and tail accessor tests
    describe("head and tail accessors", () => {
        test("head and tail are null for empty list", () => {
            const list = new List<number>();
            expect(list.head, "head should be null for empty list").toBe(null);
            expect(list.tail, "tail should be null for empty list").toBe(null);
        });

        test("head and tail point to same node for single element list", () => {
            const list = new List<number>();
            list.insertBack(1);
            expect(list.head?.data, "head should contain the only element").toBe(1);
            expect(list.tail?.data, "tail should contain the only element").toBe(1);
        });

        test("head and tail point to correct nodes for multi-element list", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(list.head?.data, "head should point to first element").toBe(1);
            expect(list.tail?.data, "tail should point to last element").toBe(3);
        });

        test("head and tail update correctly after removeFront", () => {
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.removeFront();
            expect(list.head?.data, "head should update after removeFront").toBe(2);
            expect(
                list.tail?.data,
                "tail should update correctly after removeFront",
            ).toBe(2);
        });
    });
});

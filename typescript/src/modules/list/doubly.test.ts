import { expect, test, describe } from "bun:test";
import { LinkedListError } from "./error";
import { DoublyLinkedList as List } from "./doubly";

describe("DoublyLinkedList", () => {
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
            expect(list.getAt(0), "first element should be the inserted value").toBe(1);
        });

        test("insertFront maintains order", () => {
            // elements should be in reverse order of insertion when using insertFront
            const list = new List<number>();
            list.insertFront(3);
            list.insertFront(2);
            list.insertFront(1);
            expect(
                list.getAt(0),
                "first element should be the most recently inserted value",
            ).toBe(1);
            expect(list.getAt(1), "middle element should maintain correct position").toBe(
                2,
            );
            expect(list.getAt(2), "last element should be the first inserted value").toBe(
                3,
            );
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
            expect(list.getAt(0), "first element should be the inserted value").toBe(1);
        });

        test("insertBack maintains order", () => {
            // elements should be in same order as insertion when using insertBack
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(
                list.getAt(0),
                "first element should be the first inserted value",
            ).toBe(1);
            expect(list.getAt(1), "middle element should maintain correct position").toBe(
                2,
            );
            expect(
                list.getAt(2),
                "last element should be the most recently inserted value",
            ).toBe(3);
        });
    });

    // insertAt tests - verify arbitrary position insertion and boundary checks
    describe("insertAt", () => {
        test("insertAt beginning", () => {
            // insertAt(0) should behave like insertFront
            const list = new List<number>();
            list.insertAt(0, 1);
            expect(list.getAt(0), "element should be inserted at beginning of list").toBe(
                1,
            );
        });

        test("insertAt end", () => {
            // insertAt(length) should behave like insertBack
            const list = new List<number>();
            list.insertBack(1);
            list.insertAt(1, 2);
            expect(list.getAt(1), "element should be inserted at end of list").toBe(2);
        });

        test("insertAt middle", () => {
            // verify correct linking when inserting between existing nodes
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(3);
            list.insertAt(1, 2);
            expect(list.getAt(0), "first element should remain unchanged").toBe(1);
            expect(
                list.getAt(1),
                "new element should be inserted at specified position",
            ).toBe(2);
            expect(list.getAt(2), "subsequent elements should be shifted").toBe(3);
        });

        test("insertAt throws on negative index", () => {
            // verify boundary checking for negative indices
            const list = new List<number>();
            expect(
                () => list.insertAt(-1, 1),
                "negative indices should throw RangeError",
            ).toThrow(RangeError);
        });

        test("insertAt throws on out of bounds index", () => {
            // verify boundary checking for indices beyond list length
            const list = new List<number>();
            expect(
                () => list.insertAt(1, 1),
                "indices beyond list length should throw RangeError",
            ).toThrow(RangeError);
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
            expect(list.getAt(0), "second element should become the first").toBe(2);
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

    // removeBack tests - verify tail removal and pointer updates
    describe("removeBack", () => {
        test("removeBack throws on empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(
                () => list.removeBack(),
                "should throw with appropriate message for empty list",
            ).toThrow("cannot remove from empty list");
        });

        test("removeBack returns and removes last element", () => {
            // verify correct element is returned and removed
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            expect(list.removeBack(), "should return the last element").toBe(2);
            expect(list.length, "length should decrease by 1").toBe(1);
            expect(list.getAt(0), "first element should remain unchanged").toBe(1);
        });

        test("removeBack on single element list", () => {
            // verify list becomes empty when removing the only element
            const list = new List<number>();
            list.insertBack(1);
            expect(list.removeBack(), "should return the only element").toBe(1);
            expect(
                list.isEmpty(),
                "list should be empty after removing the only element",
            ).toBe(true);
        });
    });

    // removeAt tests - verify arbitrary position removal and boundary checks
    describe("removeAt", () => {
        test("removeAt throws on empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(
                () => list.removeAt(0),
                "should throw RangeError for empty list",
            ).toThrow(RangeError);
        });

        test("removeAt throws on negative index", () => {
            // verify boundary checking for negative indices
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.removeAt(-1),
                "negative indices should throw RangeError",
            ).toThrow(RangeError);
        });

        test("removeAt throws on out of bounds index", () => {
            // verify boundary checking for indices beyond list length
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.removeAt(1),
                "indices beyond list length should throw RangeError",
            ).toThrow(RangeError);
        });

        test("removeAt beginning", () => {
            // verify removeAt(0) behaves like removeFront
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            expect(list.removeAt(0), "should return the first element").toBe(1);
            expect(list.length, "length should decrease by 1").toBe(1);
            expect(list.getAt(0), "second element should become the first").toBe(2);
        });

        test("removeAt end", () => {
            // verify removeAt(length-1) behaves like removeBack
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            expect(list.removeAt(1), "should return the last element").toBe(2);
            expect(list.length, "length should decrease by 1").toBe(1);
            expect(list.getAt(0), "first element should remain unchanged").toBe(1);
        });

        test("removeAt middle", () => {
            // verify correct linking when removing a middle node
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(list.removeAt(1), "should return the middle element").toBe(2);
            expect(list.length, "length should decrease by 1").toBe(2);
            expect(list.getAt(0), "first element should remain unchanged").toBe(1);
            expect(list.getAt(1), "third element should become the second").toBe(3);
        });
    });

    // getAt tests - verify element access and boundary checks
    describe("get", () => {
        test("get throws on empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(() => list.getAt(0), "should throw RangeError for empty list").toThrow(
                RangeError,
            );
        });

        test("get throws on negative index", () => {
            // verify boundary checking for negative indices
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.getAt(-1),
                "negative indices should throw RangeError",
            ).toThrow(RangeError);
        });

        test("get throws on out of bounds index", () => {
            // verify boundary checking for indices beyond list length
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.getAt(1),
                "indices beyond list length should throw RangeError",
            ).toThrow(RangeError);
        });

        test("get returns correct elements", () => {
            // verify correct elements are returned at each position
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            expect(list.getAt(0), "should return correct element at index 0").toBe(1);
            expect(list.getAt(1), "should return correct element at index 1").toBe(2);
            expect(list.getAt(2), "should return correct element at index 2").toBe(3);
        });
    });

    // setAt tests - verify element update and boundary checks
    describe("setAt", () => {
        test("setAt throws on empty list", () => {
            // verify empty list handling
            const list = new List<number>();
            expect(
                () => list.setAt(0, 1),
                "should throw RangeError for empty list",
            ).toThrow(RangeError);
        });

        test("setAt throws on negative index", () => {
            // verify boundary checking for negative indices
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.setAt(-1, 2),
                "negative indices should throw RangeError",
            ).toThrow(RangeError);
        });

        test("setAt throws on out of bounds index", () => {
            // verify boundary checking for indices beyond list length
            const list = new List<number>();
            list.insertBack(1);
            expect(
                () => list.setAt(1, 2),
                "indices beyond list length should throw RangeError",
            ).toThrow(RangeError);
        });

        test("setAt updates element at index", () => {
            // verify element is updated without changing list structure
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            list.setAt(1, 42);
            expect(list.getAt(0), "first element should remain unchanged").toBe(1);
            expect(list.getAt(1), "element at specified index should be updated").toBe(
                42,
            );
            expect(list.getAt(2), "other elements should remain unchanged").toBe(3);
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

    // reverse tests - verify in-place reversal and pointer rewiring
    describe("reverse", () => {
        test("reverse empty list", () => {
            // verify reversing an empty list is a no-op
            const list = new List<number>();
            list.reverse();
            expect(list.isEmpty(), "empty list should remain empty after reversing").toBe(
                true,
            );
        });

        test("reverse single element list", () => {
            // verify reversing a single-element list is a no-op
            const list = new List<number>();
            list.insertBack(1);
            list.reverse();
            expect(
                list.getAt(0),
                "single element should remain unchanged after reversing",
            ).toBe(1);
        });

        test("reverse multiple elements", () => {
            // verify elements are properly reversed
            const list = new List<number>();
            list.insertBack(1);
            list.insertBack(2);
            list.insertBack(3);
            list.reverse();
            expect(
                list.getAt(0),
                "last element should become first after reversing",
            ).toBe(3);
            expect(
                list.getAt(1),
                "middle element should remain in middle after reversing",
            ).toBe(2);
            expect(
                list.getAt(2),
                "first element should become last after reversing",
            ).toBe(1);
        });
    });

    // type safety tests - verify generic implementation correctness
    describe("type safety", () => {
        test("works with numbers", () => {
            // verify list works with number type
            const list = new List<number>();
            list.insertBack(1);
            expect(list.getAt(0), "should store and retrieve numbers correctly").toBe(1);
        });

        test("works with strings", () => {
            // verify list works with string type
            const list = new List<string>();
            list.insertBack("hello");
            expect(list.getAt(0), "should store and retrieve strings correctly").toBe(
                "hello",
            );
        });

        test("works with objects", () => {
            // verify list works with object type
            const list = new List<{ x: number }>();
            list.insertBack({ x: 1 });
            expect(list.getAt(0), "should store and retrieve objects correctly").toEqual({
                x: 1,
            });
        });

        test("works with mixed types via union", () => {
            // verify list works with union types
            const list = new List<number | string>();
            list.insertBack(1);
            list.insertBack("hello");
            expect(
                list.getAt(0),
                "should store and retrieve first union type correctly",
            ).toBe(1);
            expect(
                list.getAt(1),
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
            list.insertAt(1, 3);
            expect(list.length, "length should be 3 after three insertions").toBe(3);
            list.removeFront();
            list.removeBack();
            expect(list.length, "length should be 1 after two removals").toBe(1);
            list.clear();
            expect(list.length, "length should be 0 after clearing").toBe(0);
        });

        test("maintains correct order through multiple operations", () => {
            // verify element order remains correct through various operations
            const list = new List<number>();
            list.insertBack(1);
            list.insertFront(2);
            list.insertAt(1, 3);
            list.reverse();
            expect(
                list.getAt(0),
                "elements should be in correct order after multiple operations",
            ).toBe(1);
            expect(
                list.getAt(1),
                "elements should be in correct order after multiple operations",
            ).toBe(3);
            expect(
                list.getAt(2),
                "elements should be in correct order after multiple operations",
            ).toBe(2);
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

    // error handling tests - validate custom error types and messages
    describe("LinkedListError", () => {
        test("throws LinkedListError for empty list operations", () => {
            // verify custom error type is used for list-specific errors
            const list = new List<number>();
            const fn = () => list.removeFront();
            expect(fn).toThrow(LinkedListError);
            expect(fn).toThrow("cannot remove from empty list");
        });
    });
});

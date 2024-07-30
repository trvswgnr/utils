import { describe, test, expect } from "bun:test";
import { Either, Left, Right } from "./either";
import { id } from "./identity";
import { compose } from "./compose";

describe("Either", () => {
    describe("Functor", () => {
        test("Identity: `fmap id = id`", () => {
            // Test with Left value
            {
                const v = Left(5);
                const l = Either.fmap(id)(v);
                const r = id(v);
                expect(l).toEqual(r);
            }

            // Test with Right value
            {
                const v = Right(5);
                const l = Either.fmap(id)(v);
                const r = id(v);
                expect(l).toEqual(r);
            }
        });

        test("Composition: `fmap (f . g) = fmap f . fmap g`", () => {
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 1;

            // Test with Left value
            {
                const v: Either<number, number> = Left(5);
                const l = Either.fmap(compose(f, g))(v);
                const r = compose<any, any, any>(
                    Either.fmap(f),
                    Either.fmap(g),
                )(v);
                expect(l).toEqual(r);
            }

            // Test with Right value
            {
                const v: Either<number, number> = Right(5);
                const l = Either.fmap(compose(f, g))(v);
                const r = compose<any, any, any>(
                    Either.fmap(f),
                    Either.fmap(g),
                )(v);
                expect(l).toEqual(r);
            }

            // Additional test with different functions
            {
                const v = Right(5);
                const h = (x: number) => x.toString();
                const l = Either.fmap(compose(h, compose(f, g)))(v);
                const r = compose<any, any, any>(
                    Either.fmap(h),
                    compose<any, any, any>(Either.fmap(f), Either.fmap(g)),
                )(v);
                expect(l).toEqual(r);
            }
        });
    });
});

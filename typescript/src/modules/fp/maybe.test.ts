import { Maybe, Just, Nothing } from "./maybe";
import { compose } from "./compose";
import { id } from "./identity";
import { describe, test, expect } from "bun:test";

describe("Maybe", () => {
    describe("Functor", () => {
        test("Identity: `fmap id = id`", () => {
            // Test with Just value
            {
                const v = Just(5);
                const l = Maybe.fmap(id)(v);
                const r = id(v);
                expect(l).toEqual(r);
            }

            // Test with Nothing value
            {
                const v = Nothing<number>();
                const l = Maybe.fmap(id)(v);
                const r = id(v);
                expect(l).toEqual(r);
            }
        });

        test("Composition: `fmap (f . g) = fmap f . fmap g`", () => {
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 1;

            // Test with Just value
            {
                const v = Just(5);
                const l = Maybe.fmap(compose(f, g))(v);
                const r = compose(Maybe.fmap(f), Maybe.fmap(g))(v);
                expect(l).toEqual(r);
            }

            // Test with Nothing value
            {
                const v = Nothing<number>();
                const l = Maybe.fmap(compose(f, g))(v);
                const r = compose(Maybe.fmap(f), Maybe.fmap(g))(v);
                expect(l).toEqual(r);
            }

            // Additional test with different functions
            {
                const v = Just(5);
                const h = (x: number) => x.toString();
                const l = Maybe.fmap(compose(h, compose(f, g)))(v);
                const r = compose(
                    Maybe.fmap(h),
                    compose(Maybe.fmap(f))(Maybe.fmap(g)),
                )(v);
                expect(l).toEqual(r);
            }
        });
    });

    describe("Applicative", () => {
        test("Identity: `pure id <*> v = v`", () => {
            // Test with Just value
            {
                const v = Just(5);
                const l = Maybe.ap(Maybe.pure(id<number>))(v);
                const r = v;
                expect(l).toEqual(r);
            }

            // Test with Nothing value
            {
                const v = Nothing<number>();
                const l = Maybe.ap(Maybe.pure(id<number>))(v);
                const r = v;
                expect(l).toEqual(r);
            }
        });

        test("Composition: `pure (.) <*> u <*> v <*> w = u <*> (v <*> w)`", () => {
            const u = Just((x: number) => x * 2);
            const v = Just((x: number) => x + 1);
            const w = Just(5);

            const compose =
                (f: (b: number) => number) =>
                (g: (a: number) => number) =>
                (x: number) =>
                    f(g(x));
            const l = Maybe.ap(Maybe.ap(Maybe.ap(Maybe.pure(compose))(u))(v))(
                w,
            );
            const r = Maybe.ap(u)(Maybe.ap(v)(w));

            expect(l).toEqual(r);

            // Test with Nothing values
            const nothingU = Nothing<(x: number) => number>();
            const nothingV = Nothing<(x: number) => number>();
            const nothingW = Nothing<number>();

            expect(
                Maybe.ap(Maybe.ap(Maybe.ap(Maybe.pure(compose))(nothingU))(v))(
                    w,
                ),
            ).toEqual(Maybe.ap(nothingU)(Maybe.ap(v)(w)));
            expect(
                Maybe.ap(Maybe.ap(Maybe.ap(Maybe.pure(compose))(u))(nothingV))(
                    w,
                ),
            ).toEqual(Maybe.ap(u)(Maybe.ap(nothingV)(w)));
            expect(
                Maybe.ap(Maybe.ap(Maybe.ap(Maybe.pure(compose))(u))(v))(
                    nothingW,
                ),
            ).toEqual(Maybe.ap(u)(Maybe.ap(v)(nothingW)));
        });

        test("Homomorphism: `pure f <*> pure x = pure (f x)`", () => {
            const f = (x: number) => x * 2;
            const x = 5;

            {
                const l = Maybe.ap(Maybe.pure(f))(Maybe.pure(x));
                const r = Maybe.pure(f(x));
                expect(l).toEqual(r);
            }

            // Test with different function and value
            const g = (s: string) => s.length;
            const y = "hello darkness my old friend";

            {
                const l = Maybe.ap(Maybe.pure(g))(Maybe.pure(y));
                const r = Maybe.pure(g(y));

                expect(l).toEqual(r);
            }
        });

        test("Interchange: `u <*> pure y = pure ($ y) <*> u`", () => {
            // Test with Just value
            {
                const u = Just((x: number) => x * 2);
                const y = 5;
                const $y = (f: (x: number) => number) => f(y);
                const l = Maybe.ap(u)(Maybe.pure(y));
                const r = Maybe.ap(Maybe.pure($y))(u);
                expect(l).toEqual(r);
            }

            // Test with Nothing value
            {
                const u = Nothing<(x: number) => number>();
                const y = 5;
                const $y = (f: (x: number) => number) => f(y);
                const l = Maybe.ap(u)(Maybe.pure(y));
                const r = Maybe.ap(Maybe.pure($y))(u);
                expect(l).toEqual(r);
            }

            // Test with different function and value
            {
                const u = Just((s: string) => s.length);
                const y = "hello darkness my old friend";
                const $y = (f: (s: string) => number) => f(y);
                const l = Maybe.ap(u)(Maybe.pure(y));
                const r = Maybe.ap(Maybe.pure($y))(u);
                expect(l).toEqual(r);
            }
        });
    });

    describe("instance works the same as static", () => {
        test("fmap", () => {
            const a = Just(1);
            const b = a.fmap((x) => x + 1);
            const c = Maybe.fmap((x: number) => x + 1)(a);
            expect(b).toEqual(c);
        });
        test("ap", () => {
            const a = Just((x: number) => x + 1);
            const b = Just(2);
            const c = Maybe.ap(a)(b);
            const d = b.ap(a);
            expect(c).toEqual(d);
        });
        test("pure", () => {
            const a = 1;
            const b = Maybe.pure(a);
            const c = Just(a);
            expect(b).toEqual(c);
        });
        test("return", () => {
            const a = 1;
            const b = Maybe.return(a);
            const c = Just(a);
            expect(b).toEqual(c);
        });
        test("bind", () => {
            const a = Just(1);
            const b = a.bind((x) => Just(x + 1));
            const c = Maybe.bind(a)((x) => Just(x + 1));
            expect(b).toEqual(c);
        });
    });
});

import * as HKT from "./hkt";

// export type MatchFn<
//     F extends HKT.Kind,
//     M extends { [k: PropertyKey]: <B>(...args: any[]) => B },
// > = <In, Out, A, B>(fa: HKT.Type<F, In, Out, A>) => (matchers: M) => B;

export interface Match<F extends HKT.Kind> extends HKT.Class<F> {
    <In, Out, A>(fa: HKT.Type<F, In, Out, A>): <
        B,
        M extends { [k: PropertyKey]: <B>(...args: any[]) => B },
    >(
        matchers: M,
    ) => B;
}

export interface MatchInstance<F extends HKT.Kind> extends HKT.Class<F> {
    match<
        In,
        Out,
        A,
        B,
        M extends { [k: PropertyKey]: <B>(...args: any[]) => B },
    >(
        this: HKT.Type<F, In, Out, A>,
        matchers: M,
    ): B;
}

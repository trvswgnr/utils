import type * as HKT from "./hkt";

export interface Monad<F extends HKT.Kind> extends HKT.Class<F> {
    return: <In, Out, A>(a: A) => HKT.Type<F, In, Out, A>;
    flatMap: <In, Out, A, B>(
        ma: HKT.Type<F, In, Out, A>,
        f: (a: A) => HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    then?: <In, Out, A, B>(
        ma: HKT.Type<F, In, Out, A>,
        mb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
}

export interface MonadInstance<F extends HKT.Kind> extends HKT.Class<F> {
    flatMap: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        f: (a: A) => HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    then?: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        mb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
}

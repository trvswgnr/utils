import type * as HKT from "./hkt";

export interface Monad<F extends HKT.Kind> extends HKT.Class<F> {
    return: <In, Out, A>(a: A) => HKT.Type<F, In, Out, A>;
    bind: <In, Out, A>(
        ma: HKT.Type<F, In, Out, A>,
    ) => <B>(f: (a: A) => HKT.Type<F, In, Out, B>) => HKT.Type<F, In, Out, B>;
    then?: <In, Out, A>(
        ma: HKT.Type<F, In, Out, A>,
    ) => <B>(mb: HKT.Type<F, In, Out, B>) => HKT.Type<F, In, Out, B>;
}

export interface MonadInstance<F extends HKT.Kind> extends HKT.Class<F> {
    bind: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        f: (a: A) => HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
    then?: <In, Out, A, B>(
        this: HKT.Type<F, In, Out, A>,
        mb: HKT.Type<F, In, Out, B>,
    ) => HKT.Type<F, In, Out, B>;
}

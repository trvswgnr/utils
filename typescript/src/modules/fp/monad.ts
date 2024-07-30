import type * as HKT from "./hkt";

export interface Monad<F extends HKT.Kind> extends HKT.Class<F> {
    return: <In, Out2, Out1, A>(a: A) => HKT.Type<F, In, Out2, Out1, A>;
    bind: <In, Out2, Out1, A>(
        ma: HKT.Type<F, In, Out2, Out1, A>,
    ) => <B>(f: (a: A) => HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, B>;
    then?: <In, Out2, Out1, A>(
        ma: HKT.Type<F, In, Out2, Out1, A>,
    ) => <B>(mb: HKT.Type<F, In, Out2, Out1, B>) => HKT.Type<F, In, Out2, Out1, B>;
}

export interface MonadInstance<F extends HKT.Kind> extends HKT.Class<F> {
    bind: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        f: (a: A) => HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
    then?: <In, Out2, Out1, A, B>(
        this: HKT.Type<F, In, Out2, Out1, A>,
        mb: HKT.Type<F, In, Out2, Out1, B>,
    ) => HKT.Type<F, In, Out2, Out1, B>;
}

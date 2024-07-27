import type * as HKT from "./hkt";
import type { Applicative, BoundApplicative } from "./applicative";

export interface Monad<F extends HKT.Kind> extends Applicative<F> {
    return: <R, O, E, A>(a: A) => HKT.Type<F, R, O, E, A>;
    then?: <R, O, E, A, B>(
        ma: HKT.Type<F, R, O, E, A>,
        mb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    bind: <R, O, E, A, B>(
        ma: HKT.Type<F, R, O, E, A>,
        f: (a: A) => HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
}

export interface BoundMonad<F extends HKT.Kind> extends BoundApplicative<F> {
    bind: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        f: (a: A) => HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
    then?: <R, O, E, A, B>(
        this: HKT.Type<F, R, O, E, A>,
        mb: HKT.Type<F, R, O, E, B>,
    ) => HKT.Type<F, R, O, E, B>;
}

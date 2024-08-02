import type { Applicative, ApplicativeInstance } from "./applicative";
import type * as HKT from "./hkt";
import { Just, Maybe, Nothing, type MaybeKind } from "./maybe";

export interface Monad<M extends HKT.Kind> extends Applicative<M> {
    return: <In, Out2, Out1, A>(a: A) => HKT.Type<M, In, Out2, Out1, A>;
    bind: <In, Out2, Out1, A>(
        ma: HKT.Type<M, In, Out2, Out1, A>,
    ) => <B>(
        f: (a: A) => HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
    then?: <In, Out2, Out1, A>(
        ma: HKT.Type<M, In, Out2, Out1, A>,
    ) => <B>(
        mb: HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
}

export interface MonadInstance<M extends HKT.Kind>
    extends ApplicativeInstance<M> {
    bind: <In, Out2, Out1, A, B>(
        this: HKT.Type<M, In, Out2, Out1, A>,
        f: (a: A) => HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
    then?: <In, Out2, Out1, A, B>(
        this: HKT.Type<M, In, Out2, Out1, A>,
        mb: HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
}

export const bind = <M extends HKT.Kind>(m: Monad<M>) => m.bind;
export const then = <M extends HKT.Kind>(m: Monad<M>) => m.then;

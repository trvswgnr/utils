import type { RequireOne } from "~/types";
import type { ApplicativeStatic, ApplicativeInstance } from "./applicative";
import type * as HKT from "./hkt";

export type Monad<M extends HKT.Kind> = RequireOne<MonadStatic<M>, "bind">;

export interface MonadStatic<M extends HKT.Kind> extends ApplicativeStatic<M> {
    return?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        a: A,
    ) => HKT.Type<M, In, Out2, Out1, A>;
    bind?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        ma: HKT.Type<M, In, Out2, Out1, A>,
    ) => <B>(
        f: (a: A) => HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
    then?: <A = unknown, Out1 = unknown, Out2 = unknown, In = unknown>(
        ma: HKT.Type<M, In, Out2, Out1, A>,
    ) => <B>(
        mb: HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
}

export interface MonadInstance<M extends HKT.Kind>
    extends ApplicativeInstance<M> {
    bind: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<M, In, Out2, Out1, A>,
        f: (a: A) => HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
    then?: <
        A = unknown,
        B = unknown,
        Out1 = unknown,
        Out2 = unknown,
        In = unknown,
    >(
        this: HKT.Type<M, In, Out2, Out1, A>,
        mb: HKT.Type<M, In, Out2, Out1, B>,
    ) => HKT.Type<M, In, Out2, Out1, B>;
}

export const bind = <M extends HKT.Kind>(
    m: RequireOne<MonadStatic<M>, "bind">,
) => m.bind;
export const then = <M extends HKT.Kind>(
    m: RequireOne<MonadStatic<M>, "then">,
) => m.then;

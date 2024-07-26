import { Either } from "../either";
import { BAIL } from "../misc";

type Bailable<T, E> =
    | {
          [BAIL]: false;
          [Symbol.iterator](): Generator<never, T, unknown>;
      }
    | {
          [BAIL]: true;
          [Symbol.iterator](): Generator<Bailable<T, E>, never, unknown>;
      };

function isFailure<E, T>(b: Bailable<T, E>): b is Bailable<never, E> {
    return b[BAIL] === true;
}

function success<T>(value: T): Bailable<T, never> {
    return {
        [BAIL]: false,
        *[Symbol.iterator](): Generator<never, T, unknown> {
            return value;
        },
    };
}

function run<E, T, Output extends Bailable<T, E>>(
    genFn: () => Generator<Output, T>,
): Output {
    const iter = genFn();
    const result = step(iter, null);
    if (isFailure(result)) return result as Output;
    return success(result) as Output;
}

function step<E, T>(
    iter: Generator<Bailable<T, E>, T, unknown>,
    value: Bailable<T, E> | null,
): Bailable<T, E> {
    const result = iter.next(value);
    if (result.done) return result.value as Bailable<T, E>;
    if (isFailure(result.value)) return result.value;
    return step(iter, result.value);
}

function mayFail1(succeed: boolean): Either<string, number> {
    return succeed ? Either.right(10) : Either.left("Failed in mayFail1");
}

function mayFail2(succeed: boolean): Either<string, number> {
    return succeed ? Either.right(20) : Either.left("Failed in mayFail2");
}

function myFuncSuccess(): Either<string, number> {
    return run(function* () {
        const a = yield* mayFail1(true);
        const b = yield* mayFail2(true);
        return a + b;
    });
}

function myFuncFailure(): Either<string, number> {
    return run(function* () {
        const a = yield* mayFail1(false);
        const b = yield* mayFail2(true);
        return a + b;
    });
}

const s = myFuncSuccess();
if (Either.isRight(s)) {
    const x = Either.value(s);
    console.log(x);
}

const f = myFuncFailure();
if (Either.isLeft(f)) {
    const x = Either.value(f);
    console.log(x);
}

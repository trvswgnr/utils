import { BAIL } from "../misc";

export { Either, Left, Right };

const TYPE = Symbol("TYPE");
const LEFT = Symbol("LEFT");
const RIGHT = Symbol("RIGHT");
const VALUE = Symbol("VALUE");

/**
 * usually used to represent the error case
 */
type Left<L> = {
    [BAIL]: true;
    [TYPE]: typeof LEFT;
    [VALUE]: L;
    [Symbol.iterator](): Generator<Left<L>, never, unknown>;
};

function Left<L>(value: L): Either<L, never> {
    const left: Left<L> = {
        [BAIL]: true,
        [TYPE]: LEFT,
        [VALUE]: value,
        *[Symbol.iterator](): Generator<Left<L>, never, unknown> {
            yield left;
            throw new Error("Unreachable");
        },
    };
    return left;
}

/**
 * usually used to represent the success case
 */
type Right<R> = {
    [BAIL]: false;
    [TYPE]: typeof RIGHT;
    [VALUE]: R;
    [Symbol.iterator](): Generator<never, R, unknown>;
};
function Right<R>(value: R): Either<never, R> {
    const right: Right<R> = {
        [BAIL]: false,
        [TYPE]: RIGHT,
        [VALUE]: value,
        *[Symbol.iterator](): Generator<never, R, unknown> {
            yield right[VALUE] as never;
            throw new Error("Unreachable");
        },
    };
    return right;
}

type Either<L, R> = Left<L> | Right<R>;

namespace Either {
    export function left<L>(value: L): Either<L, never> {
        return Left(value);
    }

    export function right<R>(value: R): Either<never, R> {
        return Right(value);
    }

    export function value<L, R>(value: Either<L, R>): L | R {
        return value[VALUE] as any;
    }

    export function isLeft<L, R>(
        value: Either<L, R>,
    ): value is Either<L, never> {
        return value[TYPE] === LEFT;
    }

    export function isRight<L, R>(
        value: Either<L, R>,
    ): value is Either<never, R> {
        return value[TYPE] === RIGHT;
    }

    export function getLeft<L, R>(value: Either<L, R>): L {
        if (isLeft(value)) {
            return value[VALUE];
        }
        throw new Error("Value is not Left");
    }

    export function getRight<L, R>(value: Either<L, R>): R {
        if (isRight(value)) {
            return value[VALUE];
        }
        throw new Error("Value is not Right");
    }

    export function getLeftOr<L, R>(value: Either<L, R>, defaultValue: L): L {
        return isLeft(value) ? value[VALUE] : defaultValue;
    }

    export function getRightOr<L, R>(value: Either<L, R>, defaultValue: R): R {
        return isRight(value) ? value[VALUE] : defaultValue;
    }

    export function mapLeft<L, R, NewL>(
        value: Either<L, R>,
        f: (value: L) => NewL,
    ): Either<NewL, R> {
        return isLeft(value) ? Left(f(value[VALUE])) : value;
    }

    export function mapRight<L, R, NewR>(
        value: Either<L, R>,
        f: (value: R) => NewR,
    ): Either<L, NewR> {
        return isRight(value) ? Right(f(value[VALUE])) : value;
    }

    export function match<L, R, A, B>(
        value: Either<L, R>,
        fns: {
            Left: (value: L) => A;
            Right: (value: R) => B;
        },
    ): A | B {
        return isLeft(value) ? fns.Left(value[VALUE]) : fns.Right(value[VALUE]);
    }
}

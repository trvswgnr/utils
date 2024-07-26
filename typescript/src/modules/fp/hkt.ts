/**
 * Represents the structure of a higher-kinded type
 */
export interface Kind {
    /**
     * `In1` is contravariant, meaning it can be used for operations that can
     * accept an input that is wider than the original type
     */
    readonly In1: unknown;
    /**
     * `In2` is contravariant, meaning it can be used for operations that can
     * accept an input that is wider than the original type
     */
    readonly In2: unknown;
    /**
     * `Out1` is covariant, meaning it can be used for operations that return a
     * result that is narrower than the original type.
     */
    readonly Out1: unknown;
    /**
     * `Out2` is covariant, meaning it can be used for operations that return a
     * result that is narrower than the original type
     */
    readonly Out2: unknown;
    /**
     * `Target` is invariant, meaning it can be used for operations that do not
     * change the type of the input or output
     */
    readonly Target: unknown;
}

/**
 * Represents a higher-kinded type with optional type parameters
 * @template F - The base Kind
 * @template In1 - The first contravariant input type (default: never)
 * @template In2 - The second contravariant input type (default: never)
 * @template Out1 - The first covariant output type (default: never)
 * @template Out2 - The second covariant output type (default: never)
 * @template Target - The invariant target type (default: never)
 */
export type Type<
    F extends Kind,
    In1 = never,
    In2 = never,
    Out1 = never,
    Out2 = never,
    Target = never,
> = F extends {
    readonly type: unknown;
}
    ? (F & {
          readonly In1: In1;
          readonly In2: In2;
          readonly Out1: Out1;
          readonly Out2: Out2;
          readonly Target: Target;
      })["type"]
    : {
          readonly F: F;
          readonly In1: ContravariantOp<In1>;
          readonly In2: ContravariantOp<In2>;
          readonly Out1: CovariantOp<Out1>;
          readonly Out2: CovariantOp<Out2>;
          readonly Target: InvariantOp<Target>;
      };

/**
 * A unique symbol used as a key for the KIND property
 */
export declare const KIND: unique symbol;

/**
 * Represents a class that can be used with higher-kinded types
 * @template F - The Kind associated with this class
 */
export interface Class<F extends Kind> {
    readonly [KIND]?: F;
}

/**
 * Represents a contravariant operation that accepts an input of type `In`
 */
export type ContravariantOp<In> = (_: In) => void;

/**
 * Represents a covariant operation that returns a value of type `Out`
 */
export type CovariantOp<Out> = () => Out;

/**
 * Represents an invariant operation that both accepts and returns a value of
 * type `T`
 */
export type InvariantOp<T> = (_: T) => T;

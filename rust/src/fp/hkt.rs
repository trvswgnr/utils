pub trait Morphic<Source> {
    type In;
    type Out;
}

pub trait Endomorphic {
    type In;
    type Out;
}

impl<S, T> Morphic<T> for S {
    type In = S;
    type Out = T;
}

impl<T> Endomorphic for T {
    type In = T;
    type Out = T;
}

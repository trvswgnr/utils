pub trait Morphic<S> {
    type Domain;
    type Codomain;
}

pub trait Endomorphic {
    type Domain;
    type Codomain;
}

impl<S, T> Morphic<T> for S {
    type Domain = S;
    type Codomain = T;
}

impl<T> Endomorphic for T {
    type Domain = T;
    type Codomain = T;
}

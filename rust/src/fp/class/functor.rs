// use crate::fp::hkt::{Endomorphic, Morphic};

pub trait Functor<A> {
    type Kind<T>;

    fn fmap<B, F>(self, f: F) -> Self::Kind<B>
    where
        F: FnMut(A) -> B;
}

impl<A> Functor<A> for Option<A> {
    type Kind<T> = Option<T>;

    fn fmap<B, F>(self, f: F) -> Self::Kind<B>
    where
        F: FnMut(A) -> B,
    {
        self.map(f)
    }
}


#[cfg(test)]
mod tests_option_functor {
    use super::*;

    fn id<A>(a: A) -> A {
        a
    }

    fn compose<A, B, C>(f: impl Fn(A) -> B, g: impl Fn(B) -> C) -> impl Fn(A) -> C {
        move |x| g(f(x))
    }

    #[test]
    fn identity() {
        let option_identity = Some(3).fmap(id);
        assert_eq!(option_identity, Some(3));
    }

    #[test]
    fn composition() {
        let option_composed = Some(3).fmap(|x| x + 1).fmap(|x| x * 2);
        assert_eq!(option_composed, Some(8));
    }
}

// pub trait Endofunctor {
//     type Kind<T>;
//     type InnerType;
//     type Constraint: Endomorphic<In = Self, Out = Self::Kind<Self::InnerType>>;

//     fn fmap<B, F>(self, f: F) -> Self::Kind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//         Self::Kind<B>: Endofunctor<Kind<B> = Self::Kind<B>, InnerType = B>;
// }

// impl<A> Endofunctor for Option<A> {
//     type Kind<T> = Option<T>;
//     type InnerType = A;
//     type Constraint = Self;

//     fn fmap<B, F>(self, f: F) -> Self::Kind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//     {
//         self.map(f)
//     }
// }

// impl<R, E> Endofunctor for Result<R, E> {
//     type Kind<T> = Result<T, E>;
//     type InnerType = R;
//     type Constraint = Self;

//     fn fmap<B, F>(self, f: F) -> Self::Kind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//     {
//         self.map(f)
//     }
// }

// impl<A> Endofunctor for Vec<A> {
//     type Kind<T> = Vec<T>;
//     type InnerType = A;
//     type Constraint = Self;

//     fn fmap<B, F>(self, f: F) -> Self::Kind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//     {
//         self.into_iter().map(f).collect()
//     }
// }

// impl Endofunctor for String {
//     type Kind<T> = T;
//     type InnerType = String;
//     type Constraint = Self;

//     fn fmap<B, F>(self, mut f: F) -> Self::Kind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//     {
//         f(self)
//     }
// }

// impl<A> Functor for Option<A> {
//     type TargetKind<T> = Vec<T>;
//     type InnerType = A;
//     type Constraint = Self;

//     fn fmap<B, F>(self, mut f: F) -> Self::TargetKind<B>
//     where
//         F: FnMut(Self::InnerType) -> B,
//     {
//         if let Some(a) = self {
//             vec![f(a)]
//         } else {
//             vec![]
//         }
//     }
// }

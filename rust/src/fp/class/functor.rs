use crate::fp::hkt::{Endomorphic, Morphic};

pub trait Functor
where
    Self: Sized,
{
    type CoFunctor<T>;
    type Param;
    type Constraint: Morphic<Self>;

    fn fmap<B, F>(self, f: F) -> Self::CoFunctor<B>
    where
        F: FnMut(Self::Param) -> B;
}

impl<A> Functor for Option<A> {
    type CoFunctor<T> = Vec<T>;
    type Param = A;
    type Constraint = Self;

    fn fmap<B, F>(self, mut f: F) -> Self::CoFunctor<B>
    where
        F: FnMut(Self::Param) -> B,
    {
        if let Some(a) = self {
            vec![f(a)]
        } else {
            vec![]
        }
    }
}

// #[macro_export]
// macro_rules! fmap {
//     ($f:expr) => {
//         $crate::fp::function_composition::composable(move |x| Functor::fmap(x, $f))
//     };
//     ($f:expr, $fa:expr) => {
//         Functor::fmap($fa, $f)
//     };
// }

// #[cfg(test)]
// mod tests_option_functor {
//     use super::*;
//     use crate::fp::function_composition::composable;

//     fn id<A>(a: A) -> A {
//         a
//     }

//     #[test]
//     fn identity() {
//         let x = Some(3);
//         let fmap = |f| move |x| Functor::fmap(x, f);
//         assert_eq!(fmap(id)(x), x);
//     }

//     #[test]
//     fn composition() {
//         let x = Some(3);
//         let f = composable(|x: i32| x + 1);
//         let g = composable(|x: i32| x * 2);
//         assert_eq!(fmap!(f + g)(x), (fmap!(f) + fmap!(g))(x));
//     }
// }

pub trait Endofunctor
where
    Self: Sized,
{
    type CoFunctor<T>;
    type Param;
    type Constraint: Endomorphic<Domain = Self, Codomain = Self::CoFunctor<Self::Param>>;

    fn endo_fmap<B, F>(self, f: F) -> Self::CoFunctor<B>
    where
        F: FnMut(Self::Param) -> B;
}

impl<A> Endofunctor for Option<A> {
    type CoFunctor<T> = Option<T>;
    type Param = A;
    type Constraint = Self;

    fn endo_fmap<B, F>(self, mut f: F) -> Self::CoFunctor<B>
    where
        F: FnMut(Self::Param) -> B,
    {
        if let Some(a) = self {
            return Some(f(a));
        }
        None
    }
}

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

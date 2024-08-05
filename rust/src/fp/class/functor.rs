// use crate::fp::hkt::{Endomorphic, Morphic};

pub trait Functor<A> {
    type Target<T>;

    fn fmap<B, F>(self, f: F) -> Self::Target<B>
    where
        F: FnMut(A) -> B;
}

impl<A> Functor<A> for Option<A> {
    type Target<T> = Option<T>;

    fn fmap<B, F>(self, f: F) -> Self::Target<B>
    where
        F: FnMut(A) -> B,
    {
        self.map(f)
    }
}

#[macro_export]
macro_rules! fmap {
    ($f:expr) => {
        move |x| Functor::fmap(x, $f)
    };
}

#[cfg(test)]
mod tests_option_functor {
    use super::*;
    use crate::fp::function_composition::composable;

    fn id<A>(a: A) -> A {
        a
    }

    #[test]
    fn identity() {
        let x = Some(3);
        let fmap = |f| move |x| Functor::fmap(x, f);
        assert_eq!(fmap(id)(x), x);
    }

    #[test]
    fn composition() {
        let fmap_curried = composable(|f, fa| fmap!(f)(fa));

        let x = Some(3);
        let f = composable(|x: i32| x + 1);
        let g = composable(|x: i32| x * 2);
        let left = fmap!(f + g)(x);
        let right = (fmap!(f) + fmap!(g))(x);
        assert_eq!(left, right);
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

use std::marker::PhantomData;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Compose<F, G, A, B, C>
where
    F: Fn(B) -> C,
    G: Fn(A) -> B,
{
    f: F,
    g: G,
    _phantom: PhantomData<(A, B, C)>,
}

impl<F, G, A, B, C> Compose<F, G, A, B, C>
where
    F: Fn(B) -> C,
    G: Fn(A) -> B,
{
    fn new(f: F, g: G) -> Self {
        Compose {
            f,
            g,
            _phantom: PhantomData,
        }
    }
}

impl<F, G, A, B, C> Fn<(A,)> for Compose<F, G, A, B, C>
where
    F: Fn(B) -> C,
    G: Fn(A) -> B,
{
    extern "rust-call" fn call(&self, args: (A,)) -> C {
        (self.f)((self.g)(args.0))
    }
}

impl<F, G, A, B, C> FnMut<(A,)> for Compose<F, G, A, B, C>
where
    F: Fn(B) -> C,
    G: Fn(A) -> B,
{
    extern "rust-call" fn call_mut(&mut self, args: (A,)) -> C {
        self.call(args)
    }
}

impl<F, G, A, B, C> FnOnce<(A,)> for Compose<F, G, A, B, C>
where
    F: Fn(B) -> C,
    G: Fn(A) -> B,
{
    type Output = C;

    extern "rust-call" fn call_once(self, args: (A,)) -> C {
        self.call(args)
    }
}

impl<F, G, H, A, B, C> Add<H> for Compose<F, G, B, C, A>
where
    F: Fn(C) -> A,
    G: Fn(B) -> C,
    H: Fn(A) -> B,
{
    type Output = Compose<Compose<F, G, B, C, A>, H, A, B, A>;

    fn add(self, rhs: H) -> Self::Output {
        Compose::new(self, rhs)
    }
}

impl<'a, F, G, H, A, B, C> Add<H> for &'a Compose<F, G, B, C, A>
where
    F: Fn(C) -> A,
    G: Fn(B) -> C,
    H: Fn(A) -> B,
{
    type Output = Compose<&'a Compose<F, G, B, C, A>, H, A, B, A>;

    fn add(self, rhs: H) -> Self::Output {
        Compose::new(self, rhs)
    }
}

pub fn composable<F, A, B>(f: F) -> Compose<F, fn(A) -> A, A, A, B>
where
    F: Fn(A) -> B,
{
    Compose::new(f, |x| x)
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adheres_to_composition_law() {
        let f = composable(|x: i32| x + 1);
        let g = composable(|x: i32| x * 2);
        let x = 5;
        assert_eq!((f + g)(x), f(g(x)));
    }
}

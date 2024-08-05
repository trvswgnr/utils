use std::marker::PhantomData;
use std::ops::Add;

pub struct ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    f: F,
    g: G,
    _phantom: PhantomData<(A, B, C)>,
}

impl<F, G, A, B, C> ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    fn new(f: F, g: G) -> Self {
        ComposableFn {
            f,
            g,
            _phantom: PhantomData,
        }
    }
}

impl<F, G, A, B, C> Fn<(A,)> for ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    extern "rust-call" fn call(&self, args: (A,)) -> C {
        (self.g)((self.f)(args.0))
    }
}

impl<F, G, A, B, C> FnMut<(A,)> for ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    extern "rust-call" fn call_mut(&mut self, args: (A,)) -> C {
        self.call(args)
    }
}

impl<F, G, A, B, C> FnOnce<(A,)> for ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    type Output = C;

    extern "rust-call" fn call_once(self, args: (A,)) -> C {
        self.call(args)
    }
}

impl<F, G, H, A, B, C, D> Add<H> for ComposableFn<F, G, A, B, C>
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
    H: Fn(C) -> D,
{
    type Output = ComposableFn<ComposableFn<F, G, A, B, C>, H, A, C, D>;

    fn add(self, rhs: H) -> Self::Output {
        ComposableFn::new(self, rhs)
    }
}

pub fn f<F, A, B>(f: F) -> ComposableFn<F, fn(B) -> B, A, B, B>
where
    F: Fn(A) -> B,
{
    ComposableFn::new(f, |x| x)
}

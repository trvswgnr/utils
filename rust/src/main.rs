#![feature(unboxed_closures)]
#![feature(fn_traits)]
use std::marker::PhantomData;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Compose<F, G, A, B, C>
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

fn cfn<F, A, B>(f: F) -> Compose<F, fn(A) -> A, A, A, B>
where
    F: Fn(A) -> B,
{
    Compose::new(f, |x| x)
}

fn reverse(x: Vec<i32>) -> Vec<i32> {
    let mut x = x;
    x.reverse();
    x
}

fn sort(x: Vec<i32>) -> Vec<i32> {
    let mut x = x;
    x.sort();
    x
}

fn main() {
    let reverse = cfn(reverse);

    let sort = cfn(sort);

    let desort = reverse + sort;

    assert_eq!(
        desort([2, 8, 7, 10, 1, 9, 5, 3, 4, 6].into()),
        [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
    );
}

use std::{marker::PhantomData, ops::Add};

// Define a trait for objects in a category
trait Object {}

// Define a trait for morphisms in a category
trait Morphic<A: Object, B: Object> {
    fn morphic_call(&self, a: &A) -> B;
}

trait Endomorphic<A: Object> {
    fn endomorphic_call(&self, a: &A) -> A;
}

// Define the Functor trait
trait Functor<C1, C2> {
    type FMap<A, B>: Morphic<A, B>
    where
        A: Object,
        B: Object;

    fn fmap<A, B>(&self, f: impl Morphic<A, B> + 'static) -> Self::FMap<A, B>
    where
        A: Object,
        B: Object;
}

// Define the Endofunctor trait
trait Endofunctor<C> {
    type FMap<A>: Endomorphic<A>
    where
        A: Object;

    fn fmap<A>(&self, f: impl Endomorphic<A> + 'static) -> Self::FMap<A>
    where
        A: Object;
}

// Implement a simple Functor: The identity functor
struct IdentityFunctor<C>(PhantomData<C>);

impl<C> Endofunctor<C> for IdentityFunctor<C> {
    type FMap<A> = IdentityMorphism<A> where A: Object;
    fn fmap<A>(&self, f: impl Endomorphic<A> + 'static) -> Self::FMap<A>
    where
        A: Object,
    {
        IdentityMorphism(Box::new(f))
    }
}

// Helper struct to wrap a morphism for the identity functor
struct IdentityMorphism<A>(Box<dyn Endomorphic<A>>);

impl<A: Object> Endomorphic<A> for IdentityMorphism<A> {
    fn endomorphic_call(&self, a: &A) -> A {
        self.0.endomorphic_call(a)
    }
}

// Example usage
impl Object for i32 {}

struct AddOne;

impl<T: Object + Add<Output = T> + Copy + From<i32>> Endomorphic<T> for AddOne {
    fn endomorphic_call(&self, a: &T) -> T {
        *a + T::from(1)
    }
}

fn main() {
    let identity_functor: IdentityFunctor<u32> = IdentityFunctor(PhantomData);
    let add_one = AddOne;
    let mapped_morphism = identity_functor.fmap(add_one);

    let x = 5;
    let result = mapped_morphism.endomorphic_call(&x);
    println!("Result of applying mapped morphism to 5: {}", result);
}

// use std::error::Error as StdError;
// use travvy_utils::fp::class::Functor;
// // use travvy_utils::fp::class::Endofunctor;

// type Error = Box<dyn StdError>;

// pub fn main() {

//     // let option_doubled = Some(3).fmap(|x: i32| x * 2);
//     // println!("Option result: {:?}", option_doubled);
//     // assert_eq!(option_doubled, Some(6));

//     // // let vec_doubled = vec![1, 2, 3].fmap(|x: i32| x * 2);
//     // // println!("Vec result: {:?}", vec_doubled);
//     // // assert_eq!(vec_doubled, vec![2, 4, 6]);

//     // // let mapped_ok = Ok::<i32, Error>(5).fmap(|x| x * 2);
//     // // println!("Mapped Ok: {:?}", mapped_ok);
//     // // assert_eq!(mapped_ok.unwrap(), 10);

//     // // let mapped_ok = Endofunctor::fmap(Ok::<&str, Error>("tr4vvyr00lz"), |x| x.len());
//     // // println!("Mapped Ok: {:?}", mapped_ok);
//     // // assert_eq!(mapped_ok.unwrap(), 11);

//     // // let mapped_string = Endofunctor::fmap("tr4vvyr00lz".to_string(), |x| x.to_ascii_uppercase());
//     // // println!("Mapped string: {:?}", mapped_string);
//     // // assert_eq!(mapped_string, "TR4VVYR00LZ");
// }

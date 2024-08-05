use travvy_utils::fp::function_composition::f;

fn main() {
    let plus_one = f(|x: i32| x + 1);

    let times_two = f(|x: i32| x * 2);

    let composed = times_two + plus_one;

    println!("result: {}", composed(5)); // -> "result: 11"
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

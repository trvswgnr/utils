open Merge_sort

module Prelude = struct
  (** identity function *)
  let id : 'a -> 'a = fun x -> x

  (** `const x y` always evaluates to `x`, ignoring its second argument *)
  let const : 'a -> 'b -> 'a = fun x _ -> x

  (** right to left function composition *)
  let ( ^< ) : ('b -> 'c) -> ('a -> 'b) -> 'a -> 'c = fun f g x -> f (g x)

  (** left to right function composition *)
  let ( ^> ) : ('a -> 'b) -> ('b -> 'c) -> 'a -> 'c = fun f g x -> g (f x)

  (** `flip f` takes its (first) two arguments in the reverse order of `f` *)
  let flip : ('a -> 'b -> 'c) -> 'b -> 'a -> 'c = fun f x y -> f y x

  (** left to right function application, right associative *)
  let ( $ ) : ('a -> 'b) -> 'a -> 'b = fun f x -> f x

  (** reverse application operator *)
  let ( & ) : 'a -> ('a -> 'b) -> 'b = fun x f -> f x

  (** `fix f` is the least fixed point of the function `f` *)
  let rec fix : ('a -> 'a) -> 'a = fun f -> f (fix f)

  (** on b u x y runs the binary function b on the results of applying unary
    function u to two arguments x and y. From the opposite perspective, it
    transforms two inputs and combines the outputs. *)
  let on : ('b -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'a -> 'c =
   fun b u x y -> b (u x) (u y)

  (** infix operator for `on`. `b <@> u` is equivalent to `on b u` *)
  let ( <@> ) : ('b -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'a -> 'c = on

  (** applies a function to a value if a condition is true, otherwise, it
  returns the value unchanged. equivalent to `flip (bool id)` *)
  let apply_when : bool -> ('a -> 'a) -> 'a -> 'a =
   fun b f x -> if b then f x else x

  let ( + ) : int -> int -> int = fun a b -> a + b
end

open Prelude

module Bool = struct
  (** Boolean "and", lazy in the second argument *)
  let ( && ) a b = if a = true then Lazy.force b else false

  (** Boolean "or", lazy in the second argument *)
  let ( || ) a b = if a = true then true else Lazy.force b

  (** Boolean "not" *)
  let not : bool -> bool = function true -> false | false -> true

  let ( ! ) = not

  (**
  otherwise is defined as the value True. It helps to make guards more readable. eg:
  ```
  f x | x < 0     = ...
      | otherwise = ...
  ```
  *)
  let otherwise : bool = true

  (**
  `#?` is a conditional operator that takes a condition and two values. If the
  condition is True, it returns the first value. Otherwise, it returns the
  second value.
  *)
  let cond : bool -> 'a -> 'a -> 'a =
   fun condition a b -> if condition then a else b

  let ( #? ) = cond

  (**
  `#:` is just a nicety for use with `#?` to make it more readable, like
  ternary operators.
  *)
  let ( #: ) : ('a -> 'b) -> 'a -> 'b = fun f x -> f x

  (** Case analysis for the Bool type. bool f t p evaluates to f when p is
  False, and evaluates to t when p is True. *)
  let bool f t p = if p then t else f
end

let assert_eq a b msg = if a <> b then failwith msg

let () =
  let calls = ref 0 in
  let expensive_computation () =
    incr calls;
    print_endline "Performing expensive computation";
    42
  in
  let lazy_value = lazy (expensive_computation ()) in
  let _without_alias = lazy (expensive_computation ()) in
  assert_eq !calls 0 "_without_alias should not have been evaluated";
  assert_eq !calls 0 "_with_alias should not have been evaluated";
  print_endline "passed!";
  exit 0

let () =
  let open Bool in
  let y = 1 + 2 = 3 in
  let example x = x #? 1 #: 2 in
  print_endline (string_of_int (example y));
  exit 0

let () =
  let open Prelude in
  let ( ||> ) a b = if a then true else Lazy.force b in
  let result1 = true ||> lazy (1 / 0 = 1) in

  print_endline $ string_of_bool result1;
  (* Bool.(
     let x = True || if 1 / 0 = 0 then True else False in
     print_endline $ to_string x); *)
  let length = List.length in
  let x = ( + ) <@> length $ [ 1; 2; 3 ] $ [ -1 ] in
  assert_eq x 4 $ "expected 3, got " ^ string_of_int x;
  let odd x = x mod 2 = 1 in
  let bool f t p = if p then t else f in
  let flip_bool_id = flip (bool id) in
  let l = [ 1; 2; 3; 4; 5; 6; 7; 8; 9; 10 ] in
  let fn f x = f (odd x) (( * ) 2) x in
  let left = List.map $ fn apply_when $ l in
  let right = List.map $ fn flip_bool_id $ l in
  assert_eq left right "`apply_when` and `flip (bool id)` should be equivalent";
  ()

module type List = sig
  type 'a t = 'a list
end

(** non-empty list *)
module Nonempty : sig
  type 'a t = ( :: ) of 'a * 'a list

  val hd : 'a t -> 'a
  val tl : 'a t -> 'a list
end = struct
  type 'a t = ( :: ) of 'a * 'a list

  let hd (x :: _) = x
  let tl (_ :: xs) = xs
end

module Integral : sig
  type t = int
end = struct
  type t = int
end

module type Functor = sig
  type 'a t

  val fmap : ('a -> 'b) -> 'a t -> 'b t
end

module type Applicative = sig
  include Functor

  val pure : 'a -> 'a t
  val ( <*> ) : ('a -> 'b) t -> 'a t -> 'b t
end

module type Monad = sig
  include Applicative

  val ( >>= ) : 'a t -> ('a -> 'b t) -> 'b t
  val return : 'a -> 'a t
end

module type MinimumSemigroup = sig
  type 'a t

  val ( <+> ) : 'a t -> 'a t -> 'a t
end

module type Semigroup = sig
  include MinimumSemigroup

  val stimes : Integral.t -> 'a t -> 'a t
  val sconcat : 'a t Nonempty.t -> 'a t
end

module SemigroupConstructor (T : MinimumSemigroup) :
  Semigroup with type 'a t = 'a T.t = struct
  type 'a t = 'a T.t

  let ( <+> ) = T.( <+> )

  let sconcat x =
    let rec loop acc = function [] -> acc | x :: xs -> loop (acc <+> x) xs in
    loop (Nonempty.hd x) (Nonempty.tl x)

  let stimes y0 x0 =
    if y0 <= 0 then failwith "stimes: positive multiplier expected"
    else
      let rec f x y =
        if y mod 2 = 0 then f (x <+> x) (y / 2)
        else if y = 1 then x
        else g (x <+> x) (y / 2) x
      and g x y z =
        if y mod 2 = 0 then g (x <+> x) (y / 2) z
        else if y = 1 then x <+> z
        else g (x <+> x) (y / 2) (x <+> z)
      in
      f x0 y0
end

module type Monoid = sig
  include Semigroup

  val mempty : 'a t
end

type 'a maybe = Just of 'a | Nothing

module Maybe_Semigroup = SemigroupConstructor (struct
  type 'a t = 'a maybe

  let ( <+> ) a b = match a with Just _ -> a | Nothing -> b
end)

module Maybe_Monoid : Monoid with type 'a t = 'a maybe = struct
  include Maybe_Semigroup

  let mempty = Nothing
end

type 'a io = 'a Lazy.t

module IO_Functor : Functor with type 'a t = 'a io = struct
  type 'a t = 'a io

  let fmap f x = lazy (f @@ Lazy.force x)
end

module IO_Applicative : Applicative with type 'a t = 'a io = struct
  include IO_Functor

  let pure x = lazy x
  let ( <*> ) f x = lazy (Lazy.force f $ Lazy.force x)
end

module IO_Monad : Monad with type 'a t = 'a io = struct
  include IO_Applicative

  let ( >>= ) m f = lazy (Lazy.force @@ f (Lazy.force m))
  let return x = lazy x
end

module IO = struct
  include IO_Functor
  include IO_Applicative
  include IO_Monad

  let run io = Lazy.force io
  let putStrLn s = lazy (print_endline s)
  let getLine () = lazy (read_line ())
  let ( let* ) = ( >>= )

  let ( and* ) m1 m2 =
    m1 >>= fun a ->
    m2 >>= fun b -> return (a, b)
end

let () =
  IO.run
    IO.(
      let* _ = putStrLn "enter your name" in
      let* name = getLine () in
      let* _ = putStrLn ("hello, " ^ name ^ "!") in
      return ())

let read_env_file filename =
  try
    let env_vars = ref [] in
    let in_channel = open_in filename in
    try
      while true do
        let line = input_line in_channel in
        match String.split_on_char '=' line with
        | [ key; value ] ->
            env_vars := (String.trim key, String.trim value) :: !env_vars
        | _ -> ()
      done
    with
    | End_of_file ->
        close_in in_channel;
        List.iter (fun (key, value) -> Unix.putenv key value) !env_vars
    | e ->
        print_endline $ Printexc.to_string e;
        close_in in_channel
  with _ ->
    print_endline $ filename ^ " not found";
    ()

let dotenv () = read_env_file ".env"
let () = dotenv ()

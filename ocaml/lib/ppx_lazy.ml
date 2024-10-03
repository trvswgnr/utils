open Ppxlib

let expand ~loc ~path:_ expr =
  match expr with
  | [%expr ??[%e? e]] ->
    [%expr lazy [%e e]]
  | _ ->
    Location.raise_errorf ~loc "Expected ??<expression>"

let lazy_extension =
  Extension.declare "lazy_alias"
    Extension.Context.expression
    Ast_pattern.(single_expr_payload __)
    expand

let () =
  Driver.register_transformation "lazy_alias"
    ~extensions:[lazy_extension]
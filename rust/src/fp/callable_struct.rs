#![feature(unboxed_closures)]
#![feature(fn_traits)]

struct Foo;

impl Fn<()> for Foo {
    extern "rust-call" fn call(&self, _args: ()) {
        println!("Call (Fn) for Foo");
    }
}

impl FnMut<()> for Foo {
    extern "rust-call" fn call_mut(&mut self, _args: ()) {
        println!("Call (FnMut) for Foo");
    }
}

impl FnOnce<()> for Foo {
    type Output = ();

    extern "rust-call" fn call_once(self, _args: ()) {
        println!("Call (FnOnce) for Foo");
    }
}

pub fn main() {
    let x = Foo;
    x();
}

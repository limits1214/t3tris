#[macro_export]
macro_rules! colon {
    ( $( $x:expr ),* ) => {
        vec![$($x.to_string()),*].join(":")
    };
}

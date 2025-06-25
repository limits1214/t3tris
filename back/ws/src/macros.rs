#[macro_export]
macro_rules! topic {
    ( $( $x:expr ),* ) => {
        $crate::ws_world::model::TopicId(vec![$($x.to_string()),*].join(":"))
    };
}

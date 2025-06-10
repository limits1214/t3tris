use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiHandlerError {
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
    // #[error(transparent)]
    // Validation(#[from] validator::ValidationErrors),
}
#[derive(Error, Debug)]
pub enum PageHandlerError {
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),

    #[error(transparent)]
    Template(#[from] askama::Error),
}

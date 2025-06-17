use std::sync::OnceLock;

use reqwest::Client;

static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

pub fn get_http_clinet() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| {
        let http_client = reqwest::ClientBuilder::new()
            // Following redirects opens the client up to SSRF vulnerabilities.
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Client should build");
        http_client
    })
}

use oauth2::{
    basic::BasicClient, AuthUrl, ClientId, ClientSecret, EndpointNotSet, EndpointSet, RedirectUrl,
    RevocationUrl, TokenUrl,
};

pub type GoogleOauth2Client<
    HasAuthUrl = EndpointSet,
    HasDeviceAuthUrl = EndpointNotSet,
    HasIntrospectionUrl = EndpointNotSet,
    HasRevocationUrl = EndpointSet,
    HasTokenUrl = EndpointSet,
> = BasicClient<HasAuthUrl, HasDeviceAuthUrl, HasIntrospectionUrl, HasRevocationUrl, HasTokenUrl>;

pub fn google_oauth2_client() -> GoogleOauth2Client {
    let appsettings = super::config::get_config_settings_app();
    let oauth2settings = super::config::get_config_settings_oauth2();

    let google_client_id = ClientId::new(oauth2settings.oauth2_google_client_id.clone());
    let google_client_secret =
        ClientSecret::new(oauth2settings.oauth2_google_client_secret.clone());
    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
        .expect("Invalid authorization endpoint URL");
    let token_url = TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string())
        .expect("Invalid token endpoint URL");

    BasicClient::new(google_client_id)
        .set_client_secret(google_client_secret)
        .set_auth_uri(auth_url)
        .set_token_uri(token_url)
        .set_redirect_uri(
            RedirectUrl::new(format!("{}/api/auth/google/callback", appsettings.back_url))
                .expect("Invalid redirect URL"),
        )
        // Google supports OAuth 2.0 Token Revocation (RFC-7009)
        .set_revocation_url(
            RevocationUrl::new("https://oauth2.googleapis.com/revoke".to_string())
                .expect("Invalid revocation endpoint URL"),
        )
}

pub async fn google_oauth2_user_info_api(access_token: &str) -> anyhow::Result<serde_json::Value> {
    let url = "https://www.googleapis.com/oauth2/v3/userinfo";
    let client = reqwest::Client::new();
    let response = client.get(url).bearer_auth(access_token).send().await?;
    Ok(response.json::<serde_json::Value>().await?)
}

export interface OsuOauthResponse {
    access_token: string
    expires_in: number
    refresh_token: string

    token_type: 'Bearer'
}

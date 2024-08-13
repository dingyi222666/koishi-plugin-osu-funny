export interface OsuUserInfo {
  username: string;
  userId: string;
  token: string;
  refresh_token: string;
  expires_in: number;
  // std taiko catch mania
  mode: 0 | 1 | 2 | 3;
}

export interface OsuOauthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;

  token_type: "Bearer"
}

declare module "koishi" {
  interface Tables {
    osu_funny_user: OsuUserInfo;
  }
}

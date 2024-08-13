import { Context, Service } from "koishi";
import {} from "@koishijs/plugin-server";
import { Config } from ".";
import { OsuOauthResponse } from "./types";

export class OsuFunnyService extends Service {
  readonly _bindQueue: Map<string, string> = new Map();

  constructor(
    public ctx: Context,
    public config: Config,
  ) {
    super(ctx, "osu_funny");
    this._listenerCallback();
  }

  getBindUrl(uid: string) {
    this._bindQueue.set(uid, uid);
    return `https://osu.ppy.sh/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.ctx.server.config.selfUrl}/osu-funny/oauth&response_type=code&scope=friends.read%20identify%20public&state=${uid}`;
  }

  private _listenerCallback() {
    const router = this.ctx.server.get("/osu-funny/oauth", async (koa) => {
      const { code, state } = koa.query;

      const formData = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.ctx.server.config.selfUrl + "/osu-funny/oauth",
        code: code as string,
      });

      let oauthResult: OsuOauthResponse;

      try {
        oauthResult = await this.ctx.http.post(
          "https://osu.ppy.sh/oauth/token",
          formData.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
      } catch (e) {
        this.ctx.logger.error(e);
      }

      koa.status = 200;
      if (oauthResult?.access_token) {
        // finish oauth
        try {
          await this.ctx.database.upsert("osu_funny_user", [
            {
              userId: state as string,
              token: oauthResult.access_token,
              refresh_token: oauthResult.refresh_token,
              expires_in: oauthResult.expires_in,
              mode: 0,
            },
          ]);
        } catch (e) {
          this.ctx.logger.error(e);
          koa.body = "Oops! Something went wrong.";
          this._bindQueue.delete(state as string);
          return;
        }

        this._bindQueue.set(state as string, "success");
        koa.body = "Finish! You can close this page now.";
      } else {
        this.ctx.logger.error(oauthResult);
        koa.body = "Oops! Something went wrong.";
        this._bindQueue.delete(state as string);
      }
    });
  }

  static inject = ["server", "database"];
}

declare module "koishi" {
  interface Context {
    osu_funny: OsuFunnyService;
  }
}

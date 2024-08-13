import { Context } from "koishi";
import { Config } from '.';

export function apply(ctx: Context,config: Config) {
  ctx.database.extend(
    "osu_funny_user",
    {
      username: "string",
      userId: "string",
      mode: {
        type: "integer",
        initial: 0,
      },
      token: "string",
      refresh_token: "string",
      expires_in: "integer",
    },
    {
      autoInc: false,
      primary: "username",
    },
  );
}



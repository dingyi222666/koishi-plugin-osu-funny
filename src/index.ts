import { Context, Schema } from "koishi";
import { OsuFunnyService } from "./service";
import { apply as database } from "./database";
import { withResolver } from "./utils";

export const name = "osu-funny";

export interface Config {
  clientId: string;
  clientSecret: string;
}

export const Config: Schema<Config> = Schema.object({
  clientId: Schema.string().description("Osu! Oauth 应用 ID。").required(),
  clientSecret: Schema.string().description("Osu! Oauth 应用密钥。").required(),
});

export const usage = `
使用此插件需要确保你的 Koishi 可以被公网访问！！！

你需要前往 https://osu.ppy.sh/home/account/edit#oauth 创建一个应用，并填写相关信息。

注意回调地址，填写你的 Koishi 公网访问地址，后加 /osu-funny/oauth
http://你的域名:5140/osu-funny/oauth

创建好后将上面的 clientId 和 clientSecret 填写到下面的配置文件中即可。
`;

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));

  ctx.plugin(OsuFunnyService, config);
  ctx.plugin(
    {
      apply: database,
      inject: ["database"],
    },
    config,
  );

  ctx.inject(["osu_funny"], (ctx) => {
    ctx.command("osu-funny.bind", "绑定osu账号").action(async ({ session }) => {
      const selfId = session.selfId;

      const url = ctx.osu_funny.getBindUrl(selfId);

      const messageIds = await session.send(session.text(".go-oauth", [url]));

      const { promise, resolve } = withResolver<void>();

      const recallMessage = async () => {
        try {
          await session.bot.deleteMessage(session.channelId, messageIds[0]);
        } catch (e) {
          ctx.logger.error(e);
        }
        resolve();
      };

      let timeout: () => void;
      let interval: () => void;

      timeout = ctx.setTimeout(
        async () => {
          interval();

          await recallMessage();
        },
        1000 * 60 * 3,
      );

      // 轮询查询是否绑定成功

      interval = ctx.setInterval(async () => {
        const bindStatus = ctx.osu_funny._bindQueue.get(selfId);

        if (bindStatus === selfId) {
          return;
        }

        await recallMessage();
        interval();
        timeout();

        let msg: string;
        if (bindStatus === "success") {
          msg = session.text(".success");
        } else if (bindStatus == null) {
          msg = session.text(".error");
        }
        await session.send(msg);
      }, 100);

      await promise;
    });
  });
}

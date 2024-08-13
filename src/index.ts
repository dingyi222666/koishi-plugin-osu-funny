import { Context, Schema } from 'koishi'
import { OsuFunnyService } from './service'
import { apply as database } from './database'
import { apply as commands } from './commands'

export const name = 'osu-funny'

export interface Config {
    clientId: string
    clientSecret: string
    apiKey: string
}

export const Config: Schema<Config> = Schema.object({
    clientId: Schema.string().description('Osu! Oauth 应用 ID。').required(),
    clientSecret: Schema.string()
        .description('Osu! Oauth 应用密钥。')
        .role('secret')
        .required(),
    apiKey: Schema.string()
        .description('Osu! v1 的 API Key（即旧版本 API Key）。')
        .role('secret')
        .default(null)
})

export const usage = `
## 注意事项

使用此插件需要确保你的 Koishi 可以被公网访问！！！

你需要前往 https://osu.ppy.sh/home/account/edit#oauth 创建一个应用，并填写相关信息。

注意回调地址，填写你的 Koishi 公网访问地址，后加 /osu-funny/oauth

格式为：http://你的 Koishi 公网域名:Koishi端口/osu-funny/oauth

比如我的 Koishi 跑在 5140 端口下，那就是：
http://xxxx.top:5140/osu-funny/oauth

创建好后将上面的 clientId 和 clientSecret 填写到下面的配置文件中即可。

你可以选择不填写上面的 apiKey，但是不填写的话，插件将无法使用旧版本 API。（可能无法查询他人用户信息）

## 其他
注意作者本人只玩 mania 模式，其他模式可能适配不太好（

`

export function apply(ctx: Context, config: Config) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ctx.i18n.define('zh-CN', require('./locales/zh-CN'))

    ctx.plugin(OsuFunnyService, config)
    ctx.plugin(
        {
            apply: database,
            inject: ['database']
        },
        config
    )

    ctx.plugin(
        {
            apply: commands,
            inject: ['osu_funny']
        },
        config
    )
}

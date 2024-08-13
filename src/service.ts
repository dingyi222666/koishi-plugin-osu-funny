import { Context, Service } from 'koishi'
import {} from '@koishijs/plugin-server'
import { Config } from '.'
import { OsuOauthResponse, OsuUserExtends } from './types'
import OsuAPI from './api'
import { osuModeToNumber } from './utils'

export class OsuFunnyService extends Service {
    readonly _bindQueue: Map<string, string | OsuUserExtends> = new Map()
    private API: OsuAPI

    constructor(
        public ctx: Context,
        public config: Config
    ) {
        super(ctx, 'osu_funny')
        this._listenerCallback()
        this.API = new OsuAPI(this.ctx.http, this.config)
    }

    getBindUrl(uid: string) {
        this._bindQueue.set(uid, uid)
        // eslint-disable-next-line max-len
        return `https://osu.ppy.sh/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.ctx.server.config.selfUrl}/osu-funny/oauth&response_type=code&scope=friends.read%20identify%20public&state=${uid}`
    }

    private _listenerCallback() {
        this.ctx.server.get('/osu-funny/oauth', async (koa) => {
            const { code, state } = koa.query

            const formData = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri:
                    this.ctx.server.config.selfUrl + '/osu-funny/oauth',
                code: code as string
            })

            let oauthResult: OsuOauthResponse

            try {
                oauthResult = await this.ctx.http.post(
                    'https://osu.ppy.sh/oauth/token',
                    formData.toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                )
            } catch (e) {
                this.ctx.logger.error(e)
            }

            let success = false
            koa.status = 200
            let realUser: OsuUserExtends

            if (oauthResult?.access_token) {
                // finish oauth
                try {
                    realUser = await this.API.getMe(oauthResult.access_token)

                    await this.ctx.database.upsert('osu_funny_user', [
                        {
                            platform_id: state as string,
                            user_id: realUser.id,
                            token: oauthResult.access_token,
                            refresh_token: oauthResult.refresh_token,
                            expires_in: oauthResult.expires_in,
                            mode: osuModeToNumber(realUser.playmode),
                            username: realUser.username
                        }
                    ])

                    await this.ctx.database.upsert('osu_funny_real_user', [
                        {
                            id: realUser.id,
                            username: realUser.username,
                            profile_colour: realUser.profile_colour,
                            avatar_url: realUser.avatar_url,
                            country_code: realUser.country_code,
                            is_deleted: realUser.is_deleted,
                            is_supporter: realUser.is_supporter,
                            is_bot: realUser.is_bot
                        }
                    ])

                    success = true
                } catch (e) {
                    this.ctx.logger.error(e)

                    return
                }

                this._bindQueue.set(state as string, realUser)
                koa.body = 'Finish! You can close this page now.'

                if (success) {
                    return
                }

                this.ctx.logger.error(oauthResult)
                koa.body = 'Oops! Something went wrong.'
                this._bindQueue.set(state as string, 'failed')
            }
        })
    }

    static inject = ['server', 'database']
}

declare module 'koishi' {
    interface Context {
        osu_funny: OsuFunnyService
    }
}

import { Context, Service } from 'koishi'
import {} from '@koishijs/plugin-server'
import {} from '@koishijs/cache'
import { Config } from '.'
import OsuAPI from './api'
import { getDisplayOsuMode, osuModeToNumber } from './utils'
import TTLCache from '@isaacs/ttlcache'
import { OsuScorePrediction } from './types/alpha_osu'
import { OsuUserExtends } from './types/user'
import { OsuOauthResponse } from './types/oauth'

export class OsuFunnyService extends Service {
    readonly _bindQueue: Map<string, string | OsuUserExtends> = new Map()
    readonly _recommendCache: TTLCache<
        string,
        [OsuScorePrediction[], string[]]
    > = new TTLCache({
        max: 100,
        ttl: 1000 * 60 * 60
    })

    API: OsuAPI

    constructor(
        public ctx: Context,
        public config: Config
    ) {
        super(ctx, 'osu_funny')
        this._listenerCallback()
        this.API = new OsuAPI(this.ctx, this.config)
    }

    async getBeatMapCover(beatMapId: number) {
        return this.API.getMapBackground(beatMapId.toString())
    }

    async setMode(platformId: string, mode: number) {
        const user = await this.ctx.database.get('osu_funny_user', {
            platform_id: platformId
        })

        if (user.length < 1) {
            return
        }

        await this.ctx.database.upsert('osu_funny_user', [
            {
                platform_id: platformId,
                mode
            }
        ])

        return getDisplayOsuMode(mode)
    }

    async getBestPlayScores(
        usernameOrId: string | number,
        mode: number,
        limit: number,
        token?: string
    ) {
        token = token ?? (await this.getDefaultToken())
        return this.API.getBestPlayScores(usernameOrId, limit, mode, token)
    }

    async getRecommendBeatmap(
        userId: number,
        keyCount: string,
        mods: string,
        mode: number,
        force: boolean
    ): Promise<[OsuScorePrediction | null, number]> {
        const key = `${userId}-${mode}`
        let cache = this._recommendCache.get(key)

        if (cache == null || force) {
            try {
                const lastUpdatedTime = (await this.ctx.cache.get(
                    'default',
                    `recommendLastUpdated-${userId}`
                )) as number
                const now = Date.now()
                if (
                    lastUpdatedTime == null ||
                    now - lastUpdatedTime > 1000 * 60 * 60 * 2
                ) {
                    await this.API.updateRecommendBeatmap(userId)
                    await this.ctx.cache.set(
                        'default',
                        `recommendLastUpdated-${userId}`,
                        now
                    )
                }

                const recommendData = await this.API.getRecommendBeatmap(
                    userId,
                    keyCount,
                    mode,
                    mods
                )

                if ((recommendData.data?.list?.length ?? 0) === 0) {
                    // 1,玩的图太少了
                    return [null, 1]
                }
                cache = [recommendData.data.list, []]
                this._recommendCache.set(key, cache)
            } catch (e) {
                this.ctx.logger.error(e)
                // 3.未知错误
                return [null, 3]
            }
        }

        // 随机选择一个地图

        const mapList = cache[0]
        let map: OsuScorePrediction

        if (cache[0].length === cache[1].length) {
            // 推不了图了
            return [null, 2]
        }

        // Select a random map that hasn't been selected before
        while (true) {
            const randomIndex = Math.floor(Math.random() * mapList.length)
            map = mapList[randomIndex]

            if (!cache[1].includes(map.id)) {
                cache[1].push(map.id)
                break
            }
        }

        return [map, 0]
    }

    async unbind(platformId: string, osuUserId: number) {
        await this.ctx.database.remove('osu_funny_user', {
            platform_id: platformId
        })
        await this.ctx.database.remove('osu_funny_real_user', {
            id: osuUserId
        })
    }

    async getUserFromDatabase(platformId: string) {
        const user = await this.ctx.database.get('osu_funny_user', {
            platform_id: platformId
        })

        if (user.length < 1) {
            return null
        }

        return user[0]
    }

    async getUser(platformId: string, username: string, userId?: string) {
        const users = await this.ctx.database.get('osu_funny_user', {
            platform_id: platformId
        })

        const token = users?.[0].token ?? (await this.getDefaultToken())

        return this.API.getV2User(username, token)
    }

    async getDefaultToken() {
        const user = await this.ctx.database.get('osu_funny_user', {
            username: this.config.rootOsuId
        })

        if (user.length < 1) {
            throw new Error('not found the root osu id')
        }

        return user[0].token
    }

    getBindUrl(uid: string) {
        this._bindQueue.set(uid, uid)
        // eslint-disable-next-line max-len
        return `https://osu.ppy.sh/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.selfUrl}/osu-funny/oauth&response_type=code&scope=friends.read%20identify%20public&state=${uid}`
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

    static inject = ['server', 'database', 'cache']
}

declare module 'koishi' {
    interface Context {
        osu_funny: OsuFunnyService
    }
}

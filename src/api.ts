import { Context, HTTP } from 'koishi'
import { Config } from '.'
import {
    OsuModeString,
    OsuScore,
    OsuUserExtends,
    OsuV1Score,
    RecommendData
} from './types'
import { numberToOsuMode } from './utils'

export default class OsuAPI {
    private _http: HTTP

    constructor(
        private readonly ctx: Context,
        private readonly _config: Config
    ) {
        this._http = ctx.http.extend({
            baseURL: 'https://osu.ppy.sh/api/v2/',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
    }

    async getV2User(
        usernameOrId: string | number,
        token: string,
        mode?: OsuModeString
    ) {
        const user =
            typeof usernameOrId === 'string' ? `@${usernameOrId}` : usernameOrId

        let url = `users/${user}`

        if (mode) {
            url += `/${mode}`
        }

        return this._http.get<OsuUserExtends>(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    }

    async getBestPlayScores(
        userId: number | string,
        limit: number = 100,
        mode: number = 0,
        token?: string
    ): Promise<OsuScore[] | OsuV1Score[]> {
        if (typeof userId === 'string') {
            userId = await this.getV2User(userId, token).then((user) => user.id)
        }

        return this._http.get<OsuScore[]>(
            `users/${userId}/scores/best?limit=${limit}&mode=${numberToOsuMode(mode)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
    }

    async updateRecommendBeatmap(userId: number) {
        await this.ctx.http.post(
            'https://alphaosu.keytoix.vip/api/v1/self/users/synchronize',
            {
                headers: {
                    uid: userId
                }
            }
        )
    }

    getRecommendBeatmap(
        userId: number,
        keyCount: string,
        gameMode: number,
        mod: string = ''
    ) {
        const params = new URLSearchParams({
            newRecordPercent: '0.2,1',
            passPercent: '0.2,1',
            difficulty: '0,15',
            keyCount,
            gameMode: gameMode.toString(),
            rule: '4',
            mod,
            current: '1',
            pageSize: '100',
            from: 'koishi-plugin-osu-funny',
            hidePlayed: '0'
        })

        return this.ctx.http.get<RecommendData>(
            `https://alphaosu.keytoix.vip/api/v1/self/maps/recommend?${params.toString()}`,
            {
                headers: {
                    uid: userId
                }
            }
        )
    }

    async getMapBackground(mapId: string) {
        const urls = [
            `https://api.osu.direct/media/background/${mapId}`,
            `https://subapi.nerinyan.moe/bg/${mapId}`
        ]
        const content = await this.getContentByUrls(urls, 'file')
        return content as string
    }

    async getContentByUrls(urls: string[], type: 'file' | 'text' = 'file') {
        for (const url of urls) {
            try {
                const response = await this.ctx.http.get(url, {
                    responseType: type === 'file' ? 'arraybuffer' : undefined
                })

                if (response instanceof ArrayBuffer) {
                    // return base64
                    return Buffer.from(response).toString('base64')
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return response as any
                }
            } catch (error) {
                this.ctx.logger.error(error)
            }
        }
        return null
    }

    /**
     * v2 api
     * @param token
     * @returns
     */
    getMe(token: string): Promise<OsuUserExtends> {
        return this._http.get<OsuUserExtends>('me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    }
}

import { Context, HTTP } from 'koishi'
import { Config } from '.'
import { OsuUserExtends } from './types'

export default class OsuAPI {
    private _v2API: HTTP
    private _v1API: HTTP

    constructor(
        private readonly ctx: Context,
        private readonly _config: Config
    ) {
        this._v2API = ctx.http.extend({
            baseURL: 'https://osu.ppy.sh/api/v2/',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
        this._v1API = ctx.http.extend({
            baseURL: 'https://osu.ppy.sh/api/',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
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
        return this._v2API.get<OsuUserExtends>('me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    }
}

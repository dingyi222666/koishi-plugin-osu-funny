import { HTTP } from 'koishi'
import { Config } from '.'
import { OsuUserExtends } from './types'

export default class OsuAPI {
    private _v2API: HTTP
    private _v1API: HTTP

    constructor(
        http: HTTP,
        private readonly _config: Config
    ) {
        this._v2API = http.extend({
            baseURL: 'https://osu.ppy.sh/api/v2/',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
        this._v1API = http.extend({
            baseURL: 'https://osu.ppy.sh/api/',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
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

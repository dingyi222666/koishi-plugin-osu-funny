import { OsuUser } from './user'

export interface OsuUserInfo {
    username: string
    platform_id: string
    user_id: number
    token: string
    refresh_token: string
    expires_in: number
    // std taiko catch mania
    mode: OsuMode
}

export enum OsuMode {
    std = 0,
    taiko = 1,
    catch = 2,
    mania = 3
}

export type OsuModeString = 'osu' | 'taiko' | 'fruits' | 'mania'

declare module 'koishi' {
    interface Tables {
        osu_funny_user: OsuUserInfo
        osu_funny_real_user: OsuUser
    }
}

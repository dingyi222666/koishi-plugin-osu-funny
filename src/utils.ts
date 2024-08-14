import { Context, Session } from 'koishi'
import { OsuMode, OsuModeString } from './types/database'

// https://github.com/tc39/proposal-promise-with-resolvers
export interface Resolver<R = void, E = unknown> {
    promise: Promise<R>
    resolve: (res: R) => void
    reject: (err: E) => void
}

export function withResolver<R = void, E = unknown>(): Resolver<R, E> {
    let resolve: (res: R) => void
    let reject: (err: E) => void
    const promise = new Promise<R>((_resolve, _reject) => {
        resolve = _resolve
        reject = _reject
    })
    return { promise, resolve, reject }
}

export function osuModeToNumber(mode: OsuModeString): OsuMode {
    switch (mode) {
        case 'osu':
            return 0
        case 'taiko':
            return 1
        case 'fruits':
            return 2
        case 'mania':
            return 3
        default:
            return 0
    }
}

export function numberToOsuMode(mode: number): OsuModeString {
    switch (mode) {
        case 0:
            return 'osu'
        case 1:
            return 'taiko'
        case 2:
            return 'fruits'
        case 3:
            return 'mania'
        default:
            return 'osu'
    }
}

export function formatTimeToDay(time: number) {
    return time / 86400 > 1
        ? `${Math.floor(time / 86400)}d ${Math.floor(
              (time % 86400) / 3600
          )}h ${Math.floor((time % 3600) / 60)}m`
        : `${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m`
}

export function formatTimeToHours(time: number) {
    return time / 3600 > 1
        ? `${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m`
        : `${Math.floor(time / 60)}m`
}

export async function getBindingId(ctx: Context, session: Session) {
    const bindings = await ctx.database.get('binding', {
        platform: session.platform,
        pid: session.userId
    })

    if (bindings.length === 1) {
        return bindings[0]?.aid?.toString()
    }
    throw new Error('未绑定')
}

export function getDisplayOsuMode(mode: OsuModeString | number): string {
    switch (mode) {
        case 0:
        case 'osu':
            return 'osu'
        case 1:
        case 'taiko':
            return 'taiko'
        case 2:
        case 'fruits':
            return 'catch'
        case 3:
        case 'mania':
            return 'mania'
        default:
            return 'osu'
    }
}

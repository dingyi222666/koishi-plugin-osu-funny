import { Context, h } from 'koishi'
import { Config } from '.'
import {
    formatTimeToDay,
    formatTimeToHours,
    getBindingId,
    getDisplayOsuMode,
    withResolver
} from './utils'
import { OsuBeatmapset, OsuScore } from './types'

export function apply(ctx: Context, config: Config) {
    ctx.command('osu-funny', '一些有趣的 osu! 功能')

    ctx.command('osu-funny.bind').action(async ({ session }) => {
        const selfId = await getBindingId(ctx, session)

        const user = await ctx.osu_funny.getUserFromDatabase(selfId)

        if (user) {
            return session.text('.already-bind-v2')
        }

        const url = ctx.osu_funny.getBindUrl(selfId)

        const messageIds = await session.send(session.text('.go-oauth', [url]))

        const { promise, resolve } = withResolver<void>()

        const recallMessage = async () => {
            try {
                ctx.osu_funny._bindQueue.delete(selfId)
                await session.bot.deleteMessage(
                    session.channelId,
                    messageIds[0]
                )
            } catch (e) {
                ctx.logger.error(e)
            }
            resolve()
        }

        // eslint-disable-next-line prefer-const
        let interval: () => void

        const timeout = ctx.setTimeout(
            async () => {
                interval()

                await recallMessage()
            },
            1000 * 60 * 2
        )

        // 轮询查询是否绑定成功

        interval = ctx.setInterval(async () => {
            const bindStatus = ctx.osu_funny._bindQueue.get(selfId)

            if (bindStatus === selfId) {
                return
            }

            interval()
            timeout()

            let msg: string
            if (typeof bindStatus !== 'string') {
                msg = session.text('.success', [
                    bindStatus.username,
                    getDisplayOsuMode(bindStatus.playmode)
                ])
            } else if (bindStatus === 'failed') {
                msg = session.text('.error')
            }

            await session.send(msg)

            await recallMessage()
        }, 100)

        await promise
    })

    ctx.command('osu-funny.unbind').action(async ({ session }) => {
        const selfId = await getBindingId(ctx, session)

        const user = await ctx.osu_funny.getUserFromDatabase(selfId)

        if (!user) {
            return session.text('.not-bind')
        }

        await session.send(session.text('.unbind-confirm', [user.username]))

        const prompt = await session.prompt()

        if (!prompt) {
            return session.text('.unbind-cancel')
        }

        await ctx.osu_funny.unbind(selfId, user.user_id)

        return session.text('.unbind-success')
    })

    ctx.command('osu-funny.getbg <beatmapId: string>').action(
        async ({ session }, beatmapId) => {
            if (beatmapId.includes('osu.ppy.sh/beatmapsets')) {
                // https://osu.ppy.sh/beatmapsets/2017611#mania/4200599
                // get 4200959
                beatmapId = beatmapId.match(/\/beatmapsets\/\d+#\w+\/(\d+)/)[1]
            }
            // check is number
            if (!/^\d+$/.test(beatmapId)) {
                return session.text('.invalid-beatmap-id')
            }

            const beatMapBase64 = await ctx.osu_funny.getBeatMapCover(
                parseInt(beatmapId)
            )

            if (!beatMapBase64) {
                return session.text('.get-bg-failed')
            }

            return h.image(`data:image/png;base64,${beatMapBase64}`)
        }
    )

    ctx.command('osu-funny.guess-voice [user:string]')
        .option('type', '-t <t:number>')
        .action(async ({ session, options }, username) => {
            const selfId = await getBindingId(ctx, session)

            const user = await ctx.osu_funny.getUserFromDatabase(selfId)
            let mode = options.type

            if (user && !username) {
                username = user.username
            }

            mode = mode ?? user.mode

            if (!username) {
                return session.text('.no-username')
            }

            const scores = await ctx.osu_funny.getBestPlayScores(
                username,
                mode,
                100,
                user?.token
            )

            // random score
            const score = scores[Math.floor(Math.random() * scores.length)]

            let beatmapset: OsuBeatmapset
            // get beatmap id
            if (score?.['beatmap'] != null) {
                beatmapset = (score as OsuScore).beatmapset
            } else {
                return session.text('no-supported')
            }

            session.send(
                session.text('.prompt', [username, getDisplayOsuMode(mode)])
            )

            session.send(h.audio('https:' + beatmapset.preview_url))

            const input = await session.prompt(1000 * 60)

            if (input == null) {
                return session.text('.timeout', [
                    h.image(beatmapset.covers.card),
                    beatmapset.title_unicode
                ])
            }

            if (
                beatmapset.title
                    .toLocaleLowerCase()
                    .includes(input.toLocaleLowerCase()) ||
                beatmapset.title_unicode
                    .toLocaleLowerCase()
                    .includes(input.toLocaleLowerCase())
            ) {
                return session.text('.success', [
                    h.image(beatmapset.covers.card),
                    beatmapset.title_unicode
                ])
            } else {
                return session.text('.fail', [
                    h.image(beatmapset.covers.card),
                    beatmapset.title_unicode
                ])
            }
        })

    ctx.command('osu-funny.recommend [user:string]')
        .option('force', '-f <f:boolean>')
        .option('mods', '-m <m:string>')
        .option('type', '-t <t:number>')
        .action(async ({ session, options }, username) => {
            const selfId = await getBindingId(ctx, session)

            const user = await ctx.osu_funny.getUserFromDatabase(selfId)
            let mode = options.type
            const mods = options.mods

            let keyCount = '4,7'

            if (user && !username) {
                username = user.username
                mode = mode ?? user.mode
            }

            if (!username) {
                return session.text('.no-username')
            }

            if (mode === 1 || mode === 2) {
                return session.text('.invalid-mode')
            }

            if (mods === '4K') {
                keyCount = '4'
            } else if (mods === '7K') {
                keyCount = '7'
            }

            const userId =
                username === user.username
                    ? user.user_id
                    : (await ctx.osu_funny.getUser(selfId, username)).id

            const [recommendBeatmap, status] =
                await ctx.osu_funny.getRecommendBeatmap(
                    userId,
                    keyCount,
                    mods,
                    mode,
                    options.force ?? false
                )

            if (status === 1) {
                // 玩的图太少了
                return session.text('.no-beatmap')
            } else if (status === 2) {
                // 没图可推了
                return session.text('.no-recommend-beatmap')
            } else if (status === 3) {
                // 未知错误
                return session.text('unknown-error')
            }

            return session.text('.beatmap-recommend', {
                at: h.at(session.userId),
                name:
                    recommendBeatmap.mapName +
                    ' ' +
                    recommendBeatmap.mod.filter((m) => m !== 'NM').join(' '),
                star: Number(recommendBeatmap.difficulty).toFixed(2),
                pp: Number(recommendBeatmap.predictPP).toFixed(2),
                percent: Number(recommendBeatmap.passPercent * 100).toFixed(2),
                cover: h.image(recommendBeatmap.mapCoverUrl),
                beatmap: recommendBeatmap.mapLink
            })
        })

    ctx.command('osu-funny.set-mode <mode:number>').action(
        async ({ session }, mode) => {
            const selfId = await getBindingId(ctx, session)
            const user = await ctx.osu_funny.getUserFromDatabase(selfId)

            if (!user) {
                return session.text('not-bind')
            }

            if (mode < 0 || mode > 3) {
                return session.text('.invalid-mode')
            }

            const displayMode = await ctx.osu_funny.setMode(selfId, mode)

            return session.text('.current-mode', [displayMode])
        }
    )

    ctx.command('osu-funny.info [username:string]')
        .option('type', '-t <t:number>')
        .action(async ({ session, options }, username) => {
            const selfId = await getBindingId(ctx, session)
            const user = await ctx.osu_funny.getUserFromDatabase(selfId)

            if (!user && !username) {
                return session.text('not-bind')
            }

            username = username ?? user?.username

            const mode = options.type ?? user?.mode ?? 0

            try {
                const osuUser = await ctx.osu_funny.getUser(
                    session.selfId,
                    username,
                    mode
                )

                return session.text(
                    '.user-info',
                    Object.assign({}, osuUser, {
                        avatar_url: h.image(osuUser.avatar_url),
                        playmode: getDisplayOsuMode(mode),
                        play_time: formatTimeToDay(
                            osuUser.statistics.play_time
                        ),
                        play_time_hours: formatTimeToHours(
                            osuUser.statistics.play_time
                        )
                    })
                )
            } catch (e) {
                ctx.logger.error(e)
                return session.text('unknown-error')
            }
        })
}

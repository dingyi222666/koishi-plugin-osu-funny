import { Context, h } from 'koishi'
import { Config } from '.'
import { getDisplayOsuMode, withResolver } from './utils'

export function apply(ctx: Context, config: Config) {
    ctx.command('osu-funny.bind').action(async ({ session }) => {
        const selfId = session.selfId

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
            1000 * 60 * 3
        )

        // 轮询查询是否绑定成功

        interval = ctx.setInterval(async () => {
            const bindStatus = ctx.osu_funny._bindQueue.get(selfId)

            if (bindStatus === selfId) {
                return
            }

            await recallMessage()
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
        }, 100)

        await promise
    })

    ctx.command('osu-funny.unbind').action(async ({ session }) => {
        const selfId = session.selfId

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

    ctx.command('osu-funny.recommend [user:string]')
        .option('force', '-f <f:boolean>')
        .option('mods', '-m <m:string>')
        .option('type', '-t <t:number>')
        .action(async ({ session, options }, username) => {
            const selfId = session.selfId
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
                at: h('quote', { id: session.messageId }),
                name:
                    recommendBeatmap.mapName +
                    ' ' +
                    recommendBeatmap.mod.filter((m) => m !== 'NM').join(' '),
                star: Number(recommendBeatmap.difficulty).toFixed(2),
                pp: Number(recommendBeatmap.predictPP).toFixed(2),
                percent: Number(recommendBeatmap.passPercent * 100).toFixed(2),
                cover: h.image(recommendBeatmap.mapCoverUrl, { cache: false }),
                beatmap: recommendBeatmap.mapLink
            })
        })

    ctx.command('osu-funny.set-mode <mode:number>').action(
        async ({ session }, mode) => {
            const user = await ctx.osu_funny.getUserFromDatabase(session.selfId)

            if (!user) {
                return session.text('not-bind')
            }

            if (mode < 0 || mode > 3) {
                return session.text('.invalid-mode')
            }

            const displayMode = await ctx.osu_funny.setMode(
                session.selfId,
                mode
            )

            return session.text('.current-mode', [displayMode])
        }
    )
}

import { Context, h } from 'koishi'
import { Config } from '.'
import { getDisplayOsuMode, withResolver } from './utils'

export function apply(ctx: Context, config: Config) {
    ctx.command('osu-funny.bind', '绑定osu账号').action(async ({ session }) => {
        const selfId = session.selfId

        const user = await ctx.osu_funny.getUser(selfId)

        if (user) {
            return session.text('.already-bind-v2')
        }

        const url = ctx.osu_funny.getBindUrl(selfId)

        const messageIds = await session.send(session.text('.go-oauth', [url]))

        const { promise, resolve } = withResolver<void>()

        const recallMessage = async () => {
            try {
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
            ctx.osu_funny._bindQueue.delete(selfId)
            await session.send(msg)
        }, 100)

        await promise
    })

    ctx.command('osu-funny.unbind', '解绑osu账号').action(
        async ({ session }) => {
            const selfId = session.selfId

            const user = await ctx.osu_funny.getUser(selfId)

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
        }
    )

    ctx.command('osu-funny.getbg <beatmapId: string>', '获取osu背景').action(
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
}

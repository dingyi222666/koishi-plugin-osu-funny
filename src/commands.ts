import { Context } from 'koishi'
import { Config } from '.'
import { getDisplayOsuMode, withResolver } from './utils'

export function apply(ctx: Context, config: Config) {
    ctx.command('osu-funny.bind', '绑定osu账号').action(async ({ session }) => {
        const selfId = session.selfId

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
}

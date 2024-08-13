import { Context } from 'koishi'
import { Config } from '.'

export function apply(ctx: Context, config: Config) {
    ctx.database.extend(
        'osu_funny_user',
        {
            username: 'string',
            platform_id: 'string',
            user_id: 'integer',
            mode: {
                type: 'integer',
                initial: 0
            },
            token: 'string',
            refresh_token: 'string',
            expires_in: 'integer'
        },
        {
            autoInc: false,
            primary: 'username'
        }
    )

    ctx.database.extend(
        'osu_funny_real_user',
        {
            username: 'string',
            profile_colour: 'string',
            id: 'integer',
            avatar_url: 'string',
            country_code: 'string',
            is_deleted: 'boolean',
            is_supporter: 'boolean',
            is_bot: 'boolean'
        },
        {
            autoInc: false,
            primary: 'id'
        }
    )
}

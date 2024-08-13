import { OsuModeString } from './database'

/**  {
  "id": 2,
  "username": "peppy",
  "profile_colour": "#3366FF",
  "avatar_url": "https://a.ppy.sh/2?1519081077.png",
  "country_code": "AU",
  "is_active": true,
  "is_bot": false,
  "is_deleted": false,
  "is_online": true,
  "is_supporter": true
}
 */
export interface OsuUser {
    id: number
    username: string
    profile_colour: string
    avatar_url: string
    country_code: string
    is_deleted: boolean
    is_supporter: boolean
    is_bot: boolean
}

export interface OsuUserExtends {
    avatar_url: string
    country_code: string
    default_group: string
    id: number
    is_active: boolean
    is_bot: boolean
    is_deleted: boolean
    is_online: boolean
    is_supporter: boolean
    last_visit: string // Assuming ISO date string
    pm_friends_only: boolean
    profile_colour: string
    username: string
    cover_url: string
    discord: string
    has_supported: boolean
    interests: null | string
    join_date: string // Assuming ISO date string
    kudosu: Kudosu
    location: null | string
    max_blocks: number
    max_friends: number
    occupation: null | string
    playmode: OsuModeString
    playstyle: string[]
    post_count: number
    profile_hue: number
    profile_order: string[]
    title: null | string
    twitter: string
    website: string
    country: Country
    cover: Cover
    is_restricted: boolean
    account_history: AccountHistoryItem[]
    active_tournament_banner: null | string
    badges: Badge[]
    favourite_beatmapset_count: number
    follower_count: number
    graveyard_beatmapset_count: number
    groups: Group[]
    loved_beatmapset_count: number
    monthly_playcounts: MonthlyPlaycount[]
    page: Page
    pending_beatmapset_count: number
    previous_usernames: string[]
    ranked_beatmapset_count: number
    replays_watched_counts: ReplaysWatchedCount[]
    scores_first_count: number
    statistics: Statistics
    support_level: number
    user_achievements: UserAchievement[]
    rank_history: RankHistory
}

interface Kudosu {
    total: number
    available: number
}

interface Country {
    code: string
    name: string
}

interface Cover {
    custom_url: string
    url: string
    id: null | number
}

interface AccountHistoryItem {
    // Assuming additional properties if needed
}

interface Badge {
    awarded_at: string // Assuming ISO date string
    description: string
    image_url: string
    image_2x_url: string
    url: string
}

interface Group {
    id: number
    identifier: string
    name: string
    short_name: string
    description: string
    colour: string
}

interface MonthlyPlaycount {
    start_date: string // Assuming ISO date string
    count: number
}

interface Page {
    html: string
    raw: string
}

interface ReplaysWatchedCount {
    start_date: string // Assuming ISO date string
    count: number
}

interface Level {
    current: number
    progress: number
}

interface GradeCounts {
    ss: number
    ssh: number
    s: number
    sh: number
    a: number
}

interface Rank {
    global: number
    country: number
}

interface Statistics {
    level: Level
    pp: number
    global_rank: number
    ranked_score: number
    hit_accuracy: number
    play_count: number
    play_time: number
    total_score: number
    total_hits: number
    maximum_combo: number
    replays_watched_by_others: number
    is_ranked: boolean
    grade_counts: GradeCounts
    rank: Rank
}

interface UserAchievement {
    achieved_at: string // Assuming ISO date string
    achievement_id: number
}

interface RankHistory {
    mode: string
    data: number[]
}

import { OsuUser } from './user'

interface Covers {
    cover: string
    card: string
    list: string
    slimcover: string
}

export interface OsuBeatmapset {
    artist: string
    artist_unicode: string
    covers: Covers
    creator: string
    favourite_count: number
    id: number
    nsfw: boolean
    play_count: number
    preview_url: string
    source: string
    title: string
    title_unicode: string
    beatmapset_id?: number
    user_id: number
    status: string
    video: boolean
    converts?: string
    description?: string
    has_favourited?: boolean
    language?: string
    user?: OsuUser
    total_length?: number
}

export interface BeatmapsetExtend extends OsuBeatmapset {
    bpm?: number
    can_be_hyped?: boolean
    ranked?: number
    ranked_date?: string
    tags?: string
}

export interface OsuBeatmap {
    beatmapset_id: number
    difficulty_rating: number
    id: number
    mode: 'fruits' | 'mania' | 'osu' | 'taiko'
    status: string
    total_length: number
    user_id: number

    beatmapset?: OsuBeatmapset
    checksum?: string
    max_combo?: number
    version: string
}

export interface OsuBeatmapExtend {
    accuracy: number
    ar: number
    bpm?: number
    convert: boolean
    count_circles: number
    count_sliders: number
    count_spinners: number
    cs: number
    deleted_at?: string
    drain: number
    hit_length: number
    is_scoreable: boolean
    last_updated: string
    mode_int: number
    passcount: number
    playcount: number
    ranked: number
    url: string
}

export interface BackgroundsAttributes {
    url: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: Record<string, any>
}

export interface SeasonalBackgrounds {
    ends_at: string
    backgrounds: BackgroundsAttributes[]
}

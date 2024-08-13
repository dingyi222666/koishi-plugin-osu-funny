import { OsuBeatmap, OsuBeatmapset } from './beatmap'
import { OsuUser } from './user'

// Define the Statistics type
export interface Statistics {
    count_50?: number
    count_100?: number
    count_300?: number
    count_geki?: number
    count_katu?: number
    count_miss?: number
}

// Define the Score type
export interface OsuScore {
    id?: number
    best_id?: number
    user_id: number
    accuracy: number
    mods: string[]
    score: number
    max_combo: number
    perfect: number
    statistics: Statistics
    passed: boolean
    pp?: number
    rank: string
    created_at: string
    mode: 'fruits' | 'mania' | 'osu' | 'taiko'
    mode_int: number
    beatmap?: OsuBeatmap
    beatmapset?: OsuBeatmapset
    match?: Record<string, never>
}

export interface OsuV1Score {
    beatmap_id: number
    beatmapset_id: number
    enabled_mods: string
    user_id: number
    date: string
    rank: string
    pp: string
    replay_available: string
}

// Define the BeatmapUserScore type
export interface OsuBeatmapUserScore {
    position: number
    score: OsuScore
}

// Define the NewStatistics type
export interface NewStatistics {
    great?: number
    large_tick_hit?: number
    small_tick_hit?: number
    small_tick_miss?: number
    miss?: number
    ok?: number
    meh?: number
    good?: number
    perfect?: number
}

// Define the Settings type
export interface Settings {
    speed_change?: number
    circle_size?: number
    approach_rate?: number
    overall_difficulty?: number
    drain_rate?: number
}

// Define the Mod type
export interface OsuMod {
    acronym: string
    settings?: Settings
}

// Define the NewScore type
export interface OsuNewScore {
    accuracy: number
    beatmap_id: number
    best_id?: number
    build_id?: number
    ended_at: string
    has_replay: boolean
    id: number
    is_perfect_combo: boolean
    legacy_perfect: boolean
    legacy_score_id?: number
    legacy_total_score: number
    max_combo: number
    maximum_statistics?: Statistics
    mods: OsuMod[]
    passed: boolean
    playlist_item_id?: number
    pp?: number
    preserve: boolean
    rank: string
    ranked: boolean
    room_id?: number
    ruleset_id: number
    started_at?: string
    statistics?: NewStatistics
    total_score: number
    type: string
    user_id: number
    beatmap?: OsuBeatmap
    beatmapset?: OsuBeatmapset

    position?: number
    rank_country?: number
    rank_global?: number
    user?: OsuUser
}

// Define the Data interface
export interface Data {
    next: number
    prev: number
    total: number
    list: OsuScorePrediction[]
}

// Define the RecommendData interface
export interface RecommendData {
    code: number
    message: string
    success: boolean
    data?: Data | null // Optional Data object or null
}

/** {
    "id": "4294726/NM/4/3",
    "mapName": "HALL - [4K] NULL",
    "mapLink": "https://osu.ppy.sh/beatmaps/4294726",
    "mapCoverUrl": "https://assets.ppy.sh/beatmaps/2055332/covers/cover.jpg",
    "mod": [
        "NM"
    ],
    "difficulty": 8.28,
    "keyCount": 4,
    "currentAccuracy": 0.9504745478640475,
    "currentSpeed": -1,
    "currentMod": [
        "HT"
    ],
    "currentAccuracyLink": "https://osu.ppy.sh/scores/mania/578218870",
    "currentPP": 395.5611354855541,
    "predictAccuracy": 0.9060762004071621,
    "predictPP": 469.10475155968277,
    "newRecordPercent": 1,
    "ppIncrement": 52.50081302611852,
    "passPercent": 0.5591099858283997,
    "ppIncrementExpect": 29.35372882701259,
    "accurate": true
} */
export interface OsuScorePrediction {
    id: string
    mapName: string
    mapLink: string
    mapCoverUrl: string
    mod: string[]
    difficulty: number
    keyCount: number
    currentAccuracy: number
    currentSpeed: number
    currentMod: string[]
    currentAccuracyLink: string
    currentPP: number
    predictAccuracy: number
    predictPP: number
    newRecordPercent: number
    ppIncrement: number
    passPercent: number
    ppIncrementExpect: number
    accurate: boolean
}

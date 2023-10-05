export interface SimulateRequest {
    monsterId: string;
    dungeonId: string;
}

export interface SimulateResponse {
    isSuccess: boolean;
    stats: SimulateStats;
    error?: string;
}

export interface SimulateStats {
    kills: number;
    deaths: number;
    gp: number;
    sc: number;
    highestDamageTaken: number;
    lowestHitpoints: number;
    usedAmmo: number;
    usedFood: number;
    usedPotions: number;
    usedPrayerPoints: number;
    usedConsumabes: number;
    usedRunes: { [index: string]: number };
    usedCominationRunes: number;
    usedCharges: { summon1: number; summon2: number };
    skillXp: { [index: string]: number };
}

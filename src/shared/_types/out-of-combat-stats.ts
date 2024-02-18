export interface OutOfCombatStats {
    attackInterval: number;
    summoningInteval: number;
    respawnInterval: number;
    minimumHit: number;
    maximumHit: number;
    summoningHit: number;
    summoningBarrierHit: number;
    accuracy: number;
    evasion: {
        melee: number;
        ranged: number;
        magic: number;
    };
    hitpoints: number;
    damageReduction: number;
    uncappedDamageReduction: number;
    autoEatThreshold: number;
    doubling: number;
    gp: number;
}

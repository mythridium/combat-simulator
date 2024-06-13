import { BaseStore } from './_base.store';

export interface StatsState {
    attackInterval: number;
    summonAttackInterval: number;
    respawnInterval: number;
    minHit: number;
    maxHit: number;
    summoningMaxHit: number;
    summoningBarrierMaxHit: number;
    critChance: number;
    critDamage: number;
    maxAttackRoll: number;
    maxDefRoll: number;
    maxRngDefRoll: number;
    maxMagDefRoll: number;
    maxHitpoints: number;
    damageReduction: number;
    abyssalResistance: number;
    autoEatThreshold: number;
    slayerAreaNegation: number;
    abyssalSlayerAreaNegation: number;
    lootBonusPercent: number;
    gpBonus: number;
}

export class StatsStore extends BaseStore<StatsState> {
    constructor() {
        super({
            attackInterval: 4000,
            summonAttackInterval: 3000,
            respawnInterval: 3000,
            minHit: 0,
            maxHit: 0,
            summoningMaxHit: 0,
            summoningBarrierMaxHit: 0,
            critChance: 0,
            critDamage: 0,
            maxAttackRoll: 0,
            maxDefRoll: 0,
            maxRngDefRoll: 0,
            maxMagDefRoll: 0,
            maxHitpoints: 0,
            damageReduction: 0,
            abyssalResistance: 0,
            autoEatThreshold: 0,
            slayerAreaNegation: 0,
            abyssalSlayerAreaNegation: 0,
            lootBonusPercent: 0,
            gpBonus: 0
        });
    }
}

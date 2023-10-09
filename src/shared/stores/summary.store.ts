import { Source, SyncState, SyncStore } from './sync.store';

export interface SummaryState extends SyncState {
    attackInterval: number;
    accuracy: number;
    damageReduction: number;
    uncappedDamageReduction: number;
    evasion: {
        melee: number;
        ranged: number;
        magic: number;
    };
    maxHitpoints: number;
    maxHit: number;
    minHit: number;
    summoningMaxHit: number;
    barrierMaxHit: number;
    autoEatThreshold: number;
    dropDoublingPercentage: number;
    gpMultiplier: number;
}

export class SummaryStore extends SyncStore<SummaryState> {
    constructor() {
        super({
            source: Source.Default,
            attackInterval: 0,
            accuracy: 0,
            damageReduction: 0,
            uncappedDamageReduction: 0,
            evasion: {
                melee: 0,
                ranged: 0,
                magic: 0
            },
            maxHitpoints: 0,
            maxHit: 0,
            minHit: 0,
            summoningMaxHit: 0,
            barrierMaxHit: 0,
            autoEatThreshold: 0,
            dropDoublingPercentage: 0,
            gpMultiplier: 0
        });
    }
}

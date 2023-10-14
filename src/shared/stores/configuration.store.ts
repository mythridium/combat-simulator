import { Source, SyncState, SyncStore } from './sync.store';

export interface ConfigurationState extends SyncState {
    isSynergyEnabled: boolean;
    isManualEating: boolean;
    isSolarEclipse: boolean;
    isSlayerTask: boolean;
    cookingPool: boolean;
    cookingMastery: boolean;
    useCombinationRunes: boolean;
    autoEatTier: string;
    attackStyle: string;
    trials: number;
    ticks: number;
}

export class ConfigurationStore extends SyncStore<ConfigurationState> {
    constructor() {
        super({
            source: Source.Default,
            isSynergyEnabled: true,
            isManualEating: false,
            isSolarEclipse: false,
            isSlayerTask: false,
            cookingPool: false,
            cookingMastery: false,
            useCombinationRunes: false,
            autoEatTier: '-1',
            attackStyle: 'melvorD:Stab',
            trials: 1000,
            ticks: 1000
        });
    }
}

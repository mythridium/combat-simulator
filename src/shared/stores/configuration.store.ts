import { Source, SyncState, SyncStore } from './sync.store';

export interface ConfigurationState extends SyncState {
    isManualEating: boolean;
    isSolarEclipse: boolean;
    isSlayerTask: boolean;
    cookingPool: boolean;
    cookingMastery: boolean;
    useCombinationRunes: boolean;
    trials: number;
    ticks: number;
}

export class ConfigurationStore extends SyncStore<ConfigurationState> {
    constructor() {
        super({
            source: Source.Default,
            isManualEating: false,
            isSolarEclipse: false,
            isSlayerTask: false,
            cookingPool: false,
            cookingMastery: false,
            useCombinationRunes: false,
            trials: 1000,
            ticks: 1000
        });
    }
}

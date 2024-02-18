import { BaseStore } from './base.store';

export interface ConfigurationState {
    isSynergyEnabled: boolean;
    trials: number;
    ticks: number;
    gamemode: string;
}

export class ConfigurationStore extends BaseStore<ConfigurationState> {
    constructor() {
        super({
            isSynergyEnabled: true,
            gamemode: '',
            trials: 1000,
            ticks: 1000
        });
    }
}

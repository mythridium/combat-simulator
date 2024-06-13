import { BaseStore } from './_base.store';

export interface SimulatorState {
    trials: number;
    ticks: number;
    startTime: number;
    isRunning: boolean;
    trackHistory: boolean;
}

export class SimulatorStore extends BaseStore<SimulatorState> {
    constructor() {
        super({ trials: 1000, ticks: 1000, startTime: 0, isRunning: false, trackHistory: false });
    }
}

import { ISimResult } from 'src/shared/simulator/sim-manager';

export interface SimulateRequest {
    saveString: string;
    monsterId: string;
    dungeonId: string;
    trials: number;
    maxTicks: number;
}

export interface SimulateResponse {
    monsterId: string;
    dungeonId: string;
    result: ISimResult | Result;
    time: number;
}

export interface Result {
    simSuccess: boolean;
    reason: string;
}

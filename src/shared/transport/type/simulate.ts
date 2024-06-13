import { SimulationResult } from 'src/shared/simulator/sim-manager';

export interface SimulateRequest {
    saveString: string;
    monsterId: string;
    entityId: string;
    trials: number;
    maxTicks: number;
}

export interface SimulateResponse {
    monsterId: string;
    entityId: string;
    result: SimulationResult | Result;
    time: number;
}

export interface Result {
    simSuccess: boolean;
    reason: string;
    stack?: string;
}

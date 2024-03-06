import { SimulateRequest } from 'src/shared/transport/type/simulate';
import { Simulator } from './worker/simulator';

export interface CheckRequirements {
    requirements: AnyRequirement[];
    notifyOnFailure?: boolean;
    slayerLevelReq?: number;
    checkSlayer?: boolean;
}

export class Simulation {
    /** Simulator is responsible for actually running the simulation. */
    public readonly simulator = new Simulator();

    public async init() {
        return this.simulator.init();
    }

    public async simulate(request: SimulateRequest) {
        return this.simulator.simulate(request);
    }

    public async cancel() {
        return this.simulator.cancel();
    }
}

import { SimulateRequest } from 'src/shared/transport/type/simulate';
import { Simulator } from './worker/simulator';
import { RequirementConverter } from 'src/shared/converter/requirement';
import { Global } from './global';
import { UpdateRequest } from 'src/shared/transport/type/update';

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

    public checkRequirements(request: CheckRequirements) {
        return this.simulator.checkRequirements({
            requirements: RequirementConverter.toData(request.requirements),
            notifyOnFailure: request.notifyOnFailure,
            slayerLevelReq: request.slayerLevelReq,
            checkSlayer: request.checkSlayer
        });
    }

    public update<TKey extends keyof typeof Global.stores>(request: UpdateRequest<TKey>) {
        return this.simulator.update(request);
    }

    public import() {
        return this.simulator.import();
    }
}

import { MessageAction } from 'src/shared/transport/message';
import { InitPayload } from './payload/init';
import { WebWorker } from './web-worker';
import { SimulateRequest } from 'src/shared/transport/type/simulate';
import { CheckRequirementsRequest } from 'src/shared/transport/type/check-requirements';
import { Global } from 'src/app/global';
import { UpdateRequest } from 'src/shared/transport/type/update';
import { BaseStore } from 'src/shared/stores/base.store';

export class Simulator {
    private readonly worker = new WebWorker();

    public init() {
        const payload = new InitPayload();

        return this.worker.send({
            action: MessageAction.Init,
            data: {
                origin: payload.origin,
                scripts: payload.scripts,
                entitlements: {
                    toth: cloudManager.hasTotHEntitlement,
                    aod: cloudManager.hasAoDEntitlement
                }
            }
        });
    }

    public simulate(request: SimulateRequest) {
        return this.worker.send({
            action: MessageAction.Simulate,
            data: {
                monsterId: request.monsterId,
                dungeonId: request.dungeonId,
                trials: request.trials,
                maxTicks: request.maxTicks
            }
        });
    }

    public cancel() {
        return this.worker.send({ action: MessageAction.Cancel, data: undefined });
    }

    public checkRequirements(request: CheckRequirementsRequest) {
        return this.worker.send({ action: MessageAction.CheckRequirements, data: request });
    }

    public update<TKey extends keyof typeof Global.stores>(data: UpdateRequest<TKey>) {
        return this.worker.send({ action: MessageAction.Update, data });
    }

    public import() {
        const stores = {} as any;

        for (const [key, value] of Object.entries(Global.stores) as [string, BaseStore<any>][]) {
            stores[key] = value.state;
        }

        return this.worker.send({ action: MessageAction.Import, data: stores });
    }
}

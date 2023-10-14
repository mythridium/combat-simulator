import { WebWorker } from './web-worker';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { Source, SyncState } from 'src/shared/stores/sync.store';
import { ModalQueue } from 'src/app/interface/modules/modal-queue';
import { SimulateRequest } from 'src/shared/messages/message-type/simulate';
import { Queue, Task, TaskRunner } from './queue';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';
import { StateRequest } from 'src/shared/messages/message-type/state';
import { Scripts } from './scripts';
import { Mods } from 'src/app/modules/mods';

export class QueueRun {
    cancel: () => void;
    promise: Promise<void>;
}

export class Workers {
    public primary: WebWorker;
    public queue?: QueueRun;

    public readonly url: string;
    private workers: WebWorker[] = [];

    private get threads() {
        return Global.workers.state.useMaxCPU ? navigator.hardwareConcurrency - 1 : 1;
    }

    constructor(private readonly mods: Mods, private readonly modalQueue: ModalQueue) {
        this.url = Global.context.getResourceUrl('src/worker.mjs');
        this.syncToPrimary('equipment', 'configuration');

        Global.workers.when(Source.Interface).subscribe(async ({ useMaxCPU }) => {
            if (useMaxCPU) {
                localStorage.setItem('mcs-use-max-cpu', 'true');
            } else {
                localStorage.removeItem('mcs-use-max-cpu');
            }

            await this.init();
        });
    }

    public async init() {
        Global.workers.setState(Source.Worker, { isLoading: true });

        this.createWorkers();

        let isSuccess = false;
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvorIdle';
        }

        const data: InitRequest = {
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            },
            dataPackages: this.mods.dataPackages,
            modifierData: this.mods.moddedModifierData
        };

        try {
            const requests = this.workers.map(worker => worker.send({ action: MessageAction.Init, data }));

            await Promise.all(requests);

            isSuccess = true;
        } catch (exception) {
            Global.logger.error(exception);
            this.modalQueue.add(exception);
        }

        Global.workers.setState(Source.Worker, { isLoading: false });
        return isSuccess;
    }

    public simulate(requests: SimulateRequest[]) {
        const runners = this.workers.map(worker => new TaskRunner(worker));
        const tasks = requests.map(data => new Task({ action: MessageAction.Simulate, data }));
        const queue = new Queue(runners, tasks);

        Global.simulation.setState(Source.Worker, { state: State.Running, result: [] });

        const message = {
            action: MessageAction.State,
            data: { equipment: Global.equipment.state, configuration: Global.configuration.state }
        };

        const promise = this.send(message)
            .then(() =>
                queue.run(task => {
                    const state = Global.simulation.getState();

                    state.result.push({
                        monsterId: task.request.data.monsterId,
                        dungeonId: task.request.data.monsterId,
                        ...task.result
                    });

                    Global.simulation.setState(Source.Worker, state);
                })
            )
            .then(() => {
                Global.simulation.setState(Source.Worker, { state: State.Stopped });
                this.queue = undefined;
            });

        this.queue = {
            cancel: () => {
                Global.simulation.setState(Source.Worker, { state: State.Cancelling });
                queue.cancel();
            },
            promise
        };
    }

    public async send<K extends MessageAction>(message: MessageRequest<K>) {
        const requests = this.workers.map(async worker => worker.send(message));

        await Promise.all(requests);
    }

    private createWorkers() {
        for (const worker of this.workers) {
            worker.terminate();
        }

        this.workers = [];

        const threads = Math.max(this.threads, 1);

        for (let i = 0; i < threads; i++) {
            const worker = new WebWorker(this.url, i + 1);

            if (i === 0) {
                this.primary = worker;
            }

            this.workers.push(worker);
        }
    }

    private syncToPrimary(item: keyof StateRequest, ...items: (keyof StateRequest)[]) {
        const keys = [item, ...items];

        for (const key of keys) {
            Global[key].when(Source.Interface).subscribe(async () => {
                const state = Global[key].getState();

                const data: { [key: string]: Omit<SyncState, 'source'> } = {};
                data[key] = state;

                const summary = await this.primary.send({ action: MessageAction.State, data });

                Global.summary.setState(Source.Worker, summary);
            });
        }
    }
}

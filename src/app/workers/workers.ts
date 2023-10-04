import { WebWorker } from './web-worker';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { Source, SyncState, SyncStore } from 'src/shared/stores/sync.store';
import { ModalQueue } from 'src/app/interface/modal-queue';
import { SimulateRequest } from 'src/shared/messages/message-type/simulate';
import { Queue, Task, TaskRunner } from './queue';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';
import { StateRequest } from 'src/shared/messages/message-type/state';

export class QueueRun {
    cancel: () => void;
    promise: Promise<void>;
}

export class Workers {
    public primary: WebWorker;
    public queue?: QueueRun;

    public readonly url: string;
    private readonly workers: WebWorker[] = [];

    constructor(private readonly context: Modding.ModContext, private readonly modalQueue: ModalQueue) {
        this.url = this.context.getResourceUrl('src/worker.mjs');
        const threads = Math.max(navigator.hardwareConcurrency - 1, 1);

        for (let i = 0; i < threads; i++) {
            const worker = new WebWorker(this.url, i + 1);

            if (i === 0) {
                this.primary = worker;
            }

            this.workers.push(worker);
        }

        this.syncToPrimary('equipment', 'configuration');
    }

    public async init(data: InitRequest) {
        let isSuccess = false;

        try {
            const requests = this.workers.map(worker => worker.send({ action: MessageAction.Init, data }));

            await Promise.all(requests);

            isSuccess = true;
        } catch (exception) {
            Global.logger.error(exception);
            this.modalQueue.add(exception);
        }

        return isSuccess;
    }

    public simulate(requests: SimulateRequest[]) {
        const runners = this.workers
            .filter((_, index) => index + 1 <= this.threads())
            .map(worker => new TaskRunner(worker));

        const tasks = requests.map(data => new Task({ action: MessageAction.Simulate, data }));
        const queue = new Queue(runners, tasks);

        Global.simulation.setState(Source.Worker, { state: State.Running, result: [] });

        const promise = queue
            .run(task => {
                const state = Global.simulation.getState();

                state.result.push({
                    monsterId: task.request.data.monsterId,
                    dungeonId: task.request.data.monsterId,
                    ...task.result
                });

                Global.simulation.setState(Source.Worker, state);
            })
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

    private threads() {
        if (self.mcs.isDebug) {
            return 1;
        }

        let threads: null | string | number = localStorage.getItem('mcs-threads');

        if (threads) {
            try {
                threads = parseInt(threads, 10) || 1;
                return threads;
            } catch {}
        }

        return Math.max(navigator.hardwareConcurrency - 1, 1);
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

import { WebWorker } from './web-worker';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { Source } from 'src/shared/stores/sync.store';
import { ModalQueue } from 'src/app/interface/modal-queue';
import { SimulateRequest } from 'src/shared/messages/message-type/simulate';
import { Queue, Task, TaskRunner } from './queue';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';

export class QueueRun {
    cancel: () => void;
    promise: Promise<void>;
}

export class Workers {
    public get primary() {
        return this.workers[0];
    }

    public queue?: QueueRun;

    public readonly url: string;
    private readonly workers: WebWorker[] = [];

    constructor(private readonly context: Modding.ModContext, private readonly modalQueue: ModalQueue) {
        this.url = this.context.getResourceUrl('src/worker.mjs');
        const threads = self.mcs.isDebug ? 1 : Math.max(navigator.hardwareConcurrency - 1, 1);

        for (let i = 0; i < threads; i++) {
            const worker = new WebWorker(this.url);
            this.workers.push(worker);
        }

        Global.equipment.when(Source.Interface).subscribe(async () => {
            const summary = await this.primary.send({
                action: MessageAction.State,
                data: { equipment: Global.equipment.getState() }
            });

            Global.summary.setState(Source.Worker, summary);
        });
    }

    public async init(payload: Omit<InitRequest, 'workerId'>) {
        let isSuccess = false;

        try {
            const requests = this.workers.map(async (worker, index) => {
                const data: InitRequest = { workerId: index + 1, ...payload };
                return worker.send({ action: MessageAction.Init, data });
            });

            await Promise.all(requests);
            isSuccess = true;
        } catch (exception) {
            Global.logger.error(exception);
            this.modalQueue.add(exception);
        }

        return isSuccess;
    }

    public simulate(requests: SimulateRequest[]) {
        const runners = this.workers.map(worker => new TaskRunner(worker));
        const tasks = requests.map(data => new Task({ action: MessageAction.Simulate, data }));
        const queue = new Queue(runners, tasks);

        Global.simulation.setState({
            source: Source.Worker,
            state: State.Running,
            result: []
        });

        const promise = queue
            .run(task => {
                const state = Global.simulation.getState();

                Global.simulation.setState({
                    ...state,
                    source: Source.Worker,
                    result: [
                        ...state.result,
                        {
                            monsterId: task.request.data.monsterId,
                            dungeonId: task.request.data.monsterId,
                            isSuccess: task.result.isSuccess,
                            error: task.result.error
                        }
                    ]
                });
            })
            .then(() => {
                Global.simulation.setState({ ...Global.simulation.getState(), state: State.Stopped });
                this.queue = undefined;
            });

        this.queue = {
            cancel: () => {
                Global.simulation.setState({ ...Global.simulation.getState(), state: State.Cancelling });
                queue.cancel();
            },
            promise
        };
    }

    public async send<K extends MessageAction>(message: MessageRequest<K>) {
        const requests = this.workers.map(async worker => worker.send(message));

        await Promise.all(requests);
    }
}

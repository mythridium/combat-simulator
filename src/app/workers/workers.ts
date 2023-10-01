import { Logger } from 'src/shared/logger';
import { WebWorker } from './web-worker';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { GameState } from 'src/app/state/game';
import { Source } from 'src/shared/stores/sync.store';
import { ModalQueue } from 'src/app/interface/modal-queue';
import { SimulateRequest } from 'src/shared/messages/message-type/simulate';
import { Queue, Task, TaskRunner } from './queue';
import { SimulationState } from 'src/app/state/simulation';

export class Workers {
    public get primary() {
        return this.workers[0];
    }

    public get isSimulationRunning() {
        return this.queue !== undefined;
    }

    public readonly url: string;
    private readonly workers: WebWorker[] = [];
    private queue?: Queue<MessageAction.Simulate>;

    constructor(
        private readonly context: Modding.ModContext,
        private readonly logger: Logger,
        private readonly modalQueue: ModalQueue,
        private readonly state: GameState,
        private readonly simulation: SimulationState
    ) {
        this.url = this.context.getResourceUrl('src/worker.mjs');
        const threads = self.mcs.isDebug ? 1 : Math.max(navigator.hardwareConcurrency - 1, 1);

        for (let i = 0; i < threads; i++) {
            const worker = new WebWorker(this.url, this.logger);
            this.workers.push(worker);
        }

        this.state.equipment.when(Source.Interface).subscribe(async () => {
            const summary = await this.primary.send({
                action: MessageAction.State,
                data: { equipment: this.state.equipment.raw() }
            });

            this.state.summary.setState(Source.Worker, summary);
            console.log(this.state.summary.getState());
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
            this.logger.error(exception);
            this.modalQueue.add(exception);
        }

        return isSuccess;
    }

    public async simulate(requests: SimulateRequest[]) {
        const runners = this.workers.map(worker => new TaskRunner(worker));
        const tasks = requests.map(data => new Task({ action: MessageAction.Simulate, data }));

        this.queue = new Queue(runners, tasks);

        const results = await this.queue.run();

        this.simulation.results.setState({ source: Source.Worker, results });

        this.queue = undefined;
    }

    public async send<K extends MessageAction>(message: MessageRequest<K>) {
        const requests = this.workers.map(async worker => worker.send(message));

        await Promise.all(requests);
    }
}

import { Messages } from 'src/shared/messages/messages';
import { WorkerMock } from './mock';
import { MessageAction } from 'src/shared/messages/message';
import { Simulator } from './simulator/simulator';
import { Global } from './global';

export class WebWorker {
    private readonly simulator: Simulator;
    private readonly messages: Messages;

    constructor(private readonly worker: WorkerGlobalScope & typeof globalThis) {
        WorkerMock.mock();

        this.messages = new Messages(this.worker, Global.logger);
        this.simulator = new Simulator(this.messages);

        this.messages.on(MessageAction.Init, async data => {
            await this.simulator.init(data);

            Global.logger.log(`Worker Loaded`);
        });
    }
}

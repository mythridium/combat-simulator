import { Logger } from 'src/shared/logger';
import { Messages } from 'src/shared/messages/messages';
import { WorkerMock } from './mock';
import { Environment } from './simulator/environment';
import { MessageAction } from 'src/shared/messages/message';

export class WebWorker {
    public isPrimary: boolean = false;
    public workerId: number;
    public environment = new Environment();

    private readonly messages: Messages;

    constructor(private readonly worker: Worker, private readonly logger: Logger) {
        WorkerMock.mock(this.worker);

        this.messages = new Messages(this.worker, this.logger);

        this.messages.on(MessageAction.Init, async data => {
            this.workerId = data.workerId;
            this.isPrimary = data.workerId === 0;
            this.logger.setEntity(`Worker ${data.workerId.toString()}`);

            await this.environment.init(data);

            this.logger.log(`Worker Loaded`);
        });

        this.messages.on(MessageAction.State, async data => {
            console.log(data.player);
        });
    }
}

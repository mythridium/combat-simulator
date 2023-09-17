import { Logger } from 'src/shared/logger';
import { MessageData } from 'src/shared/messages/message-data';
import { Messages } from 'src/shared/messages/messages';

export class WebWorker {
    private readonly worker: Worker;
    private readonly messages: Messages;

    constructor(private readonly url: string, private readonly logger: Logger) {
        this.worker = new Worker(this.url);
        this.messages = new Messages(this.worker, this.logger);
        this.messages.on(data => this.handler(data));
    }

    public async send(data: Omit<MessageData, 'id'>) {
        return this.messages.send(data);
    }

    private async handler(data: MessageData) {
        // this.logger.log(data);
    }
}

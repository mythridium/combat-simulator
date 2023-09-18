import { Logger } from 'src/shared/logger';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { Messages } from 'src/shared/messages/messages';

export class WebWorker {
    private readonly worker: Worker;
    private readonly messages: Messages;

    constructor(private readonly url: string, private readonly logger: Logger) {
        this.worker = new Worker(this.url);
        this.messages = new Messages(this.worker, this.logger);
    }

    public async send<K extends MessageAction>(data: MessageRequest<K>) {
        return this.messages.send(data);
    }
}

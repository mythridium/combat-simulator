import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { Messages } from 'src/shared/messages/messages';
import { Global } from 'src/app/global';

export class WebWorker {
    private readonly worker: Worker;
    private readonly messages: Messages;

    constructor(private readonly url: string) {
        this.worker = new Worker(this.url);
        this.messages = new Messages(this.worker, Global.logger);
    }

    public async send<K extends MessageAction>(data: MessageRequest<K>) {
        return this.messages.send(data);
    }
}

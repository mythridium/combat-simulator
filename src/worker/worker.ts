import { Logger } from 'src/shared/logger';
import { MessageAction, MessageData } from 'src/shared/messages/message-data';
import { Messages } from 'src/shared/messages/messages';
import { WorkerMock } from './mock';

export class WebWorker {
    private readonly messages: Messages;

    constructor(private readonly worker: Worker, private readonly logger: Logger) {
        WorkerMock.mock(this.worker);

        this.messages = new Messages(this.worker, this.logger);
        this.messages.on(data => this.handler(data));
    }

    private async handler(message: MessageData) {
        switch (message.action) {
            case MessageAction.Scripts:
                this.logger.setEntity(`Worker ${message.data.workerId.toString()}`);
                importScripts(...message.data.scripts);
                break;
        }
    }
}

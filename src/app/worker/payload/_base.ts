import { MessageAction, MessageRequest } from 'src/shared/transport/message';
import { Transport } from 'src/shared/transport/transport';

export class BasePayload<K extends MessageAction> {
    public readonly data: MessageRequest<K>;

    constructor(protected readonly transport: Transport) {}

    public async execute() {
        return this.transport.send(this.data);
    }
}

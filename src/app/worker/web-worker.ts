import { Global } from 'src/app/global';
import { Transport } from 'src/shared/transport/transport';
import { MessageAction, MessageRequest } from 'src/shared/transport/message';

export class WebWorker {
    private readonly url = Global.context.getResourceUrl('worker.mjs');
    private readonly worker = new Worker(this.url, { name: 'Worker' });
    private readonly transport = new Transport(this.worker, Global.logger);

    public async send<K extends MessageAction>(payload: MessageRequest<K>) {
        return this.transport.send(payload);
    }
}

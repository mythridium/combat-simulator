import { Global } from 'src/app/global';
import { Transport } from 'src/shared/transport/transport';
import { MessageAction } from 'src/shared/transport/message';
import { BasePayload } from './payload/_base';

export class WebWorker {
    private readonly url = Global.context.getResourceUrl('worker.mjs');
    private readonly worker = new Worker(this.url, { name: 'Worker' });
    private readonly transport = new Transport(this.worker, Global.logger);

    public async send<TAction extends MessageAction, TPayload extends typeof BasePayload<TAction>>(Payload: TPayload) {
        const payload = new Payload(this.transport);

        return payload.execute();
    }
}

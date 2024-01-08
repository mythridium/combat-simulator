import { Global } from 'src/app/global';
import { MessageAction, MessageRequest } from 'src/shared/messaging/message';
import { Messaging } from 'src/shared/messaging/messaging';
import { InitRequest } from 'src/shared/messaging/type/init';
import { Scripts } from './scripts';

export class WebWorker {
    private readonly url: string;
    private readonly worker: Worker;
    private readonly messaging: Messaging;

    private get origin() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvoridle';
        }

        return origin;
    }

    constructor() {
        this.url = Global.context.getResourceUrl('src/worker.mjs');
        this.worker = new Worker(this.url, { name: 'Worker' });
        this.messaging = new Messaging(this.worker, Global.logger);
    }

    public async init() {
        let isSuccess = false;

        try {
            const data: InitRequest = {
                origin: this.origin,
                scripts: Scripts.getScriptsForWorker(),
                entitlements: {
                    full: cloudManager.hasFullVersionEntitlement,
                    toth: cloudManager.hasTotHEntitlement,
                    aod: cloudManager.hasAoDEntitlement
                }
            };

            await this.send({ action: MessageAction.Init, data });

            isSuccess = true;
        } catch (exception) {
            Global.logger.error(exception);
        }

        return isSuccess;
    }

    public async send<K extends MessageAction>(data: MessageRequest<K>) {
        return this.messaging.send(data);
    }
}

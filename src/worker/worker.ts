import { Messaging } from 'src/shared/messaging/messaging';
import { Global } from './global';
import { WorkerMock } from './mock';
import { MessageAction } from 'src/shared/messaging/message';
import { Environment } from './environment';

class Worker {
    private readonly messaging = new Messaging(Global.this, Global.logger);

    constructor() {
        this.messaging.on(MessageAction.Init, async data => {
            const duration = await Global.time(async () => {
                WorkerMock.init();
                await Environment.init(data);
            });

            Global.logger.log(`Initialised in ${duration} ms`);
        });
    }
}

new Worker();

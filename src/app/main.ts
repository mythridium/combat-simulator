import 'src/shared/constants';
import { Global } from './global';
import { WebWorker } from './worker/web-worker';
import { InitPayload } from './worker/payload/init';

export abstract class Main {
    public static async init() {
        const duration = await Global.time(async () => {
            Global.worker = new WebWorker();
            await Global.worker.send(InitPayload);
        });

        Global.logger.log(`Initialised in ${duration} ms`);
    }
}

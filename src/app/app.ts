import { Global } from './global';
import { WebWorker } from './worker/web-worker';

export class App {
    constructor(private readonly context: Modding.ModContext) {
        Global.context = this.context;
    }

    public init() {
        Global.context.onInterfaceReady(async () => {
            const duration = await Global.time(async () => {
                Global.worker = new WebWorker();
                await Global.worker.init();
            });

            Global.logger.log(`Initialised in ${duration} ms`);
        });
    }
}

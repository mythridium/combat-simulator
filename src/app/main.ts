import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './scripts';
import { MessageAction } from 'src/shared/messages/message-data';
import { WebWorker } from './web-worker';

export class App {
    private readonly logger = new Logger('Client', Color.Green);
    private readonly url: string;

    private worker: WebWorker;

    constructor(private readonly context: Modding.ModContext) {
        this.url = this.context.getResourceUrl('src/worker.mjs');

        this.context.onInterfaceReady(async () => {
            this.logger.log('Client Loaded');

            this.worker = new WebWorker(this.url, this.logger);

            await this.init();
        });
    }

    private async init() {
        await this.sendScripts();
    }

    private async sendScripts() {
        const scripts = Scripts.getScriptsForWorker();

        return this.worker.send({ action: MessageAction.Scripts, data: { scripts, workerId: 0 } });
    }
}

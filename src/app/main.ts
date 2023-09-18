import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './scripts';
import { Workers } from './workers/workers';
import { MessageAction } from 'src/shared/messages/message';

export class App {
    private readonly logger = new Logger('Client', Color.Green);

    private workers: Workers;

    constructor(private readonly context: Modding.ModContext) {
        this.context.onInterfaceReady(async () => {
            this.logger.log('Client Loaded');

            this.workers = new Workers(this.context, this.logger);

            await this.init();
        });
    }

    private async init() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvorIdle';
        }

        await this.workers.init({
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            }
        });
    }
}

import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './workers/scripts';
import { Workers } from './workers/workers';
import { Interface } from './interface/interface';
import { GameState } from './state/game';

export class App {
    private readonly logger = new Logger('Client', Color.Green);

    private workers: Workers;
    private interface: Interface;

    constructor(private readonly context: Modding.ModContext, private readonly game: Game) {
        this.context.onInterfaceReady(async () => {
            this.logger.log('Client Loaded');

            const state = new GameState();

            this.workers = new Workers(this.context, this.logger, state);
            this.interface = new Interface(state, this.game);

            await this.init();
        });
    }

    private async init() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvorIdle';
        }

        const isInitialised = await this.workers.init({
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            }
        });

        if (isInitialised) {
            this.interface.init();
        }
    }
}

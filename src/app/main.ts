import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './workers/scripts';
import { Workers } from './workers/workers';
import { Interface } from './interface/interface';
import { GameState } from './state/game';
import { ModalQueue } from './interface/modal-queue';
import { Mods } from './mods';

export class App {
    private readonly logger = new Logger('Client', Color.Green);
    private readonly modalQueue: ModalQueue;
    private readonly mods: Mods;

    private workers: Workers;
    private interface: Interface;

    constructor(private readonly context: Modding.ModContext) {
        this.modalQueue = new ModalQueue(this.context);
        this.mods = new Mods(this.context, this.modalQueue);
        this.mods.init();

        this.context.onInterfaceReady(async () => {
            this.mods.checkDataPackagesForInvalidData();
            await this.mods.checkDataPackages();

            this.logger.log('Client Loaded');

            const state = new GameState();

            this.workers = new Workers(this.context, this.logger, this.modalQueue, state);
            this.interface = new Interface(this.context, state, this.workers);

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
            },
            dataPackages: this.mods.dataPackages,
            modifierData: this.mods.modifierDataToJson()
        });

        if (isInitialised) {
            this.interface.init();
        }
    }
}

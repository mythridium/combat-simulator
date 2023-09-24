import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './workers/scripts';
import { Workers } from './workers/workers';
import { Interface } from './interface/interface';
import { GameState } from './state/game';
import { ModalQueue } from './interface/modal-queue';

export class App {
    private readonly logger = new Logger('Client', Color.Green);
    private readonly modalQueue: ModalQueue;

    private workers: Workers;
    private interface: Interface;

    constructor(private readonly context: Modding.ModContext) {
        this.modalQueue = new ModalQueue(this.context);

        this.context.onInterfaceReady(async () => {
            this.logger.log('Client Loaded');

            const state = new GameState();

            this.workers = new Workers(this.context, this.logger, this.modalQueue, state);
            this.interface = new Interface(this.context, state);

            await this.init();
        });
    }

    private async init() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvorIdle';
        }

        const modDataPackages = this.getModDataPackages();

        const isInitialised = await this.workers.init({
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            },
            modDataPackages
        });

        if (isInitialised) {
            this.interface.init();
        }
    }

    private getModDataPackages(): [DataNamespace, GameDataPackage][] {
        if (!mod.api?.mythCombatSimulatorCore?.mods) {
            this.modalQueue.add(
                `
                <br/><br/>
                [Myth] Combat Simulator Core is not installed.
                <br/><br/>
                <span class="text-warning">Combat Simulator will still work, however no data from mods will be available within the Combat Simulator.</span>
                `,
                false
            );

            return [];
        }

        return mod.api.mythCombatSimulatorCore.mods;
    }
}

import { InitRequest } from 'src/shared/messaging/type/init';
import { Global } from './global';
import { SimClasses } from './melvor/sim-classes';

export abstract class Environment {
    public static async init(data: InitRequest) {
        importScripts(...data.scripts);

        const cloudManager = {
            hasFullVersionEntitlement: data.entitlements.full,
            hasTotHEntitlement: data.entitlements.toth,
            hasAoDEntitlement: data.entitlements.aod,
            isTest: false,
            log: () => {},
            setStatus: () => {},
            isBirthdayEvent2023Active: () => false
        };

        Global.this.cloudManager = cloudManager;

        this.evalGlobal(`
            Minibar = class Minibar {
                encode() {};
                decode() {};
            };
            loadedLangJson = {};
            skillNav = { setLevelAll: () => {} };
        `);

        this.detach();

        await SimClasses.init();

        Global.this.game = Global.game = new SimClasses.SimGame();

        this.evalGlobal(`game = self.game;`);

        await this.loadGameData(data.origin);
        Global.game.postDataRegistration();
    }

    private static async loadGameData(origin: string) {
        const url = (file: string) => `${origin}/assets/data/${file}.json?${DATA_VERSION}`;

        await Global.game.fetchAndRegisterDataPackage(url('melvorDemo'));

        if (self.cloudManager.hasFullVersionEntitlement) {
            await Global.game.fetchAndRegisterDataPackage(url('melvorFull'));

            if (self.cloudManager.hasTotHEntitlement) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorTotH'));
            }

            if (self.cloudManager.hasAoDEntitlement) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorExpansion2'));
            }
        }
    }

    private static detach() {
        Global.this.addModalToQueue = () => {};
        Global.this.openNextModal = () => {};
        Global.this.showBaneCompletionModal = () => {};
        Global.this.setDiscordRPCDetails = async () => {};
    }

    /**
     * When calling eval in a module, eval executes in scope of the modal, by calling eval indirectly,
     * it shifts the scope to the global object.
     */
    private static evalGlobal(script: string) {
        // @ts-ignore - needed to bind these to global scope and not the module
        (1, eval)(script);
    }
}

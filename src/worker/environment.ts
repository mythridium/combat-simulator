import { InitRequest } from 'src/shared/messages/message-type/init';

export class Environment {
    public game: Game;

    public async init(data: InitRequest) {
        importScripts(...data.scripts);

        const cloudManager = {
            hasFullVersionEntitlement: data.entitlements.full,
            hasTotHEntitlement: data.entitlements.toth,
            hasAoDEntitlement: data.entitlements.aod,
            isTest: false
        };

        self.cloudManager = cloudManager;

        this.evalGlobal(`
            Minibar = class Minibar {};
            loadedLangJson = {};
        `);

        const { SimGame } = await import(/* webpackMode: "eager" */ 'src/worker/game');
        this.game = new SimGame();

        (<any>self).game = this.game;

        this.evalGlobal(`game = self.game;`);

        await this.loadData(data.origin);
    }

    private async loadData(origin: string) {
        const url = (file: string) => `${origin}/assets/data/${file}.json?${DATA_VERSION}`;

        await this.game.fetchAndRegisterDataPackage(url('melvorDemo'));

        if (cloudManager.hasFullVersionEntitlement) {
            await this.game.fetchAndRegisterDataPackage(url('melvorFull'));

            if (cloudManager.hasTotHEntitlement) {
                await this.game.fetchAndRegisterDataPackage(url('melvorTotH'));
            }

            if (cloudManager.hasAoDEntitlement) {
                await this.game.fetchAndRegisterDataPackage(url('melvorExpansion2'));
            }
        }
    }

    private evalGlobal(script: string) {
        // @ts-ignore - needed to bind these to global scope and not the module
        (1, eval)(script);
    }
}

import { InitRequest } from 'src/shared/messages/message-type/init';
import { Global } from 'src/worker/global';
import { SimClasses } from './sim-classes';

declare global {
    interface WorkerGlobalScope {
        tempModifierData?: ModifierObject<SkillModifierTemplate, StandardModifierTemplate>;
    }
}

export class Environment {
    public async init(data: InitRequest) {
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

        (<any>self).game = Global.game = new SimClasses.SimGame();

        this.evalGlobal(`game = self.game;`);

        this.applyModifierData(data.modifierData);

        await this.loadData(data.origin);
        this.loadModDataPackages(data.dataPackages);
        Global.game.postDataRegistration();
    }

    private detach() {
        Global.this.addModalToQueue = () => {};
        Global.this.openNextModal = () => {};
        Global.this.showBaneCompletionModal = () => {};
        Global.this.setDiscordRPCDetails = async () => {};
    }

    private async loadData(origin: string) {
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

    private loadModDataPackages(dataPackages: [DataNamespace, GameDataPackage][]) {
        for (const [namespace, dataPackage] of dataPackages) {
            try {
                this.registerNamespace(namespace);
                Global.game.registerDataPackage(dataPackage);
            } catch (exception) {
                exception.message = `Failed to load mod data from: '${namespace.displayName}'\n\n${exception.message}`;
                throw exception;
            }
        }
    }

    private applyModifierData(modifierDataAsString: string) {
        eval(`self.tempModifierData = (${modifierDataAsString})`);

        for (const [key, value] of Object.entries(Global.this.tempModifierData)) {
            if (!modifierData[key]) {
                (<any>modifierData)[key] = value;
            }
        }

        // no reason to keep this in memory, never using again.
        delete Global.this.tempModifierData;
    }

    private registerNamespace(namespace: DataNamespace) {
        if (!game.registeredNamespaces.hasNamespace(namespace.name)) {
            Global.game.registeredNamespaces.registerNamespace(
                namespace.name,
                namespace.displayName,
                namespace.isModded
            );
        }
    }

    /**
     * When calling eval in a module, eval executes in scope of the modal, by calling eval indirectly,
     * it shifts the scope to the global object.
     */
    private evalGlobal(script: string) {
        // @ts-ignore - needed to bind these to global scope and not the module
        (1, eval)(script);
    }
}

import { InitRequest } from 'src/shared/transport/type/init';
import { Global } from 'src/worker/global';
import { SimClasses } from 'src/shared/simulator/sim';
import { MICSR } from 'src/shared/micsr';
import { Simulator } from 'src/worker/simulator';

declare global {
    interface WorkerGlobalScope {
        tempModifierData?: ModifierObject<SkillModifierTemplate, StandardModifierTemplate>;
    }
}

export abstract class Environment {
    public static async init(data: InitRequest) {
        importScripts(...data.scripts);

        const cloudManager = {
            hasFullVersionEntitlement: true,
            hasTotHEntitlement: data.entitlements.toth,
            hasAoDEntitlement: data.entitlements.aod,
            hasExpansionEntitlement: data.entitlements.aod && data.entitlements.toth,
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
            combatMenus = {
                eventMenu: {
                    setButtonCallbacks: () => {}
                }
            };
            firstSkillAction = true;
            deleteScheduledPushNotification = () => {};
        `);

        this.detach();

        await SimClasses.init();

        Global.micsr = new MICSR();
        Global.this.game = Global.game = new SimClasses.SimGame(Global.micsr);
        this.evalGlobal(`game = self.game;`);
        Global.micsr.game = Global.this.game;
        Global.micsr.actualGame = Global.this.game;

        this.applyModifierData(data.modifierData);

        await this.loadGameData(data.origin);

        Global.game.postDataRegistration();
        Global.micsr.setup(Global.game, Global.game, {
            namespaces: data.namespaces,
            skills: data.skills,
            dataPackage: data.dataPackage,
            agility: data.agility,
            gamemodes: data.gamemodes
        });

        Global.simulator = new Simulator();
    }

    private static async loadGameData(origin: string) {
        const url = (file: string) => `${origin}/assets/data/${file}.json?${DATA_VERSION}`;

        await Global.game.fetchAndRegisterDataPackage(url('melvorDemo'));

        if (Global.this.cloudManager.hasFullVersionEntitlement) {
            await Global.game.fetchAndRegisterDataPackage(url('melvorFull'));

            if (Global.this.cloudManager.hasTotHEntitlement) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorTotH'));
            }

            if (Global.this.cloudManager.hasAoDEntitlement) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorExpansion2'));
            }
        }
    }

    private static applyModifierData(modifierDataAsString: string) {
        eval(`self.tempModifierData = (${modifierDataAsString})`);

        for (const [key, value] of Object.entries(Global.this.tempModifierData)) {
            if (!modifierData[key]) {
                (<any>modifierData)[key] = value;
            }
        }

        // no reason to keep this in memory, never using again.
        delete Global.this.tempModifierData;
    }

    private static detach() {
        Global.this.addModalToQueue = () => {};
        Global.this.openNextModal = () => {};
        Global.this.showBaneCompletionModal = () => {};
        Global.this.setDiscordRPCDetails = async () => {};
        Global.this.saveData = () => {};
        Global.this.notifyPlayer = () => {};
        Global.this.showFireworks = () => {};
    }

    /**
     * When calling eval in a module, eval executes in scope of the module, by calling eval indirectly,
     * it shifts the scope to the global object.
     */
    private static evalGlobal(script: string) {
        // @ts-ignore - needed to bind these to global scope and not the module
        (1, eval)(script);
    }
}

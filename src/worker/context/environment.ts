import { InitRequest } from 'src/shared/transport/type/init';
import { Global } from 'src/worker/global';
import { SimClasses } from 'src/shared/simulator/sim';
import { MICSR } from 'src/shared/micsr';
import { Simulator } from 'src/worker/simulator';

export abstract class Environment {
    public static async init(data: InitRequest) {
        this.evalGlobal(`
            require = () => {
                return { accessSync: () => true };
            },
            MelvorDatabase = class MelvorDatabase {}
        `);

        importScripts(...this.tryRiskyScripts(data.scripts));

        const cloudManager: CloudManager = {
            hasFullVersionEntitlement: true,
            hasTotHEntitlement: data.entitlements.toth,
            hasTotHEntitlementAndIsEnabled: data.entitlements.toth,
            hasAoDEntitlement: data.entitlements.aod,
            hasAoDEntitlementAndIsEnabled: data.entitlements.aod,
            hasItAEntitlement: data.entitlements.ita,
            hasItAEntitlementAndIsEnabled: data.entitlements.ita,
            hasExpansionEntitlement: data.entitlements.aod && data.entitlements.toth && data.entitlements.ita,
            hasExpansionEntitlementAndIsEnabled:
                data.entitlements.aod && data.entitlements.toth && data.entitlements.ita,
            isAprilFoolsEvent2024Active: () => data.entitlements.aprilFools2024,
            isBirthdayEvent2023Active: () => data.entitlements.birthday2023,
            isTest: false,
            log: () => {},
            setStatus: () => {}
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
        Global.this.game = Global.game = new SimClasses.SimGame();
        this.evalGlobal(`game = self.game;`);

        await this.loadGameData(data.origin);

        Global.micsr.setup({
            namespaces: data.namespaces,
            skills: data.skills,
            dataPackage: data.dataPackage,
            gamemodes: data.gamemodes,
            currentGamemodeId: data.currentGamemodeId
        });

        delete data.dataPackage;
        delete data.skills;
        delete data.namespaces;

        Global.game.agility.courses.forEach(course => {
            course.numObstaclesUnlocked = course.obstacleSlots.length;
        });

        Global.simulator = new Simulator();
    }

    /**
     * Polyfill keeps failing to load along with dexie due to private variables being parsed
     * for some reason. I don't know if we need these, so I don't want to blindy exclude them
     * for now, just attempt to load and if it fails, so be it.
     */
    private static tryRiskyScripts(scripts: string[]) {
        const dataScripts: string[] = [];

        try {
            const risky = ['dexie', 'db.js', 'polyfill.io'];
            const found: string[] = [];

            for (const script of scripts) {
                if (risky.some(lookup => script.toLowerCase().includes(lookup.toLowerCase()))) {
                    found.push(script);
                } else {
                    dataScripts.push(script);
                }
            }

            importScripts(...found);
        } catch (error) {
            Global.logger.error(`Failed to load scripts.`, error);
        }

        return dataScripts;
    }

    private static async loadGameData(origin: string) {
        const url = (file: string) => `${origin}/assets/data/${file}.json?${DATA_VERSION}`;

        await Global.game.fetchAndRegisterDataPackage(url('melvorDemo'));

        if (Global.this.cloudManager.hasFullVersionEntitlement) {
            await Global.game.fetchAndRegisterDataPackage(url('melvorFull'));

            if (Global.this.cloudManager.isAprilFoolsEvent2024Active()) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorAprilFools2024'));
            }

            if (Global.this.cloudManager.hasTotHEntitlementAndIsEnabled) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorTotH'));
            }

            if (Global.this.cloudManager.hasAoDEntitlementAndIsEnabled) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorExpansion2'));
            }

            if (Global.this.cloudManager.hasItAEntitlementAndIsEnabled) {
                await Global.game.fetchAndRegisterDataPackage(url('melvorItA'));
            }
        }
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

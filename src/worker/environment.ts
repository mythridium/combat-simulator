import { InitRequest } from 'src/shared/messaging/type/init';
import { Global } from './global';
import { SimClasses } from './melvor/sim-classes';
import { ModifierDataKey } from 'src/shared/_types/modifier-data';
import { parseHTML } from 'linkedom/worker';
import { JSDOM } from 'jsdom';

declare global {
    interface ObjectConstructor {
        entries<TKey, TValue>(obj: NumberDictionary<TValue>): [TKey, TValue][];
    }
}

export abstract class Environment {
    public static async init(data: InitRequest) {
        const { window } = new JSDOM(`
        <!doctype html>
  <html lang="en">
  ${data.html}
  </html>
        `);

        Global.this.document = window.document;
        Global.this.window = <any>window;
        //(<any>Global.this.HTMLElement) = HTMLElement;
        /*  Global.this.DocumentFragment = <any>function DocumentFragment() {
            return Global.this.document.createDocumentFragment();
        };
        Global.this.customElements = customElements; */

        /* (<any>Global.this.document).implementation = {
            createHTMLDocument: (tag: string) => {
                return parseHTML(`<!doctype html>
                <html lang="en">
                ${tag}
                </html>`).document;
            }
        }; */

        /* const setTimeout = Global.this.setTimeout;
        (<any>window.setTimeout) = (<any>Global.this.setTimeout) = (callback: Function, timer = 0, ...args: any[]) => {
            return setTimeout(callback, timer, args);
        }; */

        this.evalGlobal(`
            document = self.document;
            window = self.window;
        `);

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
            loadedLangJson = {};
        `);

        /*  this.evalGlobal(`
            Minibar = class Minibar {
                encode() {};
                decode() {};
            };
            loadedLangJson = {};
            skillNav = { setLevelAll: () => {} };
        `); */

        this.detach();

        await SimClasses.init();

        Global.this.game = Global.game = new SimClasses.SimGame();
        this.evalGlobal(`game = self.game;`);

        this.applyModdedModifierData(data.moddedModifierData);

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

    private static applyModdedModifierData(modifierDataAsString: string) {
        eval(`self.tempModifierData = (${modifierDataAsString})`);

        const entries: [ModifierDataKey, SkillModifierTemplate & StandardModifierTemplate][] = Object.entries(
            Global.this.tempModifierData
        );

        for (const [key, value] of entries) {
            if (!modifierData[key]) {
                modifierData[key] = value;
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

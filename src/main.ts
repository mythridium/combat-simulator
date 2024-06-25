import 'src/shared/constants';
import { MICSR } from './shared/micsr';
import { SimClasses } from 'src/shared/simulator/sim';
import type { SimGame } from 'src/shared/simulator/sim-game';
import { Global as SharedGlobal } from 'src/shared/global';
import { Global } from './app/global';
import { Simulation } from './app/simulation';
import { UserInterface } from './app/user-interface/user-interface';
import { GamemodeConverter } from './shared/converter/gamemode';
import { EquipmentController } from './app/user-interface/pages/_parts/equipment/equipment-controller';
import { DialogController } from './app/user-interface/_parts/dialog/dialog-controller';
import { Lookup } from './shared/utils/lookup';
import { Bugs } from './app/user-interface/bugs/bugs';
import { SettingsController, Settings } from './app/settings-controller';
import { clone, cloneDeep } from 'lodash-es';
import { SaveSlot } from './app/utils/save-slot';
import type { Switch } from './app/user-interface/_parts/switch/switch';

export abstract class Main {
    private static loading = false;
    private static versionKey = 'MICSR-gameVersion';
    private static gameVersion = 'v1.3';
    private static registeredNamespaces: string[] = [];

    public static init(context: Modding.ModContext) {
        SharedGlobal.setClient(Global);
        Global.context = context;

        try {
            this.setWindowObject();
        } catch {}

        Global.context.api({
            isLoaded: Global.isLoaded,
            import: (settings: Settings) => SettingsController.import(settings),
            export: () => SettingsController.export(),
            registerNamespace: (namespace: string) => {
                if (namespace && typeof namespace === 'string') {
                    this.registeredNamespaces.push(namespace.toLowerCase());
                }
            },
            registeredNamespaces: () => clone(this.registeredNamespaces)
        });

        Global.userInterface = new UserInterface();

        try {
            SaveSlot.init();
        } catch (error) {
            Global.logger.error('Failed to initialise indexeddb', error);
        }

        Global.context
            .patch(CombatSkillProgressTableElement, 'updateLevelCapButtons')
            .replace((original, game: SimGame) => {
                if (!game.isMcsGame) {
                    return original(game);
                }
            });

        Global.context.onInterfaceReady(async () => {
            try {
                for (const template of Global.templates) {
                    await Global.context.loadTemplates(template);
                }

                await this.load();
                Global.loaded(true);
            } catch (error) {
                Global.loaded(false);
                Bugs.report(false, error);
            }
        });

        Global.context.patch(Game, 'registerDataPackage').before(dataPackage => {
            if (dataPackage.namespace.startsWith('melvor') || this.loading) {
                return;
            }

            Global.dataPackages.push(cloneDeep(dataPackage));
        });

        Global.context.patch(Game, 'registerSkill').after((instance, namespace) => {
            if (!namespace.isModded || this.loading) {
                return;
            }

            Global.skills.push({ name: instance._localID, namespace, media: instance._media });
        });
    }

    private static async load() {
        this.loading = true;
        await SimClasses.init();

        let { tryLoad, isWrongVersion } = await this.tryToLoad();

        if (tryLoad) {
            try {
                const duration = await Global.time(async () => {
                    Global.micsr = new MICSR();
                    Global.game = new SimClasses.SimGame();
                    Global.melvor = game;

                    await Global.micsr.fetchData();
                    await Global.micsr.initialize();

                    Global.dataPackages = Global.dataPackages.filter(dataPackage =>
                        this.registeredNamespaces.includes(dataPackage.namespace.toLowerCase())
                    );

                    Global.skills = Global.skills.filter(skill =>
                        this.registeredNamespaces.includes(skill.namespace.name.toLowerCase())
                    );

                    this.setup();

                    Global.simulation = new Simulation();

                    const isRegistered = this.invalidGamemodeCheck();

                    let saveString = Global.melvor.generateSaveString();

                    if (!isRegistered) {
                        const temporary = Global.melvor.currentGamemode;
                        Global.melvor.currentGamemode = Global.melvor.gamemodes.getObjectByID('melvorD:Standard');
                        saveString = Global.melvor.generateSaveString();
                        Global.melvor.currentGamemode = temporary;
                    }

                    const reader = new SaveWriter('Read', 1);
                    const saveVersion = reader.setDataFromSaveString(saveString);

                    Global.game.decode(reader, saveVersion);
                    Global.game.onLoad();
                    Global.game.resetToBlankState();

                    EquipmentController.init();
                    Global.userInterface.init();
                });

                await Global.simulation.init();

                if (isWrongVersion) {
                    Global.logger.log(
                        `v${Global.context.version} loaded, but simulation results may be inaccurate due to game version incompatibility.`
                    );

                    localStorage.setItem(this.versionKey, gameVersion);
                }

                delete Global.dataPackages;
                delete Global.skills;

                Global.logger.log(`Initialised in ${duration} ms [${Global.context.version}]`);
            } catch (error) {
                Global.logger.error(
                    `${Global.context.name} ${Global.context.version} was not loaded due to the following error:\n\n`,
                    error
                );
                Bugs.report(false, error);
            }
        } else {
            Global.logger.warn(
                `Did not load v${Global.context.version} due to user declining to load an incompatible version.`
            );
        }
    }

    private static tryToLoad() {
        const isWrongVersion = gameVersion !== this.gameVersion;

        let resolve: (result: { isWrongVersion: boolean; tryLoad: boolean }) => void;
        const wait = new Promise<{ isWrongVersion: boolean; tryLoad: boolean }>(_ => (resolve = _));

        if (isWrongVersion && gameVersion !== localStorage.getItem('MICSR-gameVersion')) {
            const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });
            const dialog = createElement('mcs-dialog', { id: 'mcs-wrong-version' });

            dialog.innerHTML = `
                <div slot="header">Incompatible Game Version</div>

                <div slot="content">
                    <div>This version of Combat Simulator has been tested for ${this.gameVersion}, but Melvor is running ${gameVersion}. There is no guarantee that Combat Simulator will work as expected. </div>
                    <br />
                    <div>Do you want to try loading the simulator anyway?</div>
                </div>

                <div slot="footer">
                    <button id="mcs-wrong-version-cancel" class="mcs-button-secondary">Cancel</button>
                    <button id="mcs-wrong-version-load" class="mcs-button">Try Load</button>
                </div>
            `;

            const load = dialog.querySelector<HTMLButtonElement>('#mcs-wrong-version-load');
            const cancel = dialog.querySelector<HTMLButtonElement>('#mcs-wrong-version-cancel');

            cancel.onclick = () => {
                DialogController.close();
                dialog.remove();
                backdrop.remove();
                resolve({ isWrongVersion, tryLoad: false });
            };

            load.onclick = () => {
                DialogController.close();
                dialog.remove();
                backdrop.remove();
                resolve({ isWrongVersion, tryLoad: true });
            };

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            DialogController.open(dialog, undefined, false);
        } else {
            resolve({ isWrongVersion, tryLoad: true });
        }

        return wait;
    }

    private static invalidGamemodeCheck() {
        const gamemodeRegistered =
            Global.game.gamemodes.find(gamemode => gamemode.id === Global.melvor.currentGamemode.id) !== undefined;

        const ignore = localStorage.getItem('mcs-ignore-gamemode-warning') === 'true';

        if (!gamemodeRegistered && !ignore) {
            const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });
            const dialog = createElement('mcs-dialog', { id: 'mcs-invalid-gamemode' });

            dialog.innerHTML = `
                <div slot="header">[Combat Simulator] Gamemode not registered</div>

                <div slot="content">
                    <div>Your gamemode '${Global.melvor.currentGamemode.name}' has not been registered with Combat Simulator.</div>
                    <br />
                    <div>Please contact the author of '${Global.melvor.currentGamemode.name}' and ask them to register their mod with Combat Simulator. Your gamemode will default to Standard within Combat Simulator.</div>
                    <mcs-switch
                        id="mcs-invalid-gamemode-ignore"
                        style="margin-top: 20px; display: block;"
                        data-mcsOnText="Yes"
                        data-mcsOffText="No"
                        data-mcsName="Ignore future invalid gamemode warnings">
                    </mcs-switch>
                </div>

                <div slot="footer">
                    <button id="mcs-no-gamemode-ok" class="mcs-button">Ok</button>
                </div>
            `;

            const ok = dialog.querySelector<HTMLButtonElement>('#mcs-no-gamemode-ok');
            const ignore = dialog.querySelector<Switch>('#mcs-invalid-gamemode-ignore');

            ok.onclick = () => {
                DialogController.close();
                dialog.remove();
                backdrop.remove();
            };

            ignore._on(isChecked => {
                localStorage.setItem('mcs-ignore-gamemode-warning', isChecked ? 'true' : 'false');
            });

            document.body.appendChild(backdrop);
            document.body.appendChild(dialog);

            DialogController.open(dialog, undefined, false);
        }

        return gamemodeRegistered;
    }

    private static setup() {
        Global.micsr.setup({
            dataPackage: Global.dataPackages,
            skills: Global.skills,
            namespaces: Array.from(Global.melvor.registeredNamespaces.registeredNamespaces.values()).filter(
                namespace => namespace.isModded
            ),
            gamemodes: Global.melvor.gamemodes.allObjects.map(gamemode => GamemodeConverter.get(gamemode)),
            currentGamemodeId: Global.melvor.currentGamemode.id
        });

        const monsterIds: string[] = [];

        for (const area of Lookup.combatAreas.combatAreas) {
            for (const monster of area.monsters) {
                monsterIds.push(monster.id);
            }
        }

        monsterIds.push(Global.stores.game.state.bardId);

        for (const area of Lookup.combatAreas.slayer) {
            for (const monster of area.monsters) {
                monsterIds.push(monster.id);
            }
        }

        const dungeonIds = Lookup.combatAreas.dungeons.map(dungeon => dungeon.id);
        const strongholdIds = Lookup.combatAreas.strongholds.map(stronghold => stronghold.id);
        const depthIds = Lookup.combatAreas.depths.map(depth => depth.id);
        const taskIds = Lookup.tasks.allObjects.map(task => task.id);

        Global.stores.game.set({ monsterIds, dungeonIds, strongholdIds, depthIds, taskIds });
    }

    private static setWindowObject() {
        self.mcs.modifierDiff = () => {
            const mcs = this.diff(Global.game.modifiers.entriesByID, Global.melvor.modifiers.entriesByID);
            const melvor = this.diff(Global.melvor.modifiers.entriesByID, Global.game.modifiers.entriesByID);

            return { mcs, melvor };
        };
    }

    private static diff(compare: Map<string, ModifierTableEntry[]>, to: Map<string, ModifierTableEntry[]>) {
        const lookup: any = {
            no: [],
            yes: [],
            diff: [],
            diffLookup: []
        };

        for (const [key, entry] of Array.from(compare.entries())) {
            if (!to.has(key)) {
                lookup.no.push(key);
                continue;
            }

            const toEntry = to.get(key);

            if (toEntry.length !== entry.length) {
                lookup.diff.push(key);
                lookup.diffLookup.push({ id: key, compare: compare.get(key), to: to.get(key) });
                continue;
            }

            lookup.yes.push(key);
        }

        return lookup;
    }
}

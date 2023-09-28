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
    private readonly dataPackages: [DataNamespace, GameDataPackage][] = [];
    private readonly skills: [string, DataNamespace][] = [];

    private workers: Workers;
    private interface: Interface;

    constructor(private readonly context: Modding.ModContext) {
        this.patch();

        this.modalQueue = new ModalQueue(this.context);

        this.context.onInterfaceReady(async () => {
            await this.checkDataPackages();

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

        const isInitialised = await this.workers.init({
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            },
            dataPackages: this.dataPackages,
            skills: this.skills
        });

        if (isInitialised) {
            this.interface.init();
        }
    }

    private patch() {
        this.context.patch(Game, 'registerDataPackage').after((_, dataPackage) => {
            const namespace = game.registeredNamespaces.getNamespace(dataPackage.namespace);

            if (!namespace.isModded) {
                return;
            }

            this.dataPackages.push([namespace, dataPackage]);
        });

        this.context.patch(Game, 'registerSkill').after((instance, namespace) => {
            this.skills.push([instance.localID, namespace]);
        });
    }

    private async checkDataPackages() {
        const db = new MelvorDatabase();
        const mods = await db.mods.toArray();
        const localMods = await db.localMods.toArray();

        // namespaces for mods that are flagged as a dependency
        const dependencies = mods
            .filter(mod => mod.namespace && mod.tags.types.includes('Dependency'))
            .map(mod => mod.namespace);

        // namespaces for all registered namespaces that are not dependencies and are mods
        const registeredNamespaces = Array.from(game.registeredNamespaces.registeredNamespaces.values()).filter(
            namespace =>
                namespace.isModded &&
                !dependencies.includes(namespace.name) &&
                !localMods.some(mod => mod.mod.namespace === namespace.name)
        );

        // namespaces for the mods that we managed to capture in time
        const modNamespaces = Array.from(this.dataPackages.values()).map(([namespace]) => namespace.name);

        // did any mods that are not dependencies get registered that we didn't see
        const missingNamespaces = registeredNamespaces
            .filter(namespace => modNamespaces.includes(namespace.name))
            .map(namespace => namespace.displayName);

        if (missingNamespaces?.length) {
            this.modalQueue.add(
                `
                <div class="mcs-missing-mods text-combat-smoke">
                    <div mt-3>[Myth] Combat Simulator may be missing modded content data and needs to be at the top of your mod load order.</div>
                    <div class="text-warning block-rounded-double bg-combat-inner-dark mt-4">Move <span class="text-combat-smoke">[Myth] Combat Simulator</span> to the top of your mod load order. Alternatively, unsubscribe and re-subscribe to automatically move the mod to the top.</div>
                </div>
                `,
                false
            );
        }
    }
}

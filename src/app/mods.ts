import { ModalQueue } from './interface/modal-queue';
import serialize from 'serialize-javascript';

export class Mods {
    public readonly dataPackages: [DataNamespace, GameDataPackage][] = [];
    public readonly invalidNamespace: DataNamespace[] = [];

    public modModifierData: string;
    private melvorModifierData = { ...modifierData };

    constructor(private readonly context: Modding.ModContext, private readonly modalQueue: ModalQueue) {}

    public init() {
        this.context.patch(Game, 'registerDataPackage').after((_, dataPackage) => {
            const namespace = game.registeredNamespaces.getNamespace(dataPackage.namespace);

            if (!namespace.isModded) {
                return;
            }

            this.dataPackages.push([namespace, dataPackage]);
        });
    }

    /** Get all modifier data that are from mods. */
    private modifierDataToJson() {
        const data = {};

        for (const [key, value] of Object.entries(modifierData)) {
            if (!this.melvorModifierData[key]) {
                (<any>data)[key] = value;
            }
        }

        // no reason to keep this in memory, never using again.
        delete this.melvorModifierData;

        return serialize(data);
    }

    /** Ignore all data packages that introduce custom skills. */
    public checkDataPackagesForInvalidData() {
        this.modModifierData = this.modifierDataToJson();

        const moddedSkills = game.skills.filter(skill => skill.isModded).map(skill => skill.namespace);
        const dataPackages: [DataNamespace, GameDataPackage][] = [];

        for (const [namespace, dataPackage] of this.dataPackages) {
            if (moddedSkills.includes(namespace.name)) {
                if (!this.invalidNamespace.some(invalidNamespace => invalidNamespace.name === namespace.name)) {
                    this.invalidNamespace.push(namespace);
                }

                continue;
            }

            dataPackages.push([namespace, dataPackage]);
        }

        this.dataPackages.length = 0;
        this.dataPackages.push(...dataPackages);
    }

    public async checkDataPackages() {
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
                !localMods.some(mod => mod.mod.namespace === namespace.name && mod.disabled === false) &&
                !this.invalidNamespace.some(invalidNamespace => invalidNamespace.name === namespace.name)
        );

        // namespaces for the mods that we managed to capture in time
        const modNamespaces = Array.from(this.dataPackages.values()).map(([namespace]) => namespace.name);

        // did any mods get registered that we didn't see
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

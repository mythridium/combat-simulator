import { SkillData } from 'src/shared/messages/message-type/init';
import { ModalQueue } from 'src/app/interface/modules/modal-queue';
import serialize from 'serialize-javascript';
import { Global } from 'src/app/global';

export class Mods {
    public readonly dataPackages: [DataNamespace, GameDataPackage, SkillData | undefined][] = [];
    public moddedModifierData: string;

    private readonly seenNamespaces = new Map<string, DataNamespace>();
    private melvorModifierData = { ...modifierData };

    constructor(private readonly modalQueue: ModalQueue) {}

    public setup() {
        Global.context.patch(NamespaceMap, 'registerNamespace').after(namespace => {
            if (!namespace.isModded) {
                return;
            }

            this.seenNamespaces.set(namespace.name, namespace);
        });

        Global.context.patch(Game, 'registerDataPackage').after((_, dataPackage) => {
            const namespace = game.registeredNamespaces.getNamespace(dataPackage.namespace);

            if (!namespace.isModded) {
                return;
            }

            const skill = game.skills.find(skill => skill.namespace === namespace.name);

            this.dataPackages.push([
                namespace,
                dataPackage,
                skill ? { localId: skill.localID, name: skill.name } : undefined
            ]);
        });
    }

    public async init() {
        this.moddedModifierData = this.modifierDataToJson();
        await this.checkDataPackages();
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

    private async checkDataPackages() {
        const db = new MelvorDatabase();
        const mods = await db.mods.toArray();

        const dependencies = mods
            .filter(mod => mod.namespace && mod.tags.types.includes('Dependency'))
            .map(mod => mod.name);

        const registered = Array.from(game.registeredNamespaces.registeredNamespaces.values()).filter(
            namespace => namespace.isModded && !dependencies.includes(namespace.displayName)
        );

        const seenNamespaces = Array.from(this.seenNamespaces.values()).filter(
            namespace => !dependencies.includes(namespace.displayName)
        );

        // did any mods get registered that we didn't see
        const missingNamespaces = registered
            .filter(namespace => !seenNamespaces.some(seen => seen.name === namespace.name))
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

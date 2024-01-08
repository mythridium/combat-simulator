import serialize from 'serialize-javascript';
import { ModifierDataObject } from 'src/shared/_types/modifier-data';

export abstract class ModifierData {
    public static moddedModifierData: ModifierDataObject;

    private static melvorModifierData = { ...modifierData };

    public static init() {
        if (this.moddedModifierData) {
            return this.getModdedModifierDataAsString();
        }

        const data: ModifierDataObject = {};

        for (const [key, value] of Object.entries(modifierData)) {
            if (!this.melvorModifierData[key]) {
                data[key] = value;
            }
        }

        // no reason to keep this in memory, never using again.
        delete this.melvorModifierData;

        this.moddedModifierData = data;

        return this.getModdedModifierDataAsString();
    }

    public static getModdedModifierDataAsString() {
        return serialize(this.moddedModifierData);
    }
}

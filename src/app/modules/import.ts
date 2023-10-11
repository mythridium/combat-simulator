import { EquipmentItemSlot } from 'src/shared/stores/equipment.store';
import { Global } from 'src/app/global';
import { Source } from 'src/shared/stores/sync.store';

export abstract class Import {
    public static set(index: number) {
        this.importEquipment(index);
    }

    private static importEquipment(index: number) {
        const { equipment } = game.combat.player.equipmentSets[index];
        const items: EquipmentItemSlot[] = [];

        for (const slot of equipment.slotArray) {
            if (slot.isEmpty) {
                continue;
            }

            items.push({
                slot: slot.type,
                id: slot.item.id,
                occupies: slot.item.occupiesSlots
            });
        }

        Global.equipment.setState(Source.Interface, { equipment: items });
        Global.configuration.setState(Source.Interface, { isSynergyEnabled: true });
    }
}

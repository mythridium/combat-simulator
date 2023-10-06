import './equipment-component.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentCustomSlot, EquipmentSlot } from './equipment.types';
import { EquipmentItemComponent } from './equipment-item-component';

export class EquipmentComponent extends BaseComponent {
    private readonly equipmentSlots: EquipmentSlot[][] = [
        [EquipmentSlots.Passive, EquipmentSlots.Helmet, EquipmentSlots.Consumable],
        [EquipmentSlots.Cape, EquipmentSlots.Amulet, EquipmentSlots.Quiver],
        [EquipmentSlots.Weapon, EquipmentSlots.Platebody, EquipmentSlots.Shield],
        [
            cloudManager.hasAoDEntitlement ? EquipmentSlots.Gem : EquipmentCustomSlot.Blank,
            EquipmentSlots.Platelegs,
            EquipmentCustomSlot.Blank
        ],
        [EquipmentSlots.Gloves, EquipmentSlots.Boots, EquipmentSlots.Ring],
        [EquipmentSlots.Summon1, EquipmentCustomSlot.Synergy, EquipmentSlots.Summon2]
    ];

    constructor() {
        super({ id: 'mcs-equipment', tag: 'div' });
    }

    protected preRender(container: Element) {
        for (const [index, row] of this.equipmentSlots.entries()) {
            const equipmentRow = new EquipmentRow(index);

            for (const [index, slot] of row.entries()) {
                equipmentRow.append(new EquipmentItemComponent({ id: `mcs-equipment-item-${index}`, slot }));
            }

            this.append(equipmentRow);
        }

        super.preRender(container);
    }
}

class EquipmentRow extends BaseComponent {
    constructor(index: number) {
        super({ id: `mcs-equipment-row-${index}`, tag: 'div', classes: ['mcs-equipment-row'] });
    }
}

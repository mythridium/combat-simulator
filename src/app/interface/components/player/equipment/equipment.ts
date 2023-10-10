import './equipment.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentCustomSlot, EquipmentSlot } from './equipment.types';
import { EquipmentItemContainerComponent } from './equipment-item-container';
import { PopupRegistry } from './popup-registry';

export class EquipmentComponent extends BaseComponent {
    private static hidePopupCallback = () => PopupRegistry.hide();

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

    protected init() {
        document.addEventListener('click', EquipmentComponent.hidePopupCallback);
    }

    protected destroy() {
        document.removeEventListener('click', EquipmentComponent.hidePopupCallback);
    }

    protected preRender(container: HTMLElement) {
        PopupRegistry.clear();

        for (const [index, row] of this.equipmentSlots.entries()) {
            const equipmentRow = new EquipmentRow(index);

            for (const slot of row) {
                equipmentRow.append(new EquipmentItemContainerComponent({ slot }));
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

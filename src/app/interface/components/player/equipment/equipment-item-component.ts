import './equipment-item-component.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentCustomSlot, EquipmentSlot } from './equipment.types';

export interface EquipmentItemOptions {
    id: string;
    slot: EquipmentSlot;
}

export class EquipmentItemComponent extends BaseComponent {
    constructor(private readonly options: EquipmentItemOptions) {
        super({ id: options.id, tag: 'div' });
    }

    protected preRender(container: Element) {
        if (this.isEquipmentSlots(this.options.slot)) {
            const fileName = equipmentSlotData[EquipmentSlots[this.options.slot] as SlotTypes].emptyMedia;
            const img = document.createElement('img');

            img.src = `assets/media/bank/${fileName}.png`;
            img.className =
                'combat-equip-img border border-2x border-rounded-equip border-combat-outline p-1 m-1 pointer-enabled';

            // @ts-ignore
            tippy(img, { content: EquipmentSlots[this.options.slot] });

            this.append(img);
        }

        if (this.options.slot === EquipmentCustomSlot.Blank) {
            const blank = document.createElement('div');
            blank.className = 'blank combat-equip-img p-1 m-1';

            this.append(blank);
        }

        if (this.options.slot === EquipmentCustomSlot.Synergy) {
            const synergy = document.createElement('div');
            synergy.className = 'synergy combat-equip-img p-1 m-1';

            this.append(synergy);
        }

        super.preRender(container);
    }

    private isEquipmentSlots(slot: EquipmentSlot): slot is EquipmentSlots {
        return Object.values(EquipmentSlots).includes(<EquipmentSlots>slot);
    }
}

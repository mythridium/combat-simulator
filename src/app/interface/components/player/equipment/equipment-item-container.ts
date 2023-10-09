import './equipment-item-container.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentPopup } from './equipment-popup';
import { EquipmentItemComponent } from './equipment-item';
import { EquipmentSlot } from './equipment.types';

export interface EquipmentItemContainerOptions {
    slot: EquipmentSlot;
}

export class EquipmentItemContainerComponent extends BaseComponent {
    public static count = 0;

    public readonly id: number;

    constructor(private readonly options: EquipmentItemContainerOptions) {
        EquipmentItemContainerComponent.count++;

        super({
            id: `mcs-equipment-item-container-${EquipmentItemContainerComponent.count}`,
            tag: 'div',
            classes: ['mcs-equipment-item-container']
        });

        this.id = EquipmentItemContainerComponent.count;
    }

    protected preRender(container: HTMLElement): void {
        const item = new EquipmentItemComponent({
            id: this.id.toString(),
            slot: this.options.slot
        });

        this.append(item);

        if (this.isEquipmentSlots(this.options.slot)) {
            this.append(
                new EquipmentPopup({ id: this.id.toString(), slot: EquipmentSlots[this.options.slot] as SlotTypes })
            );
        }

        super.preRender(container);
    }

    private isEquipmentSlots(slot: EquipmentSlot): slot is EquipmentSlots {
        return Object.values(EquipmentSlots).includes(<EquipmentSlots>slot);
    }
}

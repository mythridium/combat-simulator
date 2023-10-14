import './equipment-item-container.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentPopup } from './equipment-popup';
import { EquipmentItemComponent } from './equipment-item';
import { EquipmentSlot } from './equipment.types';
import { Global } from 'src/app/global';
import { Source } from 'src/shared/stores/sync.store';

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
            const slot = EquipmentSlots[this.options.slot] as SlotTypes;
            this.append(
                new EquipmentPopup({
                    id: this.id.toString(),
                    slot,
                    onClick: (item: EquipmentItem) => {
                        let { equipment } = Global.equipment.getState();

                        equipment = equipment.filter(
                            equipped =>
                                equipped.id !== item.id &&
                                equipped.slot !== slot &&
                                !equipped.occupies.includes(slot) &&
                                !item.occupiesSlots.includes(equipped.slot)
                        );

                        if (item.id !== Global.emptyEquipmentId) {
                            equipment.push({ id: item.id, slot, occupies: item.occupiesSlots });
                        }

                        Global.equipment.setState(Source.Interface, { equipment });
                    }
                })
            );
        }

        super.preRender(container);
    }

    private isEquipmentSlots(slot: EquipmentSlot): slot is EquipmentSlots {
        return Object.values(EquipmentSlots).includes(<EquipmentSlots>slot);
    }
}

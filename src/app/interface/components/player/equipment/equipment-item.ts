import './equipment-item.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentCustomSlot, EquipmentSlot } from './equipment.types';
import { Global } from 'src/app/global';
import { PopupRegistry } from './popup-registry';
import { ImageButtonComponent } from '../../blocks/image-button-component';
import { Source } from 'src/shared/stores/sync.store';

export interface EquipmentItemOptions {
    id: string;
    slot: EquipmentSlot;
}

export class EquipmentItemComponent extends BaseComponent {
    constructor(private readonly options: EquipmentItemOptions) {
        super({ id: `mcs-equipment-item-${options.id}`, tag: 'div', classes: ['mcs-equipment-item'] });
    }

    protected init() {
        Global.equipment.subscribe(() => this.render());
        Global.configuration.subscribe(() => {
            if (this.options.slot === EquipmentCustomSlot.Synergy) {
                this.render();
            }
        });
    }

    protected preRender(container: HTMLElement) {
        if (this.isEquipmentSlots(this.options.slot)) {
            const slot = EquipmentSlots[this.options.slot] as SlotTypes;
            const itemEquipment = Global.equipment.state.equipment.find(
                item => item.slot === slot || item.occupies.includes(slot)
            );

            let fileName = `assets/media/bank/${equipmentSlotData[slot].emptyMedia}.png`;
            let tooltip: string = slot;
            let isOccupying = false;

            if (itemEquipment) {
                const item = game.items.getObjectByID(itemEquipment.id);

                if (item) {
                    isOccupying = itemEquipment.slot !== slot;
                    fileName = item.media;
                    tooltip = createItemInformationTooltip(item, true).replace(
                        '"media-body"',
                        '"media-body mcs-media-body"'
                    );
                }
            }

            const classes = [
                'combat-equip-img',
                'border',
                'border-2x',
                'border-rounded-equip',
                'border-combat-outline',
                'p-1',
                'm-1',
                'pointer-enabled'
            ];

            const img = document.element({
                tag: 'img',
                src: fileName,
                classes: [...classes, isOccupying ? 'faded-image' : ''],
                tooltip: { content: tooltip },
                onClick: event => {
                    event.stopPropagation();

                    const popup = PopupRegistry.get(this.options.id);

                    PopupRegistry.hide(popup);
                    popup?.toggle();
                }
            });

            this.append(img);
        }

        if (this.options.slot === EquipmentCustomSlot.Blank) {
            this.append(document.element({ tag: 'div', classes: ['blank combat-equip-img', 'p-1', 'm-1'] }));
        }

        if (this.options.slot === EquipmentCustomSlot.Synergy) {
            this.append(
                new ImageButtonComponent({
                    id: 'mcs-synergy-button',
                    src: this.isSynergyEnabled
                        ? 'assets/media/skills/summoning/synergy.svg'
                        : 'assets/media/skills/summoning/synergy_locked.svg',
                    classes: [
                        'combat-equip-img',
                        'border',
                        'border-2x',
                        'border-rounded-equip',
                        'border-combat-outline',
                        'p-1',
                        'm-1',
                        'pointer-enabled'
                    ],
                    tooltip: {
                        content: this.hasSynergy ? `Toggle Synergy ${this.isSynergyEnabled ? 'Off' : 'On'}` : 'Locked'
                    },
                    onClick: () => {
                        if (!this.hasSynergy) {
                            return;
                        }

                        Global.configuration.setState(Source.Interface, {
                            isSynergyEnabled: !Global.configuration.state.isSynergyEnabled
                        });
                    }
                })
            );
        }

        super.preRender(container);
    }

    private get hasSynergy() {
        const summons = Global.equipment.state.equipment.filter(slot => ['Summon1', 'Summon2'].includes(slot.slot));

        return summons.length === 2;
    }

    private get isSynergyEnabled() {
        return Global.configuration.state.isSynergyEnabled && this.hasSynergy;
    }

    private isEquipmentSlots(slot: EquipmentSlot): slot is EquipmentSlots {
        return Object.values(EquipmentSlots).includes(<EquipmentSlots>slot);
    }
}

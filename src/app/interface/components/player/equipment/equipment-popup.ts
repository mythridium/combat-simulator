import './equipment-popup.scss';
import { ImageButtonComponent } from 'src/app/interface/components/blocks/image-button-component';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { PopupRegistry } from './popup-registry';
import { Global } from 'src/app/global';
import { Source } from 'src/shared/stores/sync.store';
import { EquipmentCategories } from './equipment-categories';

export interface EquipmentPopupOptions {
    id: string;
    slot: SlotTypes;
}

const emptyEquipmentId = 'melvorD:Empty_Equipment';

export class EquipmentPopup extends BaseComponent {
    public isVisible = false;

    private readonly equipment = new EquipmentCategories();

    constructor(public readonly options: EquipmentPopupOptions) {
        super({ id: `mcs-equipment-popup-${options.id}`, tag: 'div', classes: ['mcs-equipment-popup'] });

        PopupRegistry.register(this);
    }

    public show() {
        if (!this.element) {
            return;
        }

        tippy.hideAll();
        this.isVisible = true;
        this.render();
    }

    public hide() {
        if (!this.element) {
            return;
        }

        this.isVisible = false;
        this.render();
    }

    public toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    protected preRender(container: HTMLElement): void {
        if (this.isVisible) {
            this.append(
                this.equipment.sections[this.options.slot].map(
                    ({ title, items }) =>
                        new EquipmentPopupSection({
                            id: `popup-section-${this.options.slot}-${title.toLowerCase()}`,
                            slot: this.options.slot,
                            popup: this,
                            title,
                            items
                        })
                )
            );
        }

        super.preRender(container);
    }

    protected postRender(): void {
        super.postRender();

        if (this.isVisible) {
            this.element.style.display = 'block';
        } else {
            this.element.style.display = 'none';
        }

        this.element.onclick = event => event.stopPropagation();
    }
}

interface EquipmentPopupSectionOptions {
    id: string;
    slot: SlotTypes;
    title: string;
    popup: EquipmentPopup;
    items: EquipmentItem[];
}

class EquipmentPopupSection extends BaseComponent {
    constructor(private readonly options: EquipmentPopupSectionOptions) {
        super({ id: options.id, tag: 'div', classes: ['mcs-equipment-popup-section'] });
    }

    protected preRender(container: HTMLElement): void {
        const title = document.element({ tag: 'div', innerHTML: this.options.title, classes: ['my-2'] });
        const wrapper = document.element({ tag: 'div', classes: ['mcs-equipment-popup-section-wrapper'] });

        for (const item of this.options.items) {
            const button = new ImageButtonComponent({
                id: `mcs-equipment-item-button-${item.localID}`,
                src: item.media,
                lazy: true,
                onClick: () => {
                    let { equipment } = Global.equipment.getState();

                    equipment = equipment.filter(
                        equipped =>
                            equipped.id !== item.id &&
                            equipped.slot !== this.options.slot &&
                            !equipped.occupies.includes(this.options.slot) &&
                            !item.occupiesSlots.includes(equipped.slot)
                    );

                    if (item.id !== emptyEquipmentId) {
                        equipment.push({ id: item.id, slot: this.options.slot, occupies: item.occupiesSlots });
                    }

                    Global.equipment.setState(Source.Interface, { equipment });
                    this.options.popup.hide();
                    tippy.hideAll();
                },
                tooltip: {
                    content:
                        item.id === emptyEquipmentId
                            ? 'Empty'
                            : createItemInformationTooltip(item, true).replace(
                                  '"media-body"',
                                  '"media-body mcs-media-body"'
                              )
                }
            });

            wrapper.append(button);
        }

        this.append(title, wrapper);

        super.preRender(container);
    }
}

import './equipment-popup.scss';
import { ImageButtonComponent } from 'src/app/interface/components/blocks/image-button-component';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { PopupRegistry } from './popup-registry';
import { Global } from 'src/app/global';

export interface EquipmentPopupOptions {
    id: string;
    slot: SlotTypes | 'Food';
    onClick: (item: AnyItem, event: MouseEvent) => void;
}

export class EquipmentPopup extends BaseComponent {
    public isVisible = false;

    constructor(public readonly options: EquipmentPopupOptions) {
        super({ id: `mcs-equipment-popup-${options.id}`, tag: 'div', classes: ['mcs-equipment-popup'] });
    }

    protected init(): void {
        PopupRegistry.register(this);
    }

    protected destroy(): void {
        PopupRegistry.delete(this);
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
            const search = document.element({
                id: `mcs-popup-${this.options.id}-search`,
                tag: 'input',
                type: 'text',
                placeholder: 'Search',
                classes: ['form-control', 'form-control-sm', 'mt-2'],
                onInput: event => {
                    if (!this.element) {
                        return;
                    }

                    const items = Global.equipmentCategories.sections[this.options.slot].flatMap(({ items }) => items);

                    const buttons = Array.from(this.element.querySelectorAll<HTMLButtonElement>('.mcs-image-btn'));

                    for (const item of items) {
                        const button = buttons.find(
                            button => button.id === `mcs-equipment-item-button-${item.localID}`
                        );

                        if (!button) {
                            continue;
                        }

                        // @ts-ignore
                        const value = event?.target?.value;

                        if (!value || item.name.toLowerCase().includes(value.toLowerCase())) {
                            button.style.display = 'block';
                        } else {
                            button.style.display = 'none';
                        }
                    }
                }
            });

            this.append(search);

            this.append(
                Global.equipmentCategories.sections[this.options.slot].map(
                    ({ title, items }) =>
                        new EquipmentPopupSection({
                            id: `popup-section-${this.options.slot}-${title.toLowerCase()}`,
                            popup: this,
                            title,
                            items,
                            onClick: (item, event) => this.options.onClick(item, event)
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

        if (this.isVisible) {
            this.get(`mcs-popup-${this.options.id}-search`)?.element?.focus();
        }
    }
}

interface EquipmentPopupSectionOptions {
    id: string;
    title: string;
    popup: EquipmentPopup;
    items: (EquipmentItem | FoodItem)[];
    onClick: (item: AnyItem, event: MouseEvent) => void;
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
                withOutline: true,
                onClick: event => {
                    this.options.onClick(item, event);
                    this.options.popup.hide();
                    tippy.hideAll();
                },
                tooltip: {
                    content:
                        item.id === Global.emptyEquipmentId || item.id === Global.emptyFoodId
                            ? 'Empty'
                            : Global.createItemInformationTooltip(item).replace(
                                  '"media-body"',
                                  '"media-body mcs-media-body"'
                              ),
                    placement: 'auto'
                }
            });

            wrapper.append(button);
        }

        this.append(title, wrapper);

        super.preRender(container);
    }
}

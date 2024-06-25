import './food-slot.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { Global } from 'src/app/global';
import { EquipmentController } from 'src/app/user-interface/pages/_parts/equipment/equipment-controller';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { ImageLoader } from 'src/app/utils/image-loader';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-food-slot': FoodSlot;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/equipment/food-slot/food-slot.html')
export class FoodSlot extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _image: HTMLImageElement;
    private readonly _tooltip: HTMLDivElement;
    private readonly _dialog: Dialog;

    private readonly _search: HTMLInputElement;
    private readonly _equipmentContainer: HTMLDivElement;

    private readonly _unequip: HTMLButtonElement;
    private readonly _cancel: HTMLButtonElement;

    private readonly _items = new Map<FoodItem, HTMLDivElement>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-food-slot-template'));

        this._container = getElementFromFragment(this._content, 'mcs-food-slot-container', 'div');
        this._image = getElementFromFragment(this._content, 'mcs-food-slot-image', 'img');
        this._tooltip = getElementFromFragment(this._content, 'mcs-food-slot-tooltip', 'div');
        this._dialog = getElementFromFragment(this._content, 'mcs-food-slot-dialog', 'mcs-dialog');

        this._search = getElementFromFragment(this._content, 'mcs-food-slot-search', 'input');
        this._equipmentContainer = getElementFromFragment(this._content, 'mcs-food-slot-container', 'div');

        this._unequip = getElementFromFragment(this._content, 'mcs-food-slot-unequip', 'button');
        this._cancel = getElementFromFragment(this._content, 'mcs-food-slot-cancel', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._update();

        this._search.oninput = event => {
            // @ts-ignore
            const value = event?.target?.value?.toLowerCase();

            for (const [item, element] of this._items.entries()) {
                if (!value || EquipmentController.isMatch(item, value)) {
                    element.style.display = '';
                } else {
                    element.style.display = 'none';
                }
            }
        };

        if (this.getAttribute('readonly') === null) {
            this._container.onclick = () => {
                this._search.value = '';
                this._search.dispatchEvent(new InputEvent('input'));

                this._unequip.disabled = this.isEmpty;

                this._createItems();

                TooltipController.hide();
                DialogController.open(this._dialog, () => {
                    this._toggleItemContainer(true);
                    this._equipmentContainer.innerHTML = '';
                    this._items.clear();
                });

                setTimeout(() => {
                    if (!nativeManager.isMobile) {
                        this._search.focus();
                    }
                }, 10);
            };
        }

        this._cancel.onclick = () => DialogController.close();

        this._unequip.onclick = () => {
            DialogController.close();
            Global.game.combat.player.unequipFood();
            this._update();
            StatsController.update();
        };
    }

    public _update() {
        this._tooltip.innerHTML = this.isEmpty
            ? 'Food'
            : this.getFoodTooltip(Global.game.combat.player.food.currentSlot.item);

        this._image.src = Global.game.combat.player.food.currentSlot.item.media;
    }

    private get isEmpty() {
        return Global.game.combat.player.food.currentSlot.item.id === 'melvorD:Empty_Food';
    }

    private _createItems() {
        const sections = EquipmentController.get('Food');

        for (const section of sections) {
            const sectionElement = createElement('div', { classList: ['mcs-food-slot-section'] });

            for (const item of section.items) {
                const attributes: [string, string][] = Global.stores.equipment.state.isAlternateEquipmentSelector
                    ? undefined
                    : [['data-mcsTooltip', '']];

                const itemContainer = createElement('div', {
                    classList: ['mcs-food-slot-item'],
                    attributes
                });

                const tooltipAttributes: [string, string][] = Global.stores.equipment.state.isAlternateEquipmentSelector
                    ? undefined
                    : [['data-mcsTooltipContent', '']];

                const itemTooltip = createElement('div', { attributes: tooltipAttributes });
                itemTooltip.innerHTML = this.getFoodTooltip(item as FoodItem);

                itemContainer.onclick = () => {
                    if (Global.stores.equipment.state.isAlternateEquipmentSelector) {
                        const scrollPosition = this._dialog._getScrollTop();

                        this._equipmentContainer.innerHTML = '';
                        this._items.clear();
                        this._toggleItemContainer(false);

                        const equipmentSelector = createElement('div', { classList: ['mcs-equipment-selector-popup'] });
                        const header = createElement('div', { classList: ['mcs-equipment-selector-header'] });

                        const equip = createElement('button', { classList: ['mcs-button'], text: 'Equip' });
                        const back = createElement('button', { classList: ['mcs-button-secondary'], text: 'Back' });

                        equip.onclick = () => {
                            this._toggleItemContainer(true);
                            this._createItems();
                            this._equipItem(item as FoodItem);
                            this._dialog._setScrollTop(scrollPosition);
                        };

                        back.onclick = () => {
                            this._toggleItemContainer(true);
                            this._createItems();
                            equipmentSelector.remove();
                            this._dialog._setScrollTop(scrollPosition);
                        };

                        header.append(equip, back);

                        const content = createElement('div', { classList: ['mcs-equipment-selector-content'] });
                        const itemImage = createElement('img', {
                            attributes: [['src', item.media]],
                            classList: ['mt-1', 'mb-1', 'mcs-equipment-selector-item-image']
                        });

                        content.append(itemImage, itemTooltip);

                        equipmentSelector.append(header, content);

                        this._equipmentContainer.appendChild(equipmentSelector);
                    } else {
                        this._equipItem(item as FoodItem);
                    }
                };

                const itemImage = createElement('img');
                itemImage.style.clipPath = 'inset(2.6px)';

                this._items.set(item as FoodItem, itemContainer);

                if (this._search.value && !EquipmentController.isMatch(item, this._search.value)) {
                    itemContainer.style.display = 'none';
                }

                ImageLoader.register(itemImage, item.media);

                itemContainer.appendChild(itemImage);

                if (!Global.stores.equipment.state.isAlternateEquipmentSelector) {
                    TooltipController.init(itemContainer);
                    itemContainer.appendChild(itemTooltip);
                }

                sectionElement.appendChild(itemContainer);
            }

            this._equipmentContainer.appendChild(
                createElement('div', { classList: ['mcs-food-slot-section-title'], text: section.title })
            );
            this._equipmentContainer.appendChild(sectionElement);
        }
    }

    private getFoodTooltip(item: FoodItem) {
        let tooltip = `<div class="text-left mt-1 mb-1"><div class="text-warning mb-2">${item.name}</div><small class="text-left">`;

        if (item.hasDescription) {
            let description = item.description;

            try {
                description = item.modifiedDescription;
            } catch {}

            tooltip += `<div class="text-info mt-1 mb-1">${description}</div>`;
        }

        tooltip += `<div class="mt-2">Healing:</div><span class="mb-1">`;
        tooltip += `<span class='text-success'>+${numberWithCommas(
            Global.game.combat.player.getFoodHealing(item)
        )} HP</span>`;
        tooltip += `</span>`;
        tooltip += '</small></div>';

        return tooltip;
    }

    private _equipItem(item: FoodItem) {
        Global.game.combat.player.equipFood(item, 0);

        DialogController.close();
        this._update();

        TooltipController.hide();
        StatsController.update();
    }

    private _toggleItemContainer(visible: boolean) {
        this._search.style.display = visible ? '' : 'none';
    }
}

customElements.define('mcs-food-slot', FoodSlot);

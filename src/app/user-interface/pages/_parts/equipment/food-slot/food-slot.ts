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
                DialogController.open(this._dialog);

                setTimeout(() => {
                    if (!nativeManager.isMobile) {
                        this._search.focus();
                    }
                }, 10);
            };
        }

        this._cancel.onclick = () => this._clear();

        this._unequip.onclick = () => {
            this._clear();
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

    private _clear() {
        DialogController.close();
        this._equipmentContainer.innerHTML = '';
        this._items.clear();
    }

    private get isEmpty() {
        return Global.game.combat.player.food.currentSlot.item.id === 'melvorD:Empty_Food';
    }

    private _createItems() {
        const sections = EquipmentController.get('Food');

        for (const section of sections) {
            const sectionElement = createElement('div', { classList: ['mcs-food-slot-section'] });

            for (const item of section.items) {
                const itemContainer = createElement('div', {
                    classList: ['mcs-food-slot-item'],
                    attributes: [['data-mcsTooltip', '']]
                });

                itemContainer.onclick = () => {
                    Global.game.combat.player.equipFood(item as FoodItem, 0);

                    this._clear();
                    this._update();

                    TooltipController.hide();
                    StatsController.update();
                };

                const itemImage = createElement('img');
                itemImage.style.clipPath = 'inset(2.6px)';

                const itemTooltip = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
                itemTooltip.innerHTML = this.getFoodTooltip(item as FoodItem);

                this._items.set(item as FoodItem, itemContainer);

                ImageLoader.register(itemImage, item.media);
                TooltipController.init(itemContainer);

                itemContainer.appendChild(itemImage);
                itemContainer.appendChild(itemTooltip);
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
}

customElements.define('mcs-food-slot', FoodSlot);

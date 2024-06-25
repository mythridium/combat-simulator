import './equipment-slot.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { Global } from 'src/app/global';
import { EquipmentController } from 'src/app/user-interface/pages/_parts/equipment/equipment-controller';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { ImageLoader } from 'src/app/utils/image-loader';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import type { SynergySlot } from 'src/app/user-interface/pages/_parts/equipment/synergy-slot/synergy-slot';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { EquipmentPage } from 'src/app/user-interface/pages/configuration/equipment/equipment';
import { SpellsPage } from 'src/app/user-interface/pages/configuration/spells/spells';
import { PrayersPage } from 'src/app/user-interface/pages/configuration/prayers/prayers';
import { SettingsController } from 'src/app/settings-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-equipment-slot': EquipmentSlot;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/equipment/equipment-slot/equipment-slot.html')
export class EquipmentSlot extends HTMLElement {
    private _slot: EquippedItem;
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _image: HTMLImageElement;
    private readonly _tooltip: HTMLDivElement;
    private readonly _dialog: Dialog;
    private readonly _title: HTMLDivElement;

    private readonly _search: HTMLInputElement;
    private readonly _equipmentContainer: HTMLDivElement;

    private readonly _unequip: HTMLButtonElement;
    private readonly _cancel: HTMLButtonElement;

    private _spells: SpellsPage;
    private _prayers: PrayersPage;
    private _equipment: EquipmentPage;
    private _equipmentSlots: EquipmentSlot[];
    private _synergy: SynergySlot;

    private readonly _items = new Map<EquipmentItem | FoodItem, HTMLDivElement>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-equipment-slot-template'));

        this._container = getElementFromFragment(this._content, 'mcs-equipment-slot-container', 'div');
        this._image = getElementFromFragment(this._content, 'mcs-equipment-slot-image', 'img');
        this._tooltip = getElementFromFragment(this._content, 'mcs-equipment-slot-tooltip', 'div');
        this._dialog = getElementFromFragment(this._content, 'mcs-equipment-slot-dialog', 'mcs-dialog');
        this._title = getElementFromFragment(this._content, 'mcs-equipment-slot-dialog-title', 'div');

        this._search = getElementFromFragment(this._content, 'mcs-equipment-slot-search', 'input');
        this._equipmentContainer = getElementFromFragment(this._content, 'mcs-equipment-slot-container', 'div');

        this._unequip = getElementFromFragment(this._content, 'mcs-equipment-slot-unequip', 'button');
        this._cancel = getElementFromFragment(this._content, 'mcs-equipment-slot-cancel', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._spells = Global.userInterface.main.querySelector('mcs-spells');
        this._prayers = Global.userInterface.main.querySelector('mcs-prayers');
        this._equipment = Global.userInterface.main.querySelector('mcs-equipment-page');
        this._equipmentSlots = Array.from(Global.userInterface.main.querySelectorAll(`mcs-equipment-slot`)).filter(
            element => element !== this
        );
        this._synergy = Global.userInterface.main.querySelector('mcs-synergy-slot');

        this._title.textContent = this._slot.slot.localID;

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
                this._unequip.disabled = this._slot.isEmpty;
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
            Global.game.combat.player.unequipItem(0, this._slot.slot);

            if (this._slot.slot.id === 'melvorD:Summon1' || this._slot.slot.id === 'melvorD:Summon2') {
                this._synergy._toggle(false);
            }

            this._spells._update();
            this._prayers._update();
            this._update();
            StatsController.update();

            this._equipment._setAttackStyleDropdown();
            this._equipment['_food']._update();
        };
    }

    public _set(slot: EquippedItem) {
        this._slot = slot;
        this._update();
    }

    private _update() {
        this._tooltip.innerHTML = this._slot.isEmpty
            ? this._slot.slot.localID
            : EquipmentController.getEquipmentTooltip(this._slot.item);
        this._image.src = this._slot.isEmpty ? this._slot.slot.emptyMedia : this._slot.item.media;
        this._image.classList.toggle('mcs-occupied', this._slot.occupiedBy !== undefined);
    }

    private _createItems() {
        const sections = this._slot.slot.isModded
            ? [
                  {
                      items: Global.game.items.equipment.filter(item =>
                          item.validSlots.some(slot => slot.id === this._slot.slot.id)
                      ),
                      title: 'Items'
                  }
              ]
            : EquipmentController.get(this._slot.slot.id);

        for (const section of sections) {
            const sectionElement = createElement('div', { classList: ['mcs-equipment-slot-section'] });

            for (const item of section.items) {
                const attributes: [string, string][] = Global.stores.equipment.state.isAlternateEquipmentSelector
                    ? undefined
                    : [['data-mcsTooltip', '']];

                const itemContainer = createElement('div', {
                    classList: ['mcs-equipment-slot-item'],
                    attributes
                });

                const tooltipAttributes: [string, string][] = Global.stores.equipment.state.isAlternateEquipmentSelector
                    ? undefined
                    : [['data-mcsTooltipContent', '']];

                const itemTooltip = createElement('div', { attributes: tooltipAttributes });
                itemTooltip.innerHTML = EquipmentController.getEquipmentTooltip(item as EquipmentItem);

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
                            this._equipItem(item as EquipmentItem);
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
                        this._equipItem(item as EquipmentItem);
                    }
                };

                const itemImage = createElement('img');
                itemImage.style.clipPath = 'inset(2.6px)';

                this._items.set(item, itemContainer);

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
                createElement('div', { classList: ['mcs-equipment-slot-section-title'], text: section.title })
            );
            this._equipmentContainer.appendChild(sectionElement);
        }
    }

    private _equipItem(item: EquipmentItem) {
        DialogController.close();
        Global.game.combat.player.equipItem(
            item,
            undefined,
            this._slot.slot,
            undefined,
            SettingsController.isImporting
        );
        this._update();

        for (const element of this._equipmentSlots) {
            element._update();
        }

        if (this._slot.slot.id === 'melvorD:Summon1' || this._slot.slot.id === 'melvorD:Summon2') {
            if (
                !Global.game.combat.player.equipment.equippedItems['melvorD:Summon1'].isEmpty &&
                !Global.game.combat.player.equipment.equippedItems['melvorD:Summon1'].isEmpty
            ) {
                const summon1 = Global.melvor.items.equipment.getObjectByID(
                    Global.game.combat.player.equipment.equippedItems['melvorD:Summon1'].item.id
                );
                const summon2 = Global.melvor.items.equipment.getObjectByID(
                    Global.game.combat.player.equipment.equippedItems['melvorD:Summon2'].item.id
                );

                if (summon1 && summon2) {
                    const synergyData = Global.melvor.summoning.getSynergy(summon1, summon2);

                    const isEnabled = synergyData
                        ? Global.melvor.summoning.isSynergyUnlocked.call(Global.melvor.summoning, synergyData)
                        : true;

                    this._synergy._toggle(isEnabled);
                }
            } else {
                this._synergy._toggle(false);
            }
        }

        this._spells._update();
        this._prayers._update();
        TooltipController.hide();
        StatsController.update();

        this._equipment._setAttackStyleDropdown();
        this._equipment['_food']._update();
    }

    private _toggleItemContainer(visible: boolean) {
        this._search.style.display = visible ? '' : 'none';
    }
}

customElements.define('mcs-equipment-slot', EquipmentSlot);

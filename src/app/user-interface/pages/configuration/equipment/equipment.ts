import './equipment.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { Equipment } from 'src/app/user-interface/pages/_parts/equipment/equipment';
import { Dropdown } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { FoodSlot } from 'src/app/user-interface/pages/_parts/equipment/food-slot/food-slot';
import { SettingsController } from 'src/app/settings-controller';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-equipment-page': EquipmentPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/equipment/equipment.html')
export class EquipmentPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _equipment: Equipment;
    private readonly _attackStyle: Dropdown;
    private readonly _food: FoodSlot;
    private readonly _autoEat: Dropdown;
    private readonly _manuallyEating: Switch;
    private readonly _cookingPool: Switch;
    private readonly _abyssal25CookingPool: Switch;
    private readonly _abyssal95CookingPool: Switch;
    private readonly _cookingMastery: Switch;
    private readonly _tooltipHint: HTMLDivElement;

    private readonly _equipmentSetContainer: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-equipment-page-template'));

        this._equipment = getElementFromFragment(this._content, 'mcs-equipment-equipment', 'mcs-equipment');
        this._attackStyle = getElementFromFragment(this._content, 'mcs-equipment-attack-style', 'mcs-dropdown');
        this._food = getElementFromFragment(this._content, 'mcs-equipment-food', 'mcs-food-slot');
        this._autoEat = getElementFromFragment(this._content, 'mcs-equipment-auto-eat', 'mcs-dropdown');
        this._manuallyEating = getElementFromFragment(this._content, 'mcs-equipment-manually-eating', 'mcs-switch');
        this._cookingPool = getElementFromFragment(this._content, 'mcs-equipment-cooking-pool', 'mcs-switch');
        this._abyssal25CookingPool = getElementFromFragment(
            this._content,
            'mcs-equipment-abyssal-25-cooking-pool',
            'mcs-switch'
        );
        this._abyssal95CookingPool = getElementFromFragment(
            this._content,
            'mcs-equipment-abyssal-95-cooking-pool',
            'mcs-switch'
        );
        this._cookingMastery = getElementFromFragment(this._content, 'mcs-equipment-cooking-mastery', 'mcs-switch');
        this._tooltipHint = getElementFromFragment(this._content, 'mcs-settings-tooltip-hint', 'div');

        this._equipmentSetContainer = getElementFromFragment(this._content, 'mcs-equipment-import-container', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._setAttackStyleDropdown();

        this._autoEat._init({
            search: false,
            label: 'Auto Eat',
            default: '-1',
            options: [
                { value: '-1', text: 'No Auto Eat' },
                ...Global.game.autoEatTiers.map((tier, index) => ({
                    value: index.toString(),
                    text: Global.melvor.shop.purchases.getObjectByID(tier).name.replace(' - Tier', '')
                }))
            ],
            onChange: option => {
                Global.game.setAutoEatTier(parseInt(option.value));
                StatsController.update();
            }
        });

        this._manuallyEating._toggle(false);
        this._cookingPool._toggle(Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.melvor) >= 3);
        this._abyssal25CookingPool._toggle(Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.abyssal) >= 1);
        this._abyssal95CookingPool._toggle(Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.abyssal) >= 3);
        this._cookingMastery._toggle(Global.game.combat.player.cookingMastery);

        this._manuallyEating._on(isChecked => (Global.game.combat.player.isManualEating = isChecked));

        this._cookingPool._on(isChecked => {
            if (isChecked) {
                const cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.melvor);
                Global.game.cooking._masteryPoolXP.data.set(Lookup.melvor, cap);
            } else {
                Global.game.cooking._masteryPoolXP.data.set(Lookup.melvor, 0);
            }

            StatsController.update();
            this._food._update();
        });

        this._abyssal25CookingPool._on(isChecked => {
            if (isChecked) {
                let cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.abyssal);

                if (!this._abyssal95CookingPool._value) {
                    cap = cap * 0.25;
                }

                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, cap);
            } else {
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, 0);
                this._abyssal95CookingPool._toggle(isChecked);
            }

            StatsController.update();
            this._food._update();
        });

        this._abyssal95CookingPool._on(isChecked => {
            if (isChecked) {
                const cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.abyssal);
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, cap);
                this._abyssal25CookingPool._toggle(isChecked);
            } else {
                let cap = 0;

                if (this._abyssal25CookingPool._value) {
                    cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.abyssal) * 0.25;
                }

                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, cap);
            }

            StatsController.update();
            this._food._update();
        });

        this._cookingMastery._on(isChecked => {
            Global.game.combat.player.cookingMastery = isChecked;

            if (isChecked) {
                for (const action of Global.game.cooking.actions.allObjects) {
                    Global.game.cooking.actionMastery.set(action, { level: 99, xp: 13034432 });
                }
            } else {
                Global.game.cooking.actionMastery.clear();
            }

            StatsController.update();
            this._food._update();
        });

        this._createEquipmentSets();

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._abyssal25CookingPool.style.display = 'none';
            this._abyssal95CookingPool.style.display = 'none';
        }

        if (nativeManager.isMobile) {
            this._tooltipHint.style.display = 'none';
        }
    }

    public _import(
        equipment: Map<string, string>,
        isSynergyUnlocked: boolean,
        isManuallyEating: boolean,
        cookingPool: boolean,
        abyssal25CookingPool: boolean,
        abyssal95CookingPool: boolean,
        cookingMastery: boolean,
        foodId: string,
        autoEatTier: number,
        styles: {
            melee: string;
            ranged: string;
            magic: string;
        }
    ) {
        Global.game.combat.player.equipFood(Global.game.items.food.getObjectByID(foodId), 0);
        Global.game.setAutoEatTier(autoEatTier);
        Global.game.combat.player.equipment.unequipAll();

        for (const slot of Global.game.equipmentSlots.allObjects) {
            const itemId = equipment.get(slot.id);

            if (!itemId || itemId === 'melvorD:Empty_Equipment') {
                continue;
            }

            const item = Global.game.items.equipment.getObjectByID(itemId);

            if (item && !item.occupiesSlots.some(itemSlot => itemSlot === slot)) {
                Global.game.combat.player.equipItem(item, 0, slot, 1, SettingsController.isImporting);
            }
        }

        Global.game.combat.player.isSynergyUnlocked = isSynergyUnlocked;

        Global.game.combat.player.attackStyles.melee = Global.game.attackStyles.getObjectByID(styles.melee);
        Global.game.combat.player.attackStyles.ranged = Global.game.attackStyles.getObjectByID(styles.ranged);
        Global.game.combat.player.attackStyles.magic = Global.game.attackStyles.getObjectByID(styles.magic);

        Global.game.combat.player.isManualEating = isManuallyEating;

        if (cookingPool) {
            const cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.melvor);
            Global.game.cooking._masteryPoolXP.data.set(Lookup.melvor, cap);
        } else {
            Global.game.cooking._masteryPoolXP.data.set(Lookup.melvor, 0);
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            if (abyssal25CookingPool) {
                const cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.abyssal);
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, cap * 0.25);
            } else {
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, 0);
            }

            if (abyssal95CookingPool) {
                const cap = Global.game.cooking.getBaseMasteryPoolCap(Lookup.abyssal);
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, cap);
            } else {
                Global.game.cooking._masteryPoolXP.data.set(Lookup.abyssal, 0);
            }
        }

        Global.game.combat.player.cookingMastery = cookingMastery;

        if (cookingMastery) {
            for (const action of Global.game.cooking.actions.allObjects) {
                Global.game.cooking.actionMastery.set(action, { level: 99, xp: 13034432 });
            }
        } else {
            Global.game.cooking.actionMastery.clear();
        }
        this._manuallyEating._toggle(isManuallyEating);
        this._cookingPool._toggle(cookingPool);
        this._abyssal25CookingPool._toggle(abyssal25CookingPool);
        this._abyssal95CookingPool._toggle(abyssal95CookingPool);
        this._cookingMastery._toggle(Global.game.combat.player.cookingMastery);

        this._equipment._update();
        this._food._update();
        this._autoEat._select(autoEatTier.toString());
    }

    public _updateTooltips() {
        this._equipment._update();
        this._food._update();
    }

    public _setAttackStyleDropdown() {
        const attackStyles = Global.game.attackStyles.allObjects.filter(
            attackStyle => attackStyle.attackType === Global.game.combat.player.attackType
        );

        this._attackStyle._init({
            search: false,
            label: 'Attack Style',
            default: Global.game.combat.player.attackStyle.id,
            options: attackStyles.map(attackStyle => ({
                text: attackStyle.name,
                value: attackStyle.id
            })),
            onChange: option => {
                Global.game.combat.player.attackStyles[Global.game.combat.player.attackType] =
                    Global.game.attackStyles.getObjectByID(option.value);

                StatsController.update();
            }
        });
    }

    private _createEquipmentSets() {
        this._equipmentSetContainer.innerHTML = '';

        for (let i = 0; i < Global.melvor.combat.player.equipmentSets.length; i++) {
            const importElement = createElement('button', { classList: ['mcs-button'], text: `${i + 1}` });

            importElement.onclick = () => SettingsController.importFromEquipmentSet(i);

            this._equipmentSetContainer.appendChild(importElement);
        }
    }
}

customElements.define('mcs-equipment-page', EquipmentPage);

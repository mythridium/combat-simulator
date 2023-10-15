import './food.scss';
import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { EquipmentItemComponent } from 'src/app/interface/components/player/equipment/equipment-item';
import { EquipmentCustomSlot } from 'src/app/interface/components/player/equipment/equipment.types';
import { EquipmentPopup } from 'src/app/interface/components/player/equipment/equipment-popup';
import { Source } from 'src/shared/stores/sync.store';
import { DropdownComponent } from 'src/app/interface/components/blocks/dropdown-component';

export class FoodComponent extends BaseComponent {
    private readonly autoEatPurchases = game.shop.purchases.filter(purchase => purchase.id.includes('Auto_Eat'));

    constructor() {
        super({ id: 'mcs-food', tag: 'div', classes: ['mcs-fixed-width'] });
    }

    protected init() {
        Global.equipment.subscribe(() => {
            this.get('mcs-food-wrapper').get(`mcs-equipment-item-${this._options.id}`)?.render();
            this.get(FoodHealing)?.render();
        });

        Global.configuration.subscribe(() => {
            this.get('mcs-food-wrapper')?.get(`mcs-equipment-item-${this._options.id}`)?.render();
            this.get(FoodHealing)?.render();
            this.get(DropdownComponent)?.render();
        });
    }

    protected preRender(container: HTMLElement): void {
        const wrapper = document.element({ tag: 'div', id: 'mcs-food-wrapper' });

        const item = new EquipmentItemComponent({
            id: this._options.id,
            slot: EquipmentCustomSlot.Food
        });

        wrapper.append(item);

        wrapper.append(
            new EquipmentPopup({
                id: this._options.id,
                slot: 'Food',
                onClick: item => {
                    Global.equipment.setState(Source.Interface, {
                        food: item.id === Global.emptyFoodId ? undefined : item.id
                    });
                }
            })
        );

        this.append(wrapper);
        this.append(new FoodHealing());

        this.append(
            new DropdownComponent({
                id: 'mcs-auto-eat',
                classes: ['ml-1'],
                options: [
                    { text: 'No Auto Eat', value: '-1' },
                    ...this.autoEatPurchases.map((purchase, index) => ({
                        text: purchase.name.replace(' - Tier', ''),
                        value: index.toString()
                    }))
                ],
                default: () => Global.configuration.state.autoEatTier,
                onChange: option => {
                    Global.configuration.setState(Source.Interface, { autoEatTier: option.value });
                }
            })
        );

        super.preRender(container);
    }
}

class FoodHealing extends BaseComponent {
    constructor() {
        super({ id: 'mcs-food-healing-value', tag: 'span', classes: ['mx-1'] });
    }

    protected preRender(container: HTMLElement): void {
        const food = game.items.food.getObjectByID(Global.equipment.state.food);

        this.append(document.element({ tag: 'img', src: 'assets/media/skills/hitpoints/hitpoints.svg' }));
        this.append(
            document.element({
                tag: 'span',
                classes: ['mcs-md-text', 'text-success'],
                innerHTML: `${food ? numberWithCommas(Global.getFoodHealing(food)) : 0}`
            })
        );

        super.preRender(container);
    }
}

import './player-component.scss';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { EquipmentComponent } from './equipment/equipment';
import { EquipmentSetComponent } from './equipment-sets/equipment-sets';
import { SynergyComponent } from './synergy/synergy';
import { PlayerSettingsComponent } from './settings/settings';
import { FoodComponent } from './food/food';
import { AttackStyleComponent } from './attack-style/attack-style';

export class PlayerComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-player' });
    }

    protected preRender(container: HTMLElement) {
        const equipment = new EquipmentComponent();
        const synergy = new SynergyComponent();
        const attackStyle = new AttackStyleComponent();
        const food = new FoodComponent();
        const settings = new PlayerSettingsComponent();
        const equipmentSets = new EquipmentSetComponent();

        this.append(equipment, synergy, attackStyle, food, settings, equipmentSets);

        super.preRender(container);
    }
}

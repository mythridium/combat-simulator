import './player-component.scss';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { EquipmentComponent } from './equipment/equipment';
import { EquipmentSetComponent } from './equipment-sets/equipment-sets';
import { SynergyComponent } from './synergy/synergy';

export class PlayerComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-player' });
    }

    protected preRender(container: HTMLElement) {
        const equipment = new EquipmentComponent();
        const synergy = new SynergyComponent();
        const equipmentSets = new EquipmentSetComponent();

        this.append(equipment, synergy, equipmentSets);

        super.preRender(container);
    }
}

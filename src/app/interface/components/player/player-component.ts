import './player-component.scss';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { EquipmentComponent } from './equipment/equipment';
import { EquipmentSetComponent } from './equipment-sets/equipment-sets';

export class PlayerComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-player' });
    }

    protected preRender(container: HTMLElement) {
        const equipment = new EquipmentComponent();
        const equipmentSets = new EquipmentSetComponent();

        this.append(equipment, equipmentSets);

        super.preRender(container);
    }
}

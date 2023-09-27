import { GameState } from 'src/app/state/game';
import { BaseComponent } from 'src/app/interface/components/base-component';
import { Source } from 'src/shared/stores/sync.store';

export class EquipmentComponent extends BaseComponent {
    constructor(private readonly state: GameState) {
        super({
            tag: 'div',
            id: 'mcs-equipment-container',
            classes: ['mcs-container']
        });

        this.state.equipment.when(Source.Worker).subscribe(() => this.render());
    }

    protected construct(): Element {
        const button = document.createElement('button');
        button.textContent = 'Test';
        button.onclick = () => {
            this.state.equipment.setState(Source.Interface, { equipmentIds: ['123'] });
        };

        this.fragment.append(button);

        return super.construct();
    }
}

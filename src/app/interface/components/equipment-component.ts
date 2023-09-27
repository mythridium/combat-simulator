import { GameState } from 'src/app/state/game';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from './blocks/button-component';

export class EquipmentComponent extends BaseComponent {
    constructor(private readonly state: GameState) {
        super({
            tag: 'div',
            id: 'mcs-equipment-container',
            classes: ['mcs-container']
        });

        this.state.equipment.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: Element) {
        const button = new ButtonComponent({
            id: 'test',
            content: 'Test',
            onClick: () => {
                this.state.equipment.setState(Source.Interface, { equipmentIds: ['123'] });
            }
        });

        this.append(button);

        super.preRender(container);
    }
}

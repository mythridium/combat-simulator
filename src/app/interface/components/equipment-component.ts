import { GameState } from 'src/app/state/game';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from './blocks/button-component';
import { Workers } from 'src/app/workers/workers';
import { MessageAction } from 'src/shared/messages/message';

export class EquipmentComponent extends BaseComponent {
    constructor(private readonly state: GameState, private readonly workers: Workers) {
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

        const simulateButton = new ButtonComponent({
            id: 'simulate',
            content: 'Simulate',
            onClick: async () => {
                await this.workers.send({ action: MessageAction.Simulate, data: undefined });
            }
        });

        this.append(button, simulateButton);

        super.preRender(container);
    }
}

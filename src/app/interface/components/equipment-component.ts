import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from './blocks/button-component';
import { Workers } from 'src/app/workers/workers';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';

export class EquipmentComponent extends BaseComponent {
    constructor(private readonly workers: Workers) {
        super({
            tag: 'div',
            id: 'mcs-equipment-container',
            classes: ['mcs-container']
        });

        Global.equipment.when(Source.Worker).subscribe(() => this.render());
        Global.simulation.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: Element) {
        const button = new ButtonComponent({
            id: 'test',
            content: 'Test',
            onClick: () => {
                Global.equipment.setState(Source.Interface, { equipmentIds: ['123'] });
            }
        });

        const { state, result } = Global.simulation.getState();

        const simulateButton = new ButtonComponent({
            id: 'simulate',
            content: this.getSimulateButtonText(state, result.length, 100),
            disabled: state === State.Cancelling,
            onClick: async () => {
                const { state } = Global.simulation.getState();

                if (state === State.Cancelling) {
                    return;
                }

                if (state === State.Running) {
                    this.workers.queue?.cancel();
                    return;
                }

                const requests = new Array(100)
                    .fill(0)
                    .map((_, index) => ({ monsterId: `Monster ${index}`, dungeonId: `Dungeon ${index}` }));

                this.workers.simulate(requests);
            }
        });

        this.append(button, simulateButton);

        super.preRender(container);
    }

    private getSimulateButtonText(state: State, count: number, total: number) {
        switch (state) {
            case State.Cancelling:
                return `Cancelling (${count}/${total})`;
            case State.Running:
                return `Simulating (${count}/${total})`;
            case State.Stopped:
                return 'Simulate';
        }
    }
}

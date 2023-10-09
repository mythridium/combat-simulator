import './player-component.scss';
import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from 'src/app/interface/components/blocks/button-component';
import { Workers } from 'src/app/workers/workers';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { EquipmentComponent } from './equipment/equipment';

export class PlayerComponent extends CardComponent {
    constructor(private readonly workers: Workers) {
        super({ id: 'mcs-player' });

        Global.equipment.when(Source.Worker).subscribe(() => this.render());
        Global.simulation.when(Source.Worker).subscribe(({ state, result }) => {
            const simulateButton = this.element.querySelector('#simulate');

            if (!simulateButton) {
                return;
            }

            simulateButton.textContent = this.getSimulateButtonText(state, result.length, 100);

            if (state === State.Cancelling) {
                simulateButton.setAttribute('disabled', 'disabled');
            } else {
                simulateButton.removeAttribute('disabled');
            }
        });
    }

    protected preRender(container: HTMLElement) {
        const equipment = new EquipmentComponent();

        const button = new ButtonComponent({
            id: 'test',
            content: 'Test',
            onClick: () => {
                //Global.workers.setState(Source.Interface, { useMaxCPU: !Global.workers.state.useMaxCPU });
                Global.equipment.setState(Source.Interface, {
                    equipment: [{ id: 'melvorD:Bronze_Sword', slot: 'Weapon', occupies: [] }]
                });
                Global.configuration.setState(Source.Interface, { isManualEating: true });
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

        this.append(equipment, button, simulateButton);

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

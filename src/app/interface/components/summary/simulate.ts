import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from 'src/app/interface/components/blocks/button-component';
import { Workers } from 'src/app/workers/workers';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';

export class SimulateComponent extends CardComponent {
    constructor(private readonly workers: Workers) {
        super({ id: 'mcs-simulate' });
    }

    protected init() {
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

                Global.simulation.setState(Source.Interface, { result: [] });

                const requests = new Array(100)
                    .fill(0)
                    .map((_, index) => ({ monsterId: `Monster ${index}`, dungeonId: `Dungeon ${index}` }));

                this.workers.simulate(requests);
            }
        });

        this.append(simulateButton);

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

import './simulate.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { LootPage } from 'src/app/user-interface/pages/configuration/loot/loot';
import { Information } from 'src/app/user-interface/information/information';
import { Plotter } from 'src/app/user-interface/pages/simulate/plotter/plotter';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-simulate-buttons': SimulateButtons;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/simulate/simulate.html')
export class SimulateButtons extends HTMLElement {
    private readonly _content = new DocumentFragment();

    public readonly _simulateAll: HTMLButtonElement;
    public readonly _simulateSelected: HTMLButtonElement;

    private _loot: LootPage;
    private _information: Information;
    private _plotter: Plotter;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-simulate-buttons-template'));

        this._simulateAll = getElementFromFragment(this._content, 'mcs-simulate-all', 'button');
        this._simulateSelected = getElementFromFragment(this._content, 'mcs-simulate-selected', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._simulateAll.onclick = () => this._simulate(false);
        this._simulateSelected.onclick = () => this._simulate(true);

        this._loot = Global.userInterface.main.querySelector('mcs-loot');
        this._information = Global.userInterface.main.querySelector('mcs-information.mcs-main-information');
        this._plotter = Global.userInterface.main.querySelector('mcs-plotter');
    }

    public _update() {
        this._loot._update();
        this._plotter._updateData();
        this._information._update();

        for (const simulate of Array.from(Global.userInterface.main.querySelectorAll('mcs-simulate-buttons'))) {
            simulate._simulateSelected.disabled = false;
            simulate._simulateAll.disabled = false;
            simulate._simulateAll.textContent = 'All';
        }
    }

    private async _simulate(selected: boolean) {
        if (Global.stores.simulator.state.isRunning) {
            for (const simulate of Array.from(Global.userInterface.main.querySelectorAll('mcs-simulate-buttons'))) {
                simulate._simulateSelected.disabled = true;
                simulate._simulateAll.disabled = true;
                simulate._simulateAll.textContent = 'Cancelling...';
            }

            return Global.simulation.cancel();
        }

        if (!Global.stores.simulator.state.isRunning) {
            for (const simulate of Array.from(Global.userInterface.main.querySelectorAll('mcs-simulate-buttons'))) {
                simulate._simulateSelected.disabled = true;
            }

            const update = await Global.simulation.startSimulation(selected);

            if (update) {
                this._update();
            }
        }
    }
}

customElements.define('mcs-simulate-buttons', SimulateButtons);

import './history.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { HistoryController, HistoryRecord } from './history-controller';
import { SimulationHistory } from './simulation-history/simulation-history';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-history': HistoryPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/history/history.html')
export class HistoryPage extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _history = new Map<number, SimulationHistory>();

    private readonly _clear: HTMLButtonElement;
    private readonly _trackHistory: Switch;
    private readonly _simulationHistory: HTMLDivElement;
    private readonly _empty: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-history-template'));

        this._clear = getElementFromFragment(this._content, 'mcs-history-clear', 'button');
        this._trackHistory = getElementFromFragment(this._content, 'mcs-track-history', 'mcs-switch');
        this._simulationHistory = getElementFromFragment(this._content, 'mcs-history-simulation-history', 'div');
        this._empty = getElementFromFragment(this._content, 'mcs-history-empty', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._clear.onclick = () => HistoryController.clear();
        this._trackHistory._toggle(Global.stores.simulator.state.trackHistory);
        this._trackHistory._on(isChecked => this._onSwitch(isChecked));

        HistoryController.init(this);
    }

    public _record(record: HistoryRecord) {
        const history = createElement('mcs-simulation-history');

        history._set(record);

        this._history.set(record.id, history);
        this._simulationHistory.appendChild(history);
        this._empty.style.display = 'none';
        this._clear.disabled = false;
    }

    public _delete(id: number) {
        const history = this._history.get(id);

        history.remove();

        this._history.delete(id);

        if (!this._history.size) {
            this._empty.style.display = '';
            this._clear.disabled = true;
        }
    }

    private _onSwitch(isChecked: boolean) {
        Global.stores.simulator.set({ trackHistory: isChecked });
    }
}

customElements.define('mcs-history', HistoryPage);

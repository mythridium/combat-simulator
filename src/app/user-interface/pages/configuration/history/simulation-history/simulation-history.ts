import './simulation-history.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import {
    HistoryController,
    HistoryRecord
} from 'src/app/user-interface/pages/configuration/history/history-controller';
import { Global } from 'src/app/global';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-simulation-history': SimulationHistory;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/history/simulation-history/simulation-history.html')
export class SimulationHistory extends HTMLElement {
    private _history: HistoryRecord;
    private readonly _content = new DocumentFragment();

    private readonly _load: HTMLButtonElement;
    private readonly _rename: HTMLButtonElement;
    private readonly _delete: HTMLButtonElement;

    private readonly _dialog: Dialog;
    private readonly _name: HTMLInputElement;
    private readonly _dialogClose: HTMLButtonElement;
    private readonly _dialogRename: HTMLButtonElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-simulation-history-template'));

        this._load = getElementFromFragment(this._content, 'mcs-simulation-history-load', 'button');
        this._rename = getElementFromFragment(this._content, 'mcs-simulation-history-rename', 'button');
        this._delete = getElementFromFragment(this._content, 'mcs-simulation-history-delete', 'button');

        this._dialog = getElementFromFragment(this._content, 'mcs-simulation-history-rename-dialog', 'mcs-dialog');
        this._name = getElementFromFragment(this._content, 'mcs-simulation-history-name', 'input');
        this._dialogClose = getElementFromFragment(this._content, 'mcs-simulation-history-dialog-close', 'button');
        this._dialogRename = getElementFromFragment(this._content, 'mcs-simulation-history-dialog-rename', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._load.onclick = () => this._onLoad();
        this._rename.onclick = () => this._onRename();
        this._delete.onclick = () => this._onDelete();

        this._name.oninput = () => {
            this._dialogRename.disabled = !this._name.value.length;
        };

        this._dialogClose.onclick = () => DialogController.close();
        this._dialogRename.onclick = () => {
            this._history.name = this._name.value;
            this._set(this._history);
            DialogController.close();
        };
    }

    public _set(record: HistoryRecord) {
        this._history = record;
        this._load.textContent = record.name;
    }

    private _onLoad() {
        Global.simulation.loadSimulation(this._history.record);

        for (const simulate of Array.from(Global.userInterface.main.querySelectorAll('mcs-simulate-buttons'))) {
            simulate._update();
        }
    }

    private _onRename() {
        this._name.value = this._history.name;
        setTimeout(() => this._name.focus(), 10);
        DialogController.open(this._dialog);
    }

    private _onDelete() {
        HistoryController.delete(this._history.id);
    }
}

customElements.define('mcs-simulation-history', SimulationHistory);

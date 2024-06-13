import './export-dialog.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { SettingsController } from 'src/app/settings-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-export-dialog': ExportDialog;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/settings/export-dialog/export-dialog.html')
export class ExportDialog extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _exportDialog: Dialog;
    private readonly _exportClose: HTMLButtonElement;
    private readonly _textarea: HTMLTextAreaElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-settings-export-dialog-template'));

        this._exportDialog = getElementFromFragment(this._content, 'mcs-settings-export-dialog', 'mcs-dialog');
        this._exportClose = getElementFromFragment(this._content, 'mcs-settings-export-dialog-close', 'button');
        this._textarea = getElementFromFragment(this._content, 'mcs-settings-export-dialog-textarea', 'textarea');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._exportClose.onclick = () => DialogController.close();
        this._textarea.onclick = () => this._textarea.setSelectionRange(0, this._textarea.value.length);
    }

    public _open() {
        this._textarea.value = SettingsController.exportAsString();
        DialogController.open(this._exportDialog);
    }
}

customElements.define('mcs-export-dialog', ExportDialog);

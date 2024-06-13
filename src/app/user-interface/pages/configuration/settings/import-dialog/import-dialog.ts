import './import-dialog.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { SettingsController } from 'src/app/settings-controller';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-import-dialog': ImportDialog;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/settings/import-dialog/import-dialog.html')
export class ImportDialog extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _importDialog: Dialog;
    private readonly _importClose: HTMLButtonElement;
    private readonly _import: HTMLButtonElement;
    private readonly _failureContainer: HTMLPreElement;
    private readonly _failure: HTMLElement;
    private readonly _textarea: HTMLTextAreaElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-settings-import-dialog-template'));

        this._importDialog = getElementFromFragment(this._content, 'mcs-settings-import-dialog', 'mcs-dialog');
        this._importClose = getElementFromFragment(this._content, 'mcs-settings-import-dialog-close', 'button');
        this._import = getElementFromFragment(this._content, 'mcs-settings-import-dialog-import', 'button');
        this._failureContainer = getElementFromFragment(this._content, 'mcs-settings-import-dialog-pre', 'pre');
        this._failure = getElementFromFragment(this._content, 'mcs-settings-import-dialog-failure', 'code');
        this._textarea = getElementFromFragment(this._content, 'mcs-settings-import-dialog-textarea', 'textarea');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._importClose.onclick = () => this._resetAndClose();

        this._textarea.oninput = () => {
            this._failureContainer.style.display = '';
            this._failure.textContent = '';
        };

        this._import.onclick = () => {
            if (!this._textarea.value) {
                return;
            }

            try {
                SettingsController.importFromString(this._textarea.value);
                this._resetAndClose();
            } catch (exception) {
                this._failure.textContent = `Failed to import settings. ${exception.stack}`;
                this._failureContainer.style.display = 'block';
                Global.logger.error(`Failed to import settings.`, exception, this._textarea.value);
            }
        };
    }

    public _open() {
        DialogController.open(this._importDialog);
    }

    private _resetAndClose() {
        this._failureContainer.style.display = '';
        this._failure.textContent = '';
        this._textarea.value = '';
        DialogController.close();
    }
}

customElements.define('mcs-import-dialog', ImportDialog);

import './import-dialog.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { SettingsController } from 'src/app/settings-controller';
import { Global } from 'src/app/global';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';

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
    private readonly _expandableContainer: HTMLDivElement;
    private readonly _expandableHeader: HTMLDivElement;
    private readonly _expandableBody: HTMLDivElement;

    private readonly _importPets: Switch;
    private readonly _importAstrology: Switch;
    private readonly _importCorruption: Switch;
    private readonly _importSkillTrees: Switch;
    private readonly _importAncientRelics: Switch;

    private _isAdvancedOpen = false;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-settings-import-dialog-template'));

        this._importDialog = getElementFromFragment(this._content, 'mcs-settings-import-dialog', 'mcs-dialog');
        this._importClose = getElementFromFragment(this._content, 'mcs-settings-import-dialog-close', 'button');
        this._import = getElementFromFragment(this._content, 'mcs-settings-import-dialog-import', 'button');
        this._failureContainer = getElementFromFragment(this._content, 'mcs-settings-import-dialog-pre', 'pre');
        this._failure = getElementFromFragment(this._content, 'mcs-settings-import-dialog-failure', 'code');
        this._textarea = getElementFromFragment(this._content, 'mcs-settings-import-dialog-textarea', 'textarea');
        this._expandableContainer = getElementFromFragment(
            this._content,
            'mcs-settings-import-advanced-selection',
            'div'
        );
        this._expandableHeader = getElementFromFragment(this._content, 'mcs-settings-import-expandable-header', 'div');
        this._expandableBody = getElementFromFragment(this._content, 'mcs-settings-import-expandable-body', 'div');

        this._importPets = getElementFromFragment(this._content, 'mcs-settings-import-pets', 'mcs-switch');
        this._importAstrology = getElementFromFragment(this._content, 'mcs-settings-import-astrology', 'mcs-switch');
        this._importCorruption = getElementFromFragment(this._content, 'mcs-settings-import-corruption', 'mcs-switch');
        this._importSkillTrees = getElementFromFragment(this._content, 'mcs-settings-import-skill-trees', 'mcs-switch');
        this._importAncientRelics = getElementFromFragment(
            this._content,
            'mcs-settings-import-ancient-relics',
            'mcs-switch'
        );
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._importClose.onclick = () => DialogController.close();

        this._textarea.oninput = () => {
            this._failureContainer.style.display = '';
            this._failure.textContent = '';
        };

        this._import.onclick = () => {
            if (!this._textarea.value) {
                return;
            }

            try {
                SettingsController.importFromStringWithSelection(this._textarea.value, {
                    pets: this._importPets._value,
                    astrology: this._importAstrology._value,
                    corruption: this._importCorruption._value,
                    skillTrees: this._importSkillTrees._value,
                    ancientRelics: this._importAncientRelics._value
                });

                DialogController.close();
            } catch (exception) {
                this._failure.textContent = `Failed to import settings. ${exception.stack}`;
                this._failureContainer.style.display = 'block';
                Global.logger.error(`Failed to import settings.`, exception, this._textarea.value);
            }
        };

        this._expandableHeader.onclick = () => this._toggleExpandable(!this._isAdvancedOpen);

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._importCorruption.style.display = 'none';
            this._importSkillTrees.style.display = 'none';
        }

        this._update();
    }

    public _update() {
        this._importAncientRelics.style.display = Global.game.currentGamemode.allowAncientRelicDrops ? 'block' : 'none';
    }

    private _toggleExpandable(toggle: boolean) {
        this._isAdvancedOpen = toggle;

        this._expandableContainer.classList.toggle('mcs-is-open', this._isAdvancedOpen);
        this._expandableHeader.classList.toggle('mcs-is-open', this._isAdvancedOpen);
        this._expandableBody.classList.toggle('mcs-is-open', this._isAdvancedOpen);
    }

    public _open() {
        DialogController.open(this._importDialog, () => {
            this._failureContainer.style.display = '';
            this._failure.textContent = '';
            this._textarea.value = '';
            this._importPets._toggle(false);
            this._importAstrology._toggle(false);
            this._importCorruption._toggle(false);
            this._importSkillTrees._toggle(false);
            this._importAncientRelics._toggle(false);
            this._toggleExpandable(false);
        });
    }
}

customElements.define('mcs-import-dialog', ImportDialog);

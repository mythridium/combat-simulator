import './save-slots.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { Global } from 'src/app/global';
import { SettingsController } from 'src/app/settings-controller';
import { SaveSlot, SaveSlotData } from 'src/app/utils/save-slot';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-save-slots': SaveSlots;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/equipment/save-slots/save-slots.html')
export class SaveSlots extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _dialog: Dialog;
    private readonly _save: HTMLButtonElement;
    private readonly _load: HTMLButtonElement;
    private readonly _cancel: HTMLButtonElement;
    private readonly _overwrite: HTMLDivElement;
    private readonly _new: HTMLDivElement;
    private readonly _name: HTMLInputElement;

    private readonly _max = 5;
    private readonly _key = 'save-slots';
    private readonly _slots: SaveSlotData[] = [];

    private readonly _loaded: Promise<void>;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-save-slots-template'));

        this._container = getElementFromFragment(this._content, 'mcs-save-slot-container', 'div');
        this._dialog = getElementFromFragment(this._content, 'mcs-save-slot-dialog', 'mcs-dialog');
        this._save = getElementFromFragment(this._content, 'mcs-save-slot-save', 'button');
        this._load = getElementFromFragment(this._content, 'mcs-save-slot-load', 'button');
        this._cancel = getElementFromFragment(this._content, 'mcs-save-slot-cancel', 'button');
        this._overwrite = getElementFromFragment(this._content, 'mcs-save-slot-overwrite', 'div');
        this._new = getElementFromFragment(this._content, 'mcs-save-slot-new', 'div');
        this._name = getElementFromFragment(this._content, 'mcs-save-slot-name', 'input');

        this._loaded = this._init();
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._loaded.then(() => this._createSaveSlots());

        this._cancel.onclick = () => DialogController.close();
    }

    private _createSaveSlots() {
        this._container.innerHTML = '';

        for (let i = 0; i < this._max; i++) {
            const defaultName = `Save Slot ${i + 1}`;
            const slotElement = createElement('button', { classList: ['mcs-button'], text: `${i + 1}` });
            const tooltip = createElement('div', {
                attributes: [['data-mcsTooltipContent', '']],
                text: this._slots[i]?.name ?? defaultName
            });

            slotElement.dataset.mcstooltip = '';
            slotElement.appendChild(tooltip);

            slotElement.onclick = () => {
                const slot = this._slots[i];

                if (slot) {
                    this._name.value = slot.name;
                    this._load.disabled = false;
                    this._overwrite.style.display = 'block';
                    this._new.style.display = 'none';
                } else {
                    this._name.value = defaultName;
                    this._load.disabled = true;
                    this._overwrite.style.display = 'none';
                    this._new.style.display = 'block';
                }

                this._save.onclick = async () => {
                    tooltip.textContent = this._name.value;
                    await this._saveDataToSlot(i);
                    DialogController.close();
                };

                this._load.onclick = () => {
                    SettingsController.importFromString(slot.data);
                    DialogController.close();
                };

                DialogController.open(this._dialog);

                setTimeout(() => {
                    this._name.focus();
                    this._name.setSelectionRange(this._name.value.length, this._name.value.length);
                }, 10);
            };

            this._container.appendChild(slotElement);
            TooltipController.init(slotElement);
        }
    }

    private async _saveDataToSlot(index: number) {
        const saveSlot: SaveSlotData = {
            index,
            name: this._name.value,
            data: SettingsController.exportAsString()
        };

        try {
            await SaveSlot.save(`${this._key}-${index}-${currentCharacter}`, saveSlot);
        } catch (error) {
            Global.logger.error(`Failed to save slot to indexeddb.`, error);
        }

        this._slots[index] = saveSlot;
    }

    private async _init() {
        try {
            for (let i = 0; i < this._max; i++) {
                try {
                    const saveString: string | null = localStorage.getItem(`${this._key}-${i}-${currentCharacter}`);

                    // migrate existing data
                    if (saveString) {
                        await SaveSlot.save(`${this._key}-${i}-${currentCharacter}`, JSON.parse(saveString));
                        localStorage.removeItem(`${this._key}-${i}-${currentCharacter}`);
                    }
                } catch (error) {
                    Global.logger.error('Failed to migrated existing save slot', error);
                }

                const save: SaveSlotData | null = await SaveSlot.get(`${this._key}-${i}-${currentCharacter}`);

                if (save) {
                    this._slots[i] = save;
                }
            }
        } catch (error) {
            Global.logger.error(`Failed to load save slots`, error);
        }
    }
}

customElements.define('mcs-save-slots', SaveSlots);

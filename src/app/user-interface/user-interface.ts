import 'src/app/user-interface/elements';
import './styles.scss';
import type { Main } from './main/main';
import { DialogController } from './_parts/dialog/dialog-controller';
import { StorageKey } from '../utils/account-storage';
import {
    DEFAULT_TOGGLE_PANEL_KEYBIND,
    doesEventMatchShortcut,
    isEditableTarget,
    normalizeShortcutInput
} from '../utils/keyboard-shortcut';
import { Global } from '../global';

export class UserInterface {
    public main!: Main;
    private readonly _onDocumentKeydown = (event: KeyboardEvent) => {
        if (isEditableTarget(event.target)) {
            return;
        }

        const shortcut =
            normalizeShortcutInput(Global.context.accountStorage.getItem(StorageKey.TogglePanelKeybind)) ??
            DEFAULT_TOGGLE_PANEL_KEYBIND;

        if (!doesEventMatchShortcut(event, shortcut)) {
            return;
        }

        event.preventDefault();
        this.main.toggle();
    };

    public init() {
        this.main = createElement('mcs-main', { classList: ['is-closed'] });
        document.addEventListener('keydown', this._onDocumentKeydown);

        document.body.append(createElement('mcs-tooltip'));
        document.body.append(this.main);

        const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });

        backdrop.onclick = () => {
            if (DialogController['current']?.allowBackdropClose) {
                DialogController.close();
            }
        };

        this.main.prepend(backdrop);
        document.body.append(createElement('div', { id: 'mcs-backdrop' }));

        sidebar.category('Modding').item('Combat Simulator', {
            icon: 'assets/media/skills/combat/combat.png',
            itemClass: 'mcs-combat-simulator',
            onClick: () => this.main.toggle()
        });
    }
}

import './bugs.scss';
import { Global } from 'src/app/global';
import { SettingsController } from 'src/app/settings-controller';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';

export abstract class Bugs {
    public static report(isLoaded: boolean, error?: Error) {
        if (error) {
            Global.logger.error(error);
        }

        const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });
        const dialog = createElement('mcs-dialog', { id: 'mcs-bugs' });

        if (error) {
            dialog.innerHTML += `<div slot="header">Combat Simulator Error</div>`;
        } else {
            dialog.innerHTML += `<div slot="header">Found a bug?</div>`;
        }

        dialog.innerHTML += `
                <div slot="content" class="mcs-with-textarea">
                    <div>Copy the following information and report it to Mythridium on the Melvor Discord or at <a href="https://github.com/mythridium/combat-simulator/issues" target="_blank">https://github.com/mythridium/combat-simulator</a></div>
                    <br />
                    <div>The following information contains your save file and a copy of your combat sim configuration if possible.</div>
                    <br />
                    <textarea readonly="readonly" class="mcs-bugs-content form-control mcs-code" rows="4"></textarea>
                </div>

                <div slot="footer">
                    <button id="mcs-bugs-done" class="mcs-button">Done</button>
                </div>
            `;

        const textarea = dialog.querySelector<HTMLTextAreaElement>('.mcs-bugs-content');
        const done = dialog.querySelector<HTMLButtonElement>('#mcs-bugs-done');

        done.onclick = () => {
            DialogController.close();
            dialog.remove();
            backdrop.remove();
        };

        textarea.onclick = () => textarea.setSelectionRange(0, textarea.value.length);

        if (error) {
            textarea.value += `${error.message}\n\n${error.stack}\n\n`;
        }

        textarea.value += `Melvor Version: ${gameVersion}
Sim Version: ${Global.context.version}

Mod List:
`;
        for (const modName of mod.manager.getLoadedModList()) {
            textarea.value += ` - ${modName}\n`;
        }

        textarea.value += `
Save Game String:
        `;

        textarea.value += game.generateSaveString();
        textarea.value += `

Sim String:

`;
        try {
            textarea.value += SettingsController.exportAsString();
        } catch (error) {
            textarea.value += error.stack;
        }

        if (!isLoaded) {
            document.body.appendChild(backdrop);
        }

        document.body.appendChild(dialog);

        DialogController.open(dialog, undefined, false);
    }
}

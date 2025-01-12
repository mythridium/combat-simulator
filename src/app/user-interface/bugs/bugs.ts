import './bugs.scss';
import { Global } from 'src/app/global';
import { SettingsController } from 'src/app/settings-controller';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { Util } from 'src/shared/util';

export abstract class Bugs {
    public static report(isLoaded: boolean, error?: Error) {
        let isWillIDie = false;

        try {
            isWillIDie = error && !isLoaded && mod.manager.getLoadedModList().includes('Will I Die?');
        } catch {}

        if (error) {
            Global.logger.error(error);
        }

        const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });
        const dialog = createElement('mcs-dialog', { id: 'mcs-bugs' });

        if (isWillIDie) {
            dialog.innerHTML += `<div slot="header">Remove Will I Die</div>
                <div slot="content" class="mcs-with-textarea">
                    <div>You have Will I Die installed!</div>
                    <br />
                    <div>This mod has not been updated for the current version of the game and should be disabled. This outdated version of Will I Die results in Combat Simulator failing to run.</div>
                    <br />
                    <div>Please review ALL your mods!</div>
                    <textarea readonly="readonly" class="mcs-bugs-content form-control mcs-code" rows="4"></textarea>
                </div>

                <div slot="footer">
                    <button id="mcs-bugs-done" class="mcs-button">Done</button>
                </div>
                `;
        } else {
            if (error) {
                dialog.innerHTML += `<div slot="header">Combat Simulator Error</div>`;
            } else {
                dialog.innerHTML += `<div slot="header">Found a bug?</div>`;
            }

            dialog.innerHTML += `
                    <div slot="content" class="mcs-with-textarea">
                        <div>Please reach out on the Melvor Discord mod bug reports channel for assistance.</div>
                        <br />
                        <div>The following information contains your save file and a copy of your combat sim configuration if possible.</div>
                        <br />
                        <textarea readonly="readonly" class="mcs-bugs-content form-control mcs-code" rows="4"></textarea>
                    </div>

                    <div slot="footer">
                        <button id="mcs-bugs-done" class="mcs-button">Done</button>
                    </div>
                `;
        }

        const textarea = dialog.querySelector<HTMLTextAreaElement>('.mcs-bugs-content');
        const done = dialog.querySelector<HTMLButtonElement>('#mcs-bugs-done');

        if (isWillIDie) {
            textarea.style.display = 'none';
        }

        done.onclick = () => {
            DialogController.close();
            dialog.remove();
            backdrop.remove();
        };

        textarea.onclick = () => textarea.setSelectionRange(0, textarea.value.length);

        if (error) {
            textarea.value += `Message: ${error.message}\n\n---\n\n${error.stack}\n\n`;
        }

        let expansionsOwned = [];

        if (
            !cloudManager.hasTotHEntitlementAndIsEnabled &&
            !cloudManager.hasAoDEntitlementAndIsEnabled &&
            !cloudManager.hasItAEntitlementAndIsEnabled
        ) {
            expansionsOwned.push('None');
        } else {
            if (cloudManager.hasTotHEntitlementAndIsEnabled) {
                expansionsOwned.push(`TotH`);
            }

            if (cloudManager.hasAoDEntitlementAndIsEnabled) {
                expansionsOwned.push(`AoD`);
            }

            if (cloudManager.hasItAEntitlementAndIsEnabled) {
                expansionsOwned.push(`ItA`);
            }
        }

        let version = Util.fileVersion();

        if (!version.startsWith('?')) {
            version = `?${version}`;
        }

        textarea.value += `Melvor Version: ${gameVersion}${version}
Sim Version: ${Global.context.version}

Expansions Enabled: ${expansionsOwned.join(', ')}

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

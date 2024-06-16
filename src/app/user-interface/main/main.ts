import './main.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { Global } from 'src/app/global';
import { SettingsController } from 'src/app/settings-controller';
import { StorageKey } from 'src/app/utils/account-storage';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-main': Main;
    }
}

@LoadTemplate('app/user-interface/main/main.html')
export class Main extends HTMLElement {
    public isOpen = false;
    private isFirstOpen = true;
    private readonly _content = new DocumentFragment();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-main-template'));
    }

    public connectedCallback() {
        this.id = 'mcs-combat-simulator';
        this.appendChild(this._content);

        StatsController.init(this);
        TooltipController.initAll(this);
        PageController.goTo(PageId.Equipment);

        StatsController.update();
    }

    public toggle() {
        if (this.isFirstOpen) {
            this.isFirstOpen = false;

            try {
                if (Global.context.accountStorage.getItem(StorageKey.ImportOnFirstOpen)) {
                    SettingsController.importFromEquipmentSet(Global.melvor.combat.player.selectedEquipmentSet);

                    Global.logger.log(
                        `Successfully imported equipment set [${Global.melvor.combat.player.selectedEquipmentSet}] on first open.`
                    );
                }
            } catch (error) {
                Global.logger.error(`Failed to import equipment set on startup.`, error);
            }
        }

        this.isOpen = !this.isOpen;

        this.classList.toggle('is-closed', !this.isOpen);
        document.body.classList.toggle('mcs-is-open', this.isOpen);

        const backdrop = document.getElementById('mcs-backdrop');

        backdrop.classList.toggle('is-open', this.isOpen);
    }
}

customElements.define('mcs-main', Main);

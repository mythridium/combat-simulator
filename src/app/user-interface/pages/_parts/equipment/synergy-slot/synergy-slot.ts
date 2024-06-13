import './synergy-slot.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-synergy-slot': SynergySlot;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/equipment/synergy-slot/synergy-slot.html')
export class SynergySlot extends HTMLElement {
    private readonly _unlocked = 'assets/media/skills/summoning/synergy.svg';
    private readonly _locked = 'assets/media/skills/summoning/synergy_locked.svg';

    private readonly _content = new DocumentFragment();

    private readonly _image: HTMLImageElement;
    private readonly _tooltip: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-synergy-slot-template'));

        this._image = getElementFromFragment(this._content, 'mcs-synergy-slot-image', 'img');
        this._tooltip = getElementFromFragment(this._content, 'mcs-synergy-slot-tooltip', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
        this.dataset.mcstooltip = '';
        this._toggle(Global.game.combat.player.isSynergyUnlocked);

        if (this.getAttribute('readonly') === null) {
            this.onclick = () => this._toggle();
        }
    }

    public _toggle(toggle?: boolean) {
        Global.game.combat.player.isSynergyUnlocked = toggle ?? !Global.game.combat.player.isSynergyUnlocked;

        const synergy = Global.game.combat.player.isSynergyUnlocked
            ? Global.game.combat.player.equippedSummoningSynergy
            : null;

        this._image.src = synergy ? this._unlocked : this._locked;

        if (synergy) {
            this._tooltip.innerHTML = `<div class="text-info">${synergy.description}</div>`;
        } else {
            this._tooltip.innerHTML = 'Synergy Locked';
        }

        TooltipController.update(this);
        StatsController.update();
    }
}

customElements.define('mcs-synergy-slot', SynergySlot);

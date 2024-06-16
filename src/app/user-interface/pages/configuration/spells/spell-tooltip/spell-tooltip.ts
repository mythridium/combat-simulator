import './spell-tooltip.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-spell-tooltip': SpellTooltip;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/spells/spell-tooltip/spell-tooltip.html')
export class SpellTooltip extends HTMLElement {
    private readonly _content = new DocumentFragment();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-spell-tooltip-template'));
    }

    public connectedCallback() {
        this.appendChild(this._content);

        // @ts-ignore
        const spell = Global.game[`${this.dataset.mcsspelltype}Spells`].getObjectByID(this.dataset.mcsspellid);

        // only init outside of tooltip content to prevent double tooltips
        if (spell && this.parentElement.className === 'mcs-tooltip-content') {
            this.innerHTML = '';

            // @ts-ignore
            const tooltip = createElement(`${this.dataset.mcsspelltype}-spell-tooltip`);

            tooltip.setSpell(spell);
            this.appendChild(tooltip);

            const requirement = createElement('small', { classList: ['text-warning', 'd-block', 'pt-2'] });

            let requirements = `Requires:`;

            if (spell.level) {
                requirements += `<div>Level: <span class="text-white">${spell.level}</span></div>`;
            }

            if (spell.abyssalLevel) {
                requirements += `<div>Abyssal Level: <span class="text-white">${spell.abyssalLevel}</span></div>`;
            }

            if (spell.requiredItem) {
                requirements += `<div>Item Equipped: <img src="${spell.requiredItem.media}" width="14" height="14" /> <span class="text-white">${spell.requiredItem.name}</span></div>`;
            }

            requirement.innerHTML = requirements;

            this.appendChild(requirement);
        }
    }
}

customElements.define('mcs-spell-tooltip', SpellTooltip);

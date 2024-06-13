import './prayer-tooltip.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-prayer-tooltip': PrayerTooltip;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/prayers/prayer-tooltip/prayer-tooltip.html')
export class PrayerTooltip extends HTMLElement {
    private readonly _content = new DocumentFragment();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-prayer-tooltip-template'));
    }

    public connectedCallback() {
        this.appendChild(this._content);

        // @ts-ignore
        const prayer = Global.game.prayers.getObjectByID(this.dataset.mcsprayerid);

        // only init outside of tooltip content to prevent double tooltips
        if (prayer && this.parentElement.className === 'mcs-tooltip-content') {
            this.innerHTML = '';

            // @ts-ignore
            const tooltip = createElement(`prayer-tooltip`);

            tooltip.setPrayer(prayer);
            this.appendChild(tooltip);

            const elements = this.querySelectorAll('.justify-vertical-center');

            if (elements?.length) {
                for (const element of Array.from(elements)) {
                    element.classList.remove('justify-vertical-center');
                    element.classList.add('justify-vertical-left', 'text-left');
                }
            }

            const requirement = createElement('small', { classList: ['text-warning', 'd-block', 'pt-2'] });

            let requirements = `Requires:`;

            if (prayer.level) {
                requirements += `<div>Level: <span class="text-white">${prayer.level}</span></div>`;
            }

            // @ts-ignore // TODO: TYPES
            if (prayer.abyssalLevel) {
                // @ts-ignore // TODO: TYPES
                requirements += `<div>Abyssal Level: <span class="text-white">${prayer.abyssalLevel}</span></div>`;
            }

            requirement.innerHTML = requirements;

            this.appendChild(requirement);
        }
    }
}

customElements.define('mcs-prayer-tooltip', PrayerTooltip);

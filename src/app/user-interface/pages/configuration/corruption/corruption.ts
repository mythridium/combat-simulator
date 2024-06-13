import './corruption.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { StatsController } from '../../_parts/out-of-combat-stats/stats-controller';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-corruption': CorruptionPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/corruption/corruption.html')
export class CorruptionPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _toggleButton: HTMLButtonElement;
    private readonly _automaticallyCorrupt: Switch;

    private readonly _effects = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-corruption-template'));

        this._container = getElementFromFragment(this._content, 'mcs-corruption-effects-container', 'div');
        this._toggleButton = getElementFromFragment(this._content, 'mcs-corruption-toggle', 'button');
        this._automaticallyCorrupt = getElementFromFragment(
            this._content,
            'mcs-corruption-automatically-corrupt',
            'mcs-switch'
        );
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._toggleButton.onclick = () => this._toggle();

        // @ts-ignore // TODO: TYPES
        for (const effect of Global.game.corruption?.corruptionEffects?.allRows ?? []) {
            const element = createElement('mcs-button-image', {
                attributes: [
                    ['data-mcsSrc', effect.effect.media],
                    ['data-mcsSkipAsync', '']
                ]
            });

            const tooltipContainer = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
            const tooltipContent = createElement('small');

            tooltipContent.innerHTML = `<div class="text-info">${effect.customDescription}</div>`;
            tooltipContainer.append(tooltipContent);

            element.appendChild(tooltipContainer);

            element._on(isSelected => {
                this._update(effect, isSelected);
                StatsController.update();
            });

            this._effects.set(effect.effect.id, element);

            this._container.appendChild(element);
        }

        this._automaticallyCorrupt._on(isSelected => {
            Global.game.combat.player.isAutoCorrupt = isSelected;
        });
    }

    public _import(effectsIds: string[], isAutoCorrupt: boolean) {
        for (const [effectId, element] of this._effects) {
            // @ts-ignore // TODO: TYPES
            const effect = Global.game.corruption.corruptionEffects.allRows.find(
                // @ts-ignore // TODO: TYPES
                effect => effect.effect.id === effectId
            );
            const isSelected = effectsIds.includes(effectId);

            element._toggle(isSelected);
            this._update(effect, isSelected);
        }

        Global.game.combat.player.isAutoCorrupt = isAutoCorrupt;
        this._automaticallyCorrupt._toggle(isAutoCorrupt);
    }

    private _toggle() {
        if (this._hasCorruptionEffects()) {
            this._import([], Global.game.combat.player.isAutoCorrupt);
        } else {
            this._import(
                // @ts-ignore // TODO: TYPES
                Global.game.corruption.corruptionEffects.lockedRows.map(row => row.effect.id),
                Global.game.combat.player.isAutoCorrupt
            );
        }

        StatsController.update();
    }

    private _hasCorruptionEffects() {
        // @ts-ignore // TODO: TYPES
        return Global.game.corruption.corruptionEffects.unlockedRows.length > 0;
    }

    // TODO: TYPES
    private _update(effect: any, isSelected: boolean) {
        if (isSelected) {
            // @ts-ignore // TODO: TYPES
            const index = Global.game.corruption.corruptionEffects.lockedRows.findIndex(row => row === effect);

            if (index === -1) {
                return;
            }

            // @ts-ignore // TODO: TYPES
            Global.game.corruption.corruptionEffects.lockedRows.splice(index, 1);
            // @ts-ignore // TODO: TYPES
            Global.game.corruption.corruptionEffects.unlockedRows.push(effect);

            effect.isUnlocked = true;
        } else {
            // @ts-ignore // TODO: TYPES
            const index = Global.game.corruption.corruptionEffects.unlockedRows.findIndex(row => row === effect);

            if (index === -1) {
                return;
            }

            // @ts-ignore // TODO: TYPES
            Global.game.corruption.corruptionEffects.unlockedRows.splice(index, 1);
            // @ts-ignore // TODO: TYPES
            Global.game.corruption.corruptionEffects.lockedRows.push(effect);

            effect.isUnlocked = false;
        }
    }
}

customElements.define('mcs-corruption', CorruptionPage);

import './levels.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { SpellsPage } from 'src/app/user-interface/pages/configuration/spells/spells';
import { PrayersPage } from 'src/app/user-interface/pages/configuration/prayers/prayers';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-levels': LevelsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/levels/levels.html')
export class LevelsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _levelsContainer: HTMLDivElement;
    private readonly _abyssalLevelsContainer: HTMLDivElement;

    private _spellsPage: SpellsPage;
    private _prayersPage: PrayersPage;

    private readonly _levels: { [index: string]: HTMLInputElement } = {};
    private readonly _abyssalLevels: { [index: string]: HTMLInputElement } = {};

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-levels-template'));

        this._levelsContainer = getElementFromFragment(this._content, 'mcs-levels-container', 'div');
        this._abyssalLevelsContainer = getElementFromFragment(this._content, 'mcs-abyssal-levels-container', 'div');

        for (const skillName of Global.combatSkillLocalIds) {
            this._levelsContainer.appendChild(this._create(skillName, false));
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            for (const skillName of Global.combatAbyssalSkillLocalIds) {
                this._abyssalLevelsContainer.appendChild(this._create(skillName, true));
            }
        }
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._spellsPage = Global.userInterface.main.querySelector('mcs-spells');
        this._prayersPage = Global.userInterface.main.querySelector('mcs-prayers');
    }

    public _import(levels: Map<string, number>, abyssalLevels: Map<string, number>) {
        for (const skillName of Global.combatSkillLocalIds) {
            const level = levels.get(Global.skillIds[skillName]);

            if (level !== undefined) {
                Global.game.combat.player.skillLevel.set(Global.skillIds[skillName], level);
                this._levels[skillName].value = level.toString();
            }
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            for (const skillName of Global.combatAbyssalSkillLocalIds) {
                const abyssalLevel = abyssalLevels.get(Global.skillIds[skillName]);

                if (abyssalLevel !== undefined) {
                    Global.game.combat.player.skillAbyssalLevel.set(Global.skillIds[skillName], abyssalLevel);
                    this._abyssalLevels[skillName].value = abyssalLevel.toString();
                }
            }
        }
    }

    private _create(skillName: string, isAbyssal: boolean) {
        const skill = Global.game.skills.find(skill => skill.localID === skillName);

        const container = createElement('div', { classList: ['mcs-level-field'] });
        const field = createElement('mcs-field');

        const level = createElement('input', {
            classList: ['form-control'],
            attributes: [
                ['type', 'number'],
                ['min', '1'],
                ['max', isAbyssal ? skill.maxAbyssalLevelCap.toString() : skill.maxLevelCap.toString()],
                ['value', isAbyssal ? skill.startingAbyssalLevel.toString() : skill.startingLevel.toString()]
            ]
        });

        level.oninput = event => this._onInput(event, skillName, isAbyssal);
        level.onblur = () => this._onBlur(skillName);

        if (isAbyssal) {
            this._abyssalLevels[skillName] = level;
        } else {
            this._levels[skillName] = level;
        }

        field.appendChild(
            createElement('img', {
                attributes: [
                    ['slot', 'image'],
                    ['src', skill.media]
                ]
            })
        );
        field.appendChild(
            createElement('span', {
                attributes: [['slot', 'text']],
                text: isAbyssal && skillName !== 'Corruption' ? `Abyssal ${skillName}` : skillName
            })
        );
        field.appendChild(level);

        container.appendChild(field);

        return container;
    }

    private _onInput(event: Event, skillName: string, isAbyssal: boolean) {
        // @ts-ignore
        let newLevel = parseInt(event.currentTarget.value);
        const input = event.currentTarget as HTMLInputElement;

        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (newLevel < min) {
            input.value = min.toString();
            newLevel = min;
        }

        if (newLevel > max) {
            input.value = max.toString();
            newLevel = max;
        }

        if (newLevel >= min && newLevel <= max) {
            if (isAbyssal) {
                Global.game.combat.player.skillAbyssalLevel.set(Global.skillIds[skillName], newLevel);
            } else {
                Global.game.combat.player.skillLevel.set(Global.skillIds[skillName], newLevel);
            }
            StatsController.update();
        }
    }

    private _onBlur(skillName: string) {
        if (skillName === 'Magic') {
            this._spellsPage._update();
        }

        if (skillName === 'Prayer') {
            this._prayersPage._update();
        }
    }
}

customElements.define('mcs-levels', LevelsPage);

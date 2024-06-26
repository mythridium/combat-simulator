import './astrology.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { Global } from 'src/app/global';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { AstrologySettings } from 'src/app/settings-controller';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-astrology': AstrologyPage;
    }
}

enum ModifierType {
    Standard = 'standard',
    Unique = 'unique',
    Abyssal = 'abyssal'
}

enum ToggleType {
    Melvor,
    Abyssal
}

@LoadTemplate('app/user-interface/pages/configuration/astrology/astrology.html')
export class AstrologyPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toggleButtonMelvor: HTMLButtonElement;
    private readonly _toggleButtonAbyssal: HTMLButtonElement;
    private readonly _tabs = new Map<string, Tabs>();

    private readonly _modifiers = new Map<string, ButtonImage[]>();

    private readonly constellationsToIgnore = [
        'melvorF:Deedree',
        'melvorF:Ameria',
        'melvorF:Ko',
        'melvorTotH:Variel',
        'melvorTotH:Haemir',
        'melvorAoD:Nysa',
        'melvorItA:CorruptedDeedree',
        'melvorItA:CorruptedAmeria',
        'melvorItA:Celestis'
    ];

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-astrology-template'));

        this._toggleButtonMelvor = getElementFromFragment(this._content, 'mcs-constellation-toggle-melvor', 'button');
        this._toggleButtonAbyssal = getElementFromFragment(this._content, 'mcs-constellation-toggle-abyssal', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);
        this._init();
    }

    public _import(settings: Map<string, AstrologySettings>) {
        const constellations = this._getConstellations();

        for (const constellation of constellations) {
            const constellationSettings = settings.get(constellation.id) ?? {
                standardModsBought: [0, 0, 0],
                uniqueModsBought: [0, 0, 0],
                abyssalModsBought: [0, 0, 0, 0]
            };

            Global.game.astrology.actionMastery.set(constellation, { xp: 13034432, level: 99 });

            if (constellation.standardModifiers.length) {
                this._toggleBought(constellation, constellationSettings.standardModsBought, ModifierType.Standard);

                for (const [index, bought] of constellationSettings.standardModsBought.entries()) {
                    constellation.standardModifiers[index].timesBought = bought;
                }
            }

            if (constellation.uniqueModifiers.length) {
                this._toggleBought(constellation, constellationSettings.uniqueModsBought, ModifierType.Unique);

                for (const [index, bought] of constellationSettings.uniqueModsBought.entries()) {
                    constellation.uniqueModifiers[index].timesBought = bought;
                }
            }

            if (constellation.abyssalModifiers.length) {
                this._toggleBought(constellation, constellationSettings.abyssalModsBought, ModifierType.Abyssal);

                for (const [index, bought] of constellationSettings.abyssalModsBought.entries()) {
                    constellation.abyssalModifiers[index].timesBought = bought;
                }
            }
        }

        this._updateTooltips();
    }

    public _updateTooltips() {
        const constellations = this._getConstellations();

        for (const constellation of constellations) {
            this._updateTooltip(constellation, ModifierType.Standard);
            this._updateTooltip(constellation, ModifierType.Unique);
            this._updateTooltip(constellation, ModifierType.Abyssal);
        }
    }

    private _toggleBought(constellation: AstrologyRecipe, boughtModifiers: number[], type: ModifierType) {
        for (const [index, bought] of boughtModifiers.entries()) {
            const elements = this._modifiers.get(`${constellation.id}-${type}-${index}`);

            for (const [i, element] of elements.entries()) {
                element._toggle(i < bought);
            }
        }
    }

    private _updateTooltip(constellation: AstrologyRecipe, type: ModifierType) {
        for (const [index, modifier] of constellation[`${type}Modifiers`].entries()) {
            const elements = this._modifiers.get(`${constellation.id}-${type}-${index}`);

            for (const [i, element] of elements.entries()) {
                const tooltip = element.querySelector('[data-mcsTooltipContent]');

                if (tooltip) {
                    tooltip.innerHTML = this._getConstellationModifierDescription(modifier, i + 1, constellation);
                }
            }
        }
    }

    private _toggle(type: ToggleType) {
        const astrologyModifiers: Map<string, AstrologySettings> = new Map();

        if (type === ToggleType.Melvor) {
            for (const constellation of Global.game.astrology.actions.allObjects) {
                astrologyModifiers.set(constellation.id, {
                    standardModsBought: constellation.standardModifiers.map(modifier =>
                        this._hasConstellations(type) ? 0 : modifier.maxCount
                    ),
                    uniqueModsBought: constellation.uniqueModifiers.map(modifier =>
                        this._hasConstellations(type) ? 0 : modifier.maxCount
                    ),
                    abyssalModsBought: constellation.abyssalModifiers.map(modifier => modifier.timesBought)
                });
            }
        }

        if (type === ToggleType.Abyssal) {
            for (const constellation of Global.game.astrology.actions.allObjects) {
                astrologyModifiers.set(constellation.id, {
                    standardModsBought: constellation.standardModifiers.map(modifier => modifier.timesBought),
                    uniqueModsBought: constellation.uniqueModifiers.map(modifier => modifier.timesBought),
                    abyssalModsBought: constellation.abyssalModifiers.map(modifier =>
                        this._hasConstellations(type) ? 0 : modifier.maxCount
                    )
                });
            }
        }

        this._import(astrologyModifiers);

        StatsController.update();
    }

    private _hasConstellations(type: ToggleType) {
        if (type === ToggleType.Melvor) {
            return Global.game.astrology.actions.allObjects.some(action => {
                return (
                    action.standardModifiers.some(modifier => modifier.timesBought) ||
                    action.uniqueModifiers.some(modifier => modifier.timesBought)
                );
            });
        }

        if (type === ToggleType.Abyssal) {
            return Global.game.astrology.actions.allObjects.some(action => {
                return action.abyssalModifiers.some(modifier => modifier.timesBought);
            });
        }

        return true;
    }

    private _init() {
        this._toggleButtonMelvor.onclick = () => this._toggle(ToggleType.Melvor);
        this._toggleButtonAbyssal.onclick = () => this._toggle(ToggleType.Abyssal);

        const constellations = this._getConstellations();

        for (const constellation of constellations) {
            const header = createElement('div', {
                attributes: [
                    ['slot', 'tab-header'],
                    ['data-mcsTooltip', '']
                ]
            });

            header.appendChild(createElement('img', { attributes: [['src', constellation.media]] }));
            header.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: constellation.name })
            );

            const content = createElement('div', { attributes: [['slot', 'tab-content']] });

            content.appendChild(this._createConstellationName(constellation));

            const container = createElement('div', { classList: ['mcs-constellation-container'] });

            for (const [index, modifier] of constellation.standardModifiers.entries()) {
                container.appendChild(this._createModifier(constellation, modifier, index, ModifierType.Standard));
            }

            for (const [index, modifier] of constellation.uniqueModifiers.entries()) {
                container.appendChild(this._createModifier(constellation, modifier, index, ModifierType.Unique));
            }

            for (const [index, modifier] of constellation.abyssalModifiers.entries()) {
                container.appendChild(this._createModifier(constellation, modifier, index, ModifierType.Abyssal));
            }

            content.appendChild(container);

            const tab = this._getContainer(constellation.realm);

            tab.appendChild(header);
            tab.appendChild(content);
        }

        for (const tab of this._tabs.values()) {
            this.appendChild(tab);
            tab._init();
        }
    }

    private _getContainer(realm: Realm) {
        if (!this._tabs.has(realm.id)) {
            this._tabs.set(realm.id, createElement('mcs-tabs'));
        }

        return this._tabs.get(realm.id);
    }

    private _getConstellations() {
        return Global.game.astrology.actions.allObjects
            .filter(constellation => !this.constellationsToIgnore.includes(constellation.id))
            .sort((a, b) => a.level - b.level);
    }

    private _createConstellationName(constellation: AstrologyRecipe) {
        const container = createElement('div', { classList: ['mcs-constellation-header'] });
        const skillContainer = createElement('div', { classList: ['mcs-constellation-skill-header'] });

        for (const skill of constellation.skills) {
            skillContainer.appendChild(createElement('img', { attributes: [['src', skill.media]] }));
        }

        container.appendChild(createElement('div', { text: constellation.name }));
        container.appendChild(skillContainer);

        return container;
    }

    private _createModifier(
        constellation: AstrologyRecipe,
        modifier: AstrologyModifier,
        index: number,
        type: ModifierType
    ) {
        const container = createElement('div', { classList: ['mcs-astrology-modifier-container'] });
        const modifierList = createElement('div', { classList: ['mcs-astrology-modifier-list'] });

        container.appendChild(modifierList);

        const modifierElements: ButtonImage[] = [];

        for (let i = 0; i < modifier.maxCount; i++) {
            const element = createElement('mcs-button-image', {
                classList: ['mcs-astrology-modifier'],
                attributes: [['data-mcsSrc', `assets/media/skills/astrology/star_${type}.svg`]]
            });

            const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
            tooltipContent.innerHTML = this._getConstellationModifierDescription(modifier, i + 1, constellation);

            element.appendChild(tooltipContent);

            element._on(() => {
                for (const modifierElement of modifierElements) {
                    modifierElement._toggle(false);
                }

                if (constellation[`${type}Modifiers`][index].timesBought !== i + 1) {
                    for (const [index, modifierElement] of modifierElements.entries()) {
                        if (index <= i) {
                            modifierElement._toggle(true);
                        }
                    }
                }

                constellation[`${type}Modifiers`][index].timesBought =
                    constellation[`${type}Modifiers`][index].timesBought === i + 1 ? 0 : i + 1;

                Global.game.astrology.actionMastery.set(constellation, { xp: 13034432, level: 99 });

                this._updateTooltip(constellation, ModifierType.Standard);
                this._updateTooltip(constellation, ModifierType.Unique);
                this._updateTooltip(constellation, ModifierType.Abyssal);
                StatsController.update();
                TooltipController.trigger();
            });

            modifierElements.push(element);
            modifierList.appendChild(element);
        }

        this._modifiers.set(`${constellation.id}-${type}-${index}`, modifierElements);

        return container;
    }

    private _getConstellationModifierDescription(
        modifier: AstrologyModifier,
        buyCount: number,
        constellation: AstrologyRecipe
    ) {
        const multi =
            Global.game.astrology.hasMasterRelic(Global.game.defaultRealm) &&
            Global.game.astrology.isConstellationComplete(constellation)
                ? 2
                : 1;

        const modValue = buyCount * modifier.incrementValue * multi;

        const mods = StatObject.formatDescriptions(
            modifier.stats,
            getElementDescriptionFormatter('div', 'mb-1'),
            modValue,
            modValue
        );

        let text = '<small class="d-block mt-1">';

        for (const [_, mod] of mods.entries()) {
            text += mod.outerHTML;
        }

        return text + '</small>';
    }
}

customElements.define('mcs-astrology', AstrologyPage);

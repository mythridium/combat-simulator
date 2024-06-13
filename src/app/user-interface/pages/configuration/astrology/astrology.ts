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

@LoadTemplate('app/user-interface/pages/configuration/astrology/astrology.html')
export class AstrologyPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toggleButton: HTMLButtonElement;
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

        this._toggleButton = getElementFromFragment(this._content, 'mcs-constellation-toggle', 'button');
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
                    // @ts-ignore // TODO: TYPES
                    constellation.standardModifiers[index].timesBought = bought;
                }
            }

            if (constellation.uniqueModifiers.length) {
                this._toggleBought(constellation, constellationSettings.uniqueModsBought, ModifierType.Unique);

                for (const [index, bought] of constellationSettings.uniqueModsBought.entries()) {
                    // @ts-ignore // TODO: TYPES
                    constellation.uniqueModifiers[index].timesBought = bought;
                }
            }

            // @ts-ignore // TODO: TYPES
            if (constellation.abyssalModifiers.length) {
                this._toggleBought(constellation, constellationSettings.abyssalModsBought, ModifierType.Abyssal);

                // @ts-ignore // TODO: TYPES
                for (const [index, bought] of constellationSettings.abyssalModsBought.entries()) {
                    // @ts-ignore // TODO: TYPES
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
        // @ts-ignore // TODO: TYPES
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

    private _toggle() {
        if (this._hasConstellations()) {
            this._import(new Map());
        } else {
            const astrologyModifiers: Map<string, AstrologySettings> = new Map();

            for (const constellation of Global.game.astrology.actions.allObjects) {
                astrologyModifiers.set(constellation.id, {
                    // @ts-ignore // TODO: TYPES
                    standardModsBought: constellation.standardModifiers.map(modifier => modifier.maxCount),
                    // @ts-ignore // TODO: TYPES
                    uniqueModsBought: constellation.uniqueModifiers.map(modifier => modifier.maxCount),
                    // @ts-ignore // TODO: TYPES
                    abyssalModsBought: constellation.abyssalModifiers.map(modifier => modifier.maxCount)
                });
            }

            this._import(astrologyModifiers);
        }

        StatsController.update();
    }

    private _hasConstellations() {
        return Global.game.astrology.actions.allObjects.some(action => {
            return (
                // @ts-ignore // TODO: TYPES
                action.standardModifiers.some(modifier => modifier.timesBought) ||
                // @ts-ignore // TODO: TYPES
                action.uniqueModifiers.some(modifier => modifier.timesBought) ||
                // @ts-ignore // TODO: TYPES
                action.abyssalModifiers.some(modifier => modifier.timesBought)
            );
        });
    }

    private _init() {
        this._toggleButton.onclick = () => this._toggle();

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

            // @ts-ignore // TODO: TYPES
            for (const [index, modifier] of constellation.abyssalModifiers.entries()) {
                container.appendChild(this._createModifier(constellation, modifier, index, ModifierType.Abyssal));
            }

            content.appendChild(container);

            // @ts-ignore // TODO: TYPES
            const tab = this._getContainer(constellation.realm);

            tab.appendChild(header);
            tab.appendChild(content);
        }

        for (const tab of this._tabs.values()) {
            this.appendChild(tab);
            tab._init();
        }
    }

    // @ts-ignore // TODO: TYPES
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

                // @ts-ignore // TODO: TYPES
                if (constellation[`${type}Modifiers`][index].timesBought !== i + 1) {
                    for (const [index, modifierElement] of modifierElements.entries()) {
                        if (index <= i) {
                            modifierElement._toggle(true);
                        }
                    }
                }

                // @ts-ignore // TODO: TYPES
                constellation[`${type}Modifiers`][index].timesBought =
                    // @ts-ignore // TODO: TYPES
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
            // @ts-ignore // TODO: TYPES
            Global.game.astrology.hasMasterRelic(Global.game.defaultRealm) &&
            Global.game.astrology.isConstellationComplete(constellation)
                ? 2
                : 1;

        const modValue = buyCount * modifier.incrementValue * multi;

        // @ts-ignore // TODO: TYPES
        const mods = StatObject.formatDescriptions(
            // @ts-ignore // TODO: TYPES
            modifier.stats,
            // @ts-ignore // TODO: TYPES
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

import './ancient-relics.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { AgilityPage } from 'src/app/user-interface/pages/configuration/agility/agility';
import { AstrologyPage } from 'src/app/user-interface/pages/configuration/astrology/astrology';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-ancient-relics': AncientRelicsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/ancient-relics/ancient-relics.html')
export class AncientRelicsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toggleButton: HTMLButtonElement;
    private readonly _tabs: Tabs;

    private _agility: AgilityPage;
    private _astrology: AstrologyPage;

    private _ancientRelics: { [index: string]: Map<string, ButtonImage> } = {};

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-ancient-relics-template'));

        this._toggleButton = getElementFromFragment(this._content, 'mcs-ancient-relics-toggle', 'button');
        this._tabs = getElementFromFragment(this._content, 'mcs-ancient-relics-tabs', 'mcs-tabs');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._agility = Global.userInterface.main.querySelector('mcs-agility');
        this._astrology = Global.userInterface.main.querySelector('mcs-astrology');

        this._init();
    }

    public disconnectedCallback() {
        this._tabs.innerHTML = '';
        this._ancientRelics = {};
    }

    public _import(settings: [string, string[]][]) {
        for (const skill of Global.game.skills.allObjects) {
            for (const [realm, set] of Array.from(skill.ancientRelicSets.entries())) {
                set.foundRelics.clear();
                set.foundCount = 0;

                const skillAncientRelics = settings.find(data => data[0] === `${realm.id}-${skill.id}`);
                const ancientRelics = this._ancientRelics[`${realm.id}${skill.localID}`];

                if (ancientRelics) {
                    for (const [_, element] of ancientRelics) {
                        element._toggle(false);
                    }
                }

                // if gamemode doesn't allow, bail after clearing
                if (!Global.game.currentGamemode.allowAncientRelicDrops) {
                    continue;
                }

                if (skillAncientRelics && ancientRelics) {
                    for (const [relicId, element] of ancientRelics) {
                        const relicDrop = set.relicDrops.find(drop => drop.relic.id === relicId);

                        if (relicDrop && skillAncientRelics[1].includes(relicDrop.relic.id)) {
                            set.foundRelics.set(relicDrop.relic, 1);
                            element._toggle(true);
                        } else {
                            element._toggle(false);
                        }
                    }

                    set.foundCount = set.foundRelics.size;

                    if (set.completedRelic) {
                        const masterRelic = ancientRelics.get(set.completedRelic.id);

                        if (masterRelic) {
                            masterRelic._toggle(set.foundRelics.size === set.relicDrops.length);
                        }
                    }
                }
            }
        }
    }

    public _toggle() {
        if (this._hasAnyAncientRelics()) {
            this._import([]);
        } else {
            const ancientRelicsSelected: [string, string[]][] = [];

            for (const skill of Global.game.skills.allObjects) {
                if (!skill.hasAncientRelics) {
                    continue;
                }

                for (const [realm, set] of Array.from(skill.ancientRelicSets.entries())) {
                    if (realm.id === Lookup.melvor.id && !Global.ancientRelicMelvorSkillKeys.includes(skill.localID)) {
                        continue;
                    }

                    if (
                        cloudManager.hasItAEntitlementAndIsEnabled &&
                        realm.id === Lookup.abyssal.id &&
                        !Global.ancientRelicAbyssalSkillKeys.includes(skill.localID)
                    ) {
                        continue;
                    }

                    ancientRelicsSelected.push([`${realm.id}-${skill.id}`, set.relicDrops.map(drop => drop.relic.id)]);
                }
            }

            this._import(ancientRelicsSelected);
        }

        StatsController.update();
    }

    private _hasAnyAncientRelics() {
        return Global.game.skills.some(skill =>
            Array.from(skill.ancientRelicSets.values()).some(set => set.isComplete)
        );
    }

    private _init() {
        this._toggleButton.onclick = () => this._toggle();

        for (const [realmId, skillSets] of this._getAncientRelics()) {
            const realm = Global.game.realms.getObjectByID(realmId);

            const header = createElement('div', {
                attributes: [
                    ['slot', 'tab-header'],
                    ['data-mcsTooltip', '']
                ]
            });

            header.appendChild(createElement('img', { attributes: [['src', realm.media]] }));
            header.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: realm.name })
            );

            const content = createElement('div', { attributes: [['slot', 'tab-content']] });
            const contentContainer = createElement('div', { classList: ['mcs-ancient-relics-container'] });

            for (const { skill, set } of skillSets) {
                const container = createElement('div', { classList: ['mcs-ancient-relic-skill-container'] });

                for (const ancientRelic of set.relicDrops) {
                    container.appendChild(this._createRelic(set, ancientRelic.relic, skill.media));
                }

                if (set.completedRelic) {
                    container.appendChild(
                        this._createRelic(set, set.completedRelic, 'assets/media/main/gamemode_ancient_relic.png')
                    );
                }

                contentContainer.appendChild(container);
            }

            content.append(contentContainer);
            this._tabs.append(header, content);
        }

        this._tabs._init();
    }

    private _updateAncientRelic(set: AncientRelicSet, relic: AncientRelic, isSelected: boolean) {
        const isMaster = set.completedRelic.id === relic.id;

        if (isMaster) {
            const relicElements = Array.from(this._ancientRelics[`${set.realm.id}${relic.skill.localID}`].values());

            for (const element of relicElements) {
                element._toggle(isSelected);
            }

            const relics = Array.from(set.relicDrops.values());

            for (const relicDrop of relics) {
                if (isSelected) {
                    set.foundRelics.set(relicDrop.relic, 1);
                } else {
                    set.foundRelics.delete(relicDrop.relic);
                }
            }
        } else {
            if (isSelected) {
                set.foundRelics.set(relic, 1);
            } else {
                set.foundRelics.delete(relic);
            }

            const masterRelic = this._ancientRelics[`${set.realm.id}${relic.skill.localID}`].get(set.completedRelic.id);

            masterRelic._toggle(set.relicDrops.length === set.foundRelics.size);
        }

        set.foundCount = set.foundRelics.size;

        if (relic.skill.id === 'melvorD:Agility') {
            this._agility._updateTooltips();
        }

        if (relic.skill.id === 'melvorD:Astrology') {
            this._astrology._updateTooltips();
        }
    }

    private _createRelic(set: AncientRelicSet, relic: AncientRelic, media: string) {
        const element = createElement('mcs-button-image', {
            attributes: [['data-mcsSrc', media]]
        });

        const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });

        let tooltip = `<div class="text-warning mb-1">${relic.name}</div>`;
        tooltip += '<div class="font-size-xs">';
        tooltip += relic.stats.describeAsSpanHTML();
        tooltip += '</div>';

        tooltipContent.innerHTML = tooltip;

        element.appendChild(tooltipContent);

        element._on(isSelected => {
            this._updateAncientRelic(set, relic, isSelected);
            StatsController.update();
        });

        if (!this._ancientRelics[`${set.realm.id}${relic.skill.localID}`]) {
            this._ancientRelics[`${set.realm.id}${relic.skill.localID}`] = new Map<string, ButtonImage>();
        }

        this._ancientRelics[`${set.realm.id}${relic.skill.localID}`].set(relic.id, element);

        return element;
    }

    private _getAncientRelics() {
        const relics = Global.game.skills.allObjects
            .filter(skill => skill.hasAncientRelics)
            .map(skill => ({
                skill,
                sets: Array.from<any>(skill.ancientRelicSets.entries())
            }));

        const realmGroups = relics.reduce((acc, current) => {
            for (const [realm, set] of current.sets) {
                if (realm === Lookup.melvor && !Global.ancientRelicMelvorSkillKeys.includes(current.skill.localID)) {
                    continue;
                }

                if (
                    cloudManager.hasItAEntitlementAndIsEnabled &&
                    realm === Lookup.abyssal &&
                    !Global.ancientRelicAbyssalSkillKeys.includes(current.skill.localID)
                ) {
                    continue;
                }

                acc[realm.id] ??= [];
                acc[realm.id].push({ skill: current.skill, set });
            }

            return acc;
        }, {} as any);

        return Object.entries(realmGroups).sort((a, b) => a[0].localeCompare(b[0])) as any;
    }
}

customElements.define('mcs-ancient-relics', AncientRelicsPage);

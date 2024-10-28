import './summary.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { Equipment } from 'src/app/user-interface/pages/_parts/equipment/equipment';
import { Global } from 'src/app/global';
import { OutOfCombatStats } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/out-of-combat-stats';
import { Information } from 'src/app/user-interface/information/information';
import { FoodSlot } from 'src/app/user-interface/pages/_parts/equipment/food-slot/food-slot';
import { Dropdown } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-summary': SummaryPage;
    }
}

@LoadTemplate('app/user-interface/summary/summary.html')
export class SummaryPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _gamemode: HTMLDivElement;
    private readonly _equipment: Equipment;
    private readonly _player: HTMLDivElement;
    private readonly _food: FoodSlot;
    private readonly _skill: HTMLDivElement;
    private readonly _outOfCombatStats: OutOfCombatStats;
    private readonly _information: Information;
    private readonly _anchor: HTMLDivElement;

    private readonly enabled: string;
    private readonly disabled: string;

    private readonly onLoad = this._onLoad.bind(this);

    constructor() {
        super();

        this.enabled = Global.context.getResourceUrl('assets/check.svg');
        this.disabled = Global.context.getResourceUrl('assets/cancel.svg');

        this._content.append(getTemplateNode('mcs-summary-template'));

        this._gamemode = getElementFromFragment(this._content, 'mcs-summary-gamemode', 'div');
        this._equipment = getElementFromFragment(this._content, 'mcs-summary-equipment', 'mcs-equipment');
        this._player = getElementFromFragment(this._content, 'mcs-summary-player-information', 'div');
        this._food = getElementFromFragment(this._content, 'mcs-summary-food', 'mcs-food-slot');
        this._skill = getElementFromFragment(this._content, 'mcs-summary-skill-container', 'div');
        this._outOfCombatStats = getElementFromFragment(
            this._content,
            'mcs-summary-out-of-combat-stats',
            'mcs-out-of-combat-stats'
        );
        this._information = getElementFromFragment(this._content, 'mcs-summary-information', 'mcs-information');
        this._anchor = getElementFromFragment(this._content, 'mcs-summary-anchor', 'div');
    }

    public connectedCallback() {
        this._init();

        this.appendChild(this._content);

        PageController.on(this.onLoad);
    }

    public disconnectedCallback() {
        PageController.off(this.onLoad);
    }

    private _init() {
        for (const realm of Global.game.agility.getRealmOptions().reverse()) {
            const container = createElement('div', {
                classList: ['mcs-summary-agility-container', `mcs-summary-agility-${realm._localID.toLowerCase()}`]
            });

            container.append(
                createElement('div', { classList: ['mcs-summary-agility-course-name'], text: `${realm.name} Course` })
            );

            const agilityCourse = createElement('mcs-agility-course', {
                attributes: [
                    ['data-mcsRealmId', realm.id],
                    ['readonly', '']
                ]
            });

            container.append(agilityCourse);
            this._anchor.insertAdjacentElement('afterend', container);
        }
    }

    private _onLoad(pageId: PageId) {
        const main = document.getElementById('mcs-combat-simulator');

        if (pageId !== PageId.Summary) {
            main.classList.remove('summary-open');
            return;
        }

        main.classList.add('summary-open');

        this._gamemode.innerHTML = Global.game.currentGamemode.name;
        this._equipment._update();
        this._food._update();
        this._outOfCombatStats._update();
        this._information._update();

        this._loadPlayerInformation();
        this._loadSkills();

        this.querySelectorAll('mcs-agility-course').forEach(course => {
            course._update();
        });
    }

    private _loadPlayerInformation() {
        this._player.innerHTML = '';

        const container = createElement('div', { classList: ['mcs-summary-player-column'] });

        if (Global.game.combat.player.attackStyle) {
            container.append(
                this._lineItem(Global.game.combat.player.attackStyle.name, [
                    Global.game.combat.player.attackStyle.experienceGain[0]?.skill?.media
                ])
            );
        }

        if (Global.game.combat.player.activePrayers?.size) {
            for (const prayer of Global.game.combat.player.activePrayers.values()) {
                container.append(this._lineItem(prayer.name, [prayer.media]));
            }
        } else {
            container.append(this._lineItem('No Prayers', [Global.game.prayer.media]));
        }

        if (Global.game.combat.player.potion) {
            container.append(
                this._lineItem(Global.game.combat.player.potion.name, [Global.game.combat.player.potion.media])
            );
        } else {
            container.append(this._lineItem('No Potion', [Global.game.herblore.media]));
        }

        if (Global.game.combat.player.attackType === 'magic') {
            container.append(
                this._lineItem(Global.game.combat.player.spellSelection.attack.name, [
                    Global.game.combat.player.spellSelection.attack.media
                ])
            );

            container.append(
                this._lineItem(Global.game.combat.player.spellSelection.curse?.name ?? 'No Curse', [
                    Global.game.combat.player.spellSelection.curse?.media ?? 'assets/media/skills/combat/curses.svg'
                ])
            );

            container.append(
                this._lineItem(Global.game.combat.player.spellSelection.aurora?.name ?? 'No Aurora', [
                    Global.game.combat.player.spellSelection.aurora?.media ?? 'assets/media/skills/combat/auroras.svg'
                ])
            );
        } else if (Global.game.combat.player.modifiers.allowNonMagicCurses > 0) {
            container.append(
                this._lineItem(Global.game.combat.player.spellSelection.curse?.name ?? 'No Curse', [
                    Global.game.combat.player.spellSelection.curse?.media ?? 'assets/media/skills/combat/curses.svg'
                ])
            );
        }

        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
            for (const map of Global.game.cartography.worldMaps.allObjects) {
                if (!map.pointsOfInterest.allObjects.some(poi => poi.activeStats?.hasStats)) {
                    continue;
                }

                container.append(
                    this._lineItem(`${map.name} - ${map.masteredHexes} Hexes`, [Global.game.cartography.media])
                );

                if (map.playerPosition?.pointOfInterest?.activeStats?.hasStats) {
                    container.append(
                        this._lineItem(map.playerPosition.pointOfInterest.name, [
                            map.playerPosition.pointOfInterest.media
                        ])
                    );
                } else {
                    container.append(this._lineItem('No Point of Interest', [Global.game.cartography.media]));
                }
            }
        }

        this._player.append(container);
    }

    private _loadSkills() {
        this._skill.innerHTML = '';

        const container = createElement('div', { classList: ['mcs-summary-skill-column'] });

        const levels = createElement('div', { classList: ['mcs-summary-skill-levels'] });

        const melvor = createElement('div', { classList: ['mcs-summary-melvor-skill-levels'] });
        const abyssal = createElement('div', {
            classList: ['mcs-summary-abyssal-skill-levels'],
            attributes: [['style', `color: var(--mcs-summary-abyssal-level-color)`]]
        });

        for (const skillId of Global.combatSkillLocalIds) {
            const skill = Global.game.skills.find(skill => skill.localID === skillId);
            const level = Global.game.combat.player.skillLevel.get(Global.skillIds[skillId]);

            if (level === undefined || skill === undefined) {
                continue;
            }

            melvor.append(this._lineItem(level.toString(), [skill.media]));
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            for (const skillId of Global.combatAbyssalSkillLocalIds) {
                const skill = Global.game.skills.find(skill => skill.localID === skillId);
                const level = Global.game.combat.player.skillAbyssalLevel.get(Global.skillIds[skillId]);

                if (level === undefined || skill === undefined) {
                    continue;
                }

                abyssal.append(this._lineItem(level.toString(), [skill.media]));
            }
        }

        levels.append(melvor, abyssal);

        container.append(levels);

        const autoEat = Global.userInterface.main.querySelector<Dropdown>('.mcs-equipment-auto-eat');

        container.append(this._lineItem(autoEat?._selected?.text, ['assets/media/shop/autoeat.svg']));

        container.append(
            this._lineItem('Manually Eating', [
                Global.game.combat.player.isManualEating ? this.enabled : this.disabled,
                Global.game.cooking.media
            ])
        );

        container.append(
            this._lineItem('Slayer Task', [
                Global.game.combat.player.isSlayerTask ? this.enabled : this.disabled,
                Global.game.slayer.media
            ])
        );

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            container.append(
                this._lineItem('Corrupted', [
                    Global.game.combat.player.isAutoCorrupt ? this.enabled : this.disabled,
                    Global.game.corruption.media
                ])
            );
        }

        const solarEclipse = Lookup.getSolarEclipse(Global.game.township);

        if (solarEclipse) {
            container.append(
                this._lineItem('Solar Eclipse', [
                    Global.game.township?.townData?.season?.id === solarEclipse.id ? this.enabled : this.disabled,
                    solarEclipse?.media
                ])
            );
        }

        const eternalDarkness = Lookup.getEternalDarkness(Global.game.township);

        if (eternalDarkness) {
            container.append(
                this._lineItem('Eternal Darkness', [
                    Global.game.township?.townData?.season?.id === eternalDarkness.id ? this.enabled : this.disabled,
                    eternalDarkness?.media
                ])
            );
        }

        const information = this._information._getData();

        if (information?.data?.simSuccess && Object.keys(information.data.usedRunesBreakdown).length) {
            let dataMultiplier = Global.stores.plotter.timeMultiplier;

            if (dataMultiplier === -1) {
                dataMultiplier = information.data.killTimeS;
            }

            const runeContainer = createElement('div', { classList: ['mcs-summary-runes-container'] });

            runeContainer.append(
                createElement('div', {
                    classList: ['mcs-summary-rune-title'],
                    text: `Runes / ${Global.stores.plotter.timeOption}`
                })
            );

            for (const id in information.data.usedRunesBreakdown) {
                const rune = Global.game.items.getObjectByID(id);

                if (!rune) {
                    continue;
                }

                runeContainer.append(
                    this._lineItem(
                        numberWithCommas((information.data.usedRunesBreakdown[id] * dataMultiplier).toFixed(2)),
                        [rune.media]
                    )
                );
            }

            container.append(runeContainer);
        }

        this._skill.append(container);
    }

    private _lineItem(text: string, media: string[]) {
        const images = media.map(image =>
            createElement('img', {
                attributes: [['src', image]],
                classList: ['mcs-summary-line-item-image']
            })
        );

        const name = createElement('span', { classList: ['mcs-summary-line-item-name'], text });
        const container = createElement('div', { classList: ['mcs-summary-line-item-container'] });

        container.append(...images, name);

        return container;
    }
}

customElements.define('mcs-summary', SummaryPage);

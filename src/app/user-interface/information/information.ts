import './information.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Format } from 'src/app/utils/format';
import { SimulationData } from 'src/app/simulation';
import { PlotKey } from 'src/app/stores/plotter.store';
import { Util } from 'src/shared/util';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { Lookup } from 'src/shared/utils/lookup';
import { Drops } from 'src/app/drops';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-information': Information;
    }
}

interface InformationData {
    title: string;
    media: string;
    data: SimulationData;
    monsters?: Monster[];
    combatStyle?: AttackType | 'random';
}

@LoadTemplate('app/user-interface/information/information.html')
export class Information extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _title: HTMLDivElement;
    private readonly _monsterInformation: HTMLDivElement;
    private readonly _monsterAttackStyle: HTMLImageElement;
    private readonly _monsterImage: HTMLImageElement;
    private readonly _monsterNote: HTMLDivElement;

    private readonly _stats: {
        key: PlotKey;
        element: HTMLSpanElement;
        label?: HTMLSpanElement;
        tooltip?: HTMLDivElement;
        realmLabel?: (realmId: string) => string;
    }[];

    private readonly _units: HTMLSpanElement[];

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-information-template'));

        this._title = getElementFromFragment(this._content, `mcs-information-title`, 'div');
        this._monsterInformation = getElementFromFragment(this._content, `mcs-monster-information`, 'div');
        this._monsterAttackStyle = getElementFromFragment(this._content, `mcs-monster-attack-style`, 'img');
        this._monsterImage = getElementFromFragment(this._content, `mcs-monster-image`, 'img');
        this._monsterNote = getElementFromFragment(this._content, `mcs-monster-note`, 'div');

        this._stats = [
            {
                key: PlotKey.XP,
                element: getElementFromFragment(this._content, `mcs-information-xp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-xp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-xp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. XP' : 'XP')
            },
            {
                key: PlotKey.HpXP,
                element: getElementFromFragment(this._content, `mcs-information-hp-xp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-hp-xp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-hp-xp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. HP XP' : 'HP XP')
            },
            {
                key: PlotKey.PrayerXP,
                element: getElementFromFragment(this._content, `mcs-information-prayer-xp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-prayer-xp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-prayer-xp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. Prayer XP' : 'Prayer XP')
            },
            {
                key: PlotKey.SlayerXP,
                element: getElementFromFragment(this._content, `mcs-information-slayer-xp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-slayer-xp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-slayer-xp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. Slayer XP' : 'Slayer XP')
            },
            {
                key: PlotKey.SummoningXP,
                element: getElementFromFragment(this._content, `mcs-information-summoning-xp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-summoning-xp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-summoning-xp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. Summoning XP' : 'Summoning XP')
            },
            {
                key: PlotKey.CorruptionXP,
                element: getElementFromFragment(this._content, `mcs-information-corruption-xp`, 'span')
            },
            {
                key: PlotKey.PrayerPointsGained,
                element: getElementFromFragment(this._content, `mcs-information-prayer-point-gained`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-prayer-point-gained-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-prayer-point-gained-label`, 'span'),
                realmLabel: (realmId: string) =>
                    realmId === 'melvorItA:Abyssal' ? 'Soul P. Gained' : 'Prayer P. Gained'
            },
            {
                key: PlotKey.PrayerPointsUsed,
                element: getElementFromFragment(this._content, `mcs-information-prayer-point-used`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-prayer-point-used-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-prayer-point-used-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'Soul P. Used' : 'Prayer P. Used')
            },
            { key: PlotKey.AmmoUsed, element: getElementFromFragment(this._content, `mcs-information-ammo`, 'span') },
            {
                key: PlotKey.RunesUsed,
                element: getElementFromFragment(this._content, `mcs-information-runes`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-runes-tooltip', 'div')
            },
            {
                key: PlotKey.CombinationRunesUsed,
                element: getElementFromFragment(this._content, `mcs-information-combination-runes`, 'span')
            },
            {
                key: PlotKey.PotionsUsed,
                element: getElementFromFragment(this._content, `mcs-information-potions`, 'span')
            },
            {
                key: PlotKey.ConsumablesUsed,
                element: getElementFromFragment(this._content, `mcs-information-consumables`, 'span')
            },
            {
                key: PlotKey.TabletsUsed,
                element: getElementFromFragment(this._content, `mcs-information-tablets`, 'span')
            },
            { key: PlotKey.FoodUsed, element: getElementFromFragment(this._content, `mcs-information-food`, 'span') },
            {
                key: PlotKey.DeathRate,
                element: getElementFromFragment(this._content, `mcs-information-estimated-death-rate`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-death-rate-tooltip', 'div')
            },
            {
                key: PlotKey.HighestHitTaken,
                element: getElementFromFragment(this._content, `mcs-information-highest-hit-taken`, 'span'),
                tooltip: getElementFromFragment(this._content, `mcs-information-highest-hit-tooltip`, 'div')
            },
            {
                key: PlotKey.HighestReflectTaken,
                element: getElementFromFragment(this._content, `mcs-information-highest-reflect-taken`, 'span'),
                tooltip: getElementFromFragment(this._content, `mcs-information-highest-reflect-tooltip`, 'div')
            },
            {
                key: PlotKey.LowestHitpoints,
                element: getElementFromFragment(this._content, `mcs-information-lowest-hitpoints`, 'span'),
                tooltip: getElementFromFragment(this._content, `mcs-information-lowest-hitpoints-tooltip`, 'div')
            },
            {
                key: PlotKey.KillTime,
                element: getElementFromFragment(this._content, `mcs-information-kill-time`, 'span')
            },
            { key: PlotKey.Kills, element: getElementFromFragment(this._content, `mcs-information-kills`, 'span') },
            {
                key: PlotKey.GP,
                element: getElementFromFragment(this._content, `mcs-information-gp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-gp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-gp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'AP' : 'GP')
            },
            {
                key: PlotKey.RawGP,
                element: getElementFromFragment(this._content, `mcs-information-raw-gp`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-raw-gp-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-raw-gp-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'Raw AP' : 'Raw GP')
            },
            {
                key: PlotKey.Drops,
                element: getElementFromFragment(this._content, `mcs-information-drops`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-drops-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-drops-label`, 'span')
            },
            { key: PlotKey.Signet, element: getElementFromFragment(this._content, `mcs-information-signet`, 'span') },
            {
                key: PlotKey.Pet,
                element: getElementFromFragment(this._content, `mcs-information-pet`, 'span'),
                label: getElementFromFragment(this._content, `mcs-information-pet-label`, 'span')
            },
            {
                key: PlotKey.Mark,
                element: getElementFromFragment(this._content, `mcs-information-mark`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-mark-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-mark-label`, 'span')
            },
            {
                key: PlotKey.SlayerCoins,
                element: getElementFromFragment(this._content, `mcs-information-slayer-coins`, 'span'),
                tooltip: getElementFromFragment(this._content, 'mcs-information-slayer-coins-tooltip', 'div'),
                label: getElementFromFragment(this._content, `mcs-information-slayer-coins-label`, 'span'),
                realmLabel: (realmId: string) => (realmId === 'melvorItA:Abyssal' ? 'A. Slayer Coins' : 'Slayer Coins')
            }
        ];

        this._units = Array.from(this._content.querySelectorAll<HTMLSpanElement>('.mcs-information-unit'));

        this._setPetType(Global.stores.plotter.state.selectedSkill);
        this._setMarkType(Global.stores.plotter.state.selectedSkill);

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            const corruption = this._stats.find(stat => stat.key === PlotKey.CorruptionXP);

            if (corruption) {
                corruption.element.parentElement.style.display = 'none';
            }
        }
    }

    public connectedCallback() {
        this.appendChild(this._content);

        TooltipController.init(this._monsterNote);
    }

    public _setUnits(text: string) {
        for (const unit of this._units) {
            unit.textContent = `/${text}`;
        }
    }

    public _setPetType(name: string | undefined) {
        const pet = this._stats.find(stat => stat.key === PlotKey.Pet);

        pet.label.textContent = `${name ? name + ' ' : ''}Pet (%)`;
    }

    public _setMarkType(name: string | undefined) {
        const mark = this._stats.find(stat => stat.key === PlotKey.Mark);

        mark.label.textContent = `${name ? name + ' ' : ''}Mark (%)`;
    }

    public _update() {
        const information = this._getData();

        if (information) {
            this._title.textContent = information.title;
            this._monsterInformation.classList.add('is-open');

            if (information.combatStyle) {
                this._monsterAttackStyle.src = MonsterSelectTableElement.attackTypeMedia[information.combatStyle];
                this._monsterAttackStyle.style.display = 'block';
            } else {
                this._monsterAttackStyle.style.display = 'none';
            }

            this._monsterImage.src = information.media;

            const failureText = Global.simulation.getSimFailureText(information.data, true);
            this._monsterNote.innerHTML = failureText;

            if (failureText.includes('mcsTooltipContent')) {
                delete this._monsterNote.dataset.mcstooltipdisabled;
            } else {
                this._monsterNote.dataset.mcstooltipdisabled = '';
            }

            for (const stat of this._stats) {
                const plotType = Global.stores.plotter.state.plotTypes.find(plotType => plotType.key === stat.key);

                let key: PlotKey = stat.key;
                let hasMultipleRealms = false;

                if (plotType.isRealmed) {
                    const realms: { key: PlotKey; realm: Realm }[] = Global.game.realms.allObjects.map(realm => ({
                        key: `${key}${realm.localID}` as PlotKey,
                        realm
                    }));

                    const realmData: { value: number; realm: Realm }[] = [];

                    for (const { key, realm } of realms) {
                        const value = Global.simulation.getValue(true, information.data, key, plotType.scale);

                        if (
                            realm.id !== information.data.realmId &&
                            (value === 0 || isNaN(value) || value === undefined)
                        ) {
                            continue;
                        }

                        realmData.push({ value, realm });
                    }

                    hasMultipleRealms = realmData.length > 1;

                    if (hasMultipleRealms) {
                        stat.element.style.color = '#6cceff';
                        stat.element.parentElement.toggleAttribute('data-mcsTooltipDisabled', false);

                        stat.tooltip.innerHTML =
                            '<div class="mcs-realmed-text">This entry has data for other realms.</div>';

                        for (const { value, realm } of realmData) {
                            stat.tooltip.innerHTML += `<div class="mcs-realmed-entry">
                                <img class="mcs-realmed-image" src="${realm.media}" />
                                <div class="mcs-realmed-line-item">
                                    <span>${realm.name}</span>
                                    <span>${this._outputValue(information.data, value)}</span>
                                </div>
                            </div>`;
                        }
                    }

                    const currentRealm = Global.game.realms.getObjectByID(information.data.realmId);

                    key = `${key}${currentRealm?.localID}` as PlotKey;

                    if (stat.label && currentRealm && stat.realmLabel) {
                        stat.label.textContent = stat.realmLabel(currentRealm.id);
                    }
                }

                stat.element.textContent = this._outputValue(
                    information.data,
                    Global.simulation.getValue(true, information.data, key, plotType.scale)
                );

                if (!hasMultipleRealms && plotType.isRealmed) {
                    stat.element.style.color = '';
                    stat.tooltip.innerHTML = '';

                    if (stat.key !== PlotKey.PrayerXP) {
                        stat.element.parentElement.toggleAttribute('data-mcsTooltipDisabled', true);
                    }
                }
            }

            const highestDamageTaken = this._stats.find(stat => stat.key === PlotKey.HighestHitTaken);
            const highestReflect = this._stats.find(stat => stat.key === PlotKey.HighestReflectTaken);
            const lowestHitpoints = this._stats.find(stat => stat.key === PlotKey.LowestHitpoints);
            const deathRate = this._stats.find(stat => stat.key === PlotKey.DeathRate);
            const prayer = this._stats.find(stat => stat.key === PlotKey.PrayerXP);
            const runes = this._stats.find(stat => stat.key === PlotKey.RunesUsed);
            const mark = this._stats.find(stat => stat.key === PlotKey.Mark);
            const drops = this._stats.find(stat => stat.key === PlotKey.Drops);

            highestDamageTaken.tooltip.textContent = `Highest Hit Taken: ${numberWithCommas(
                this._outputValue(information.data, information.data.highestDamageTaken)
            )}`;

            highestReflect.tooltip.textContent = `Highest Reflect Taken: ${numberWithCommas(
                this._outputValue(information.data, information.data.highestReflectDamageTaken)
            )}`;

            lowestHitpoints.tooltip.textContent = `Lowest Hitpoints: ${numberWithCommas(
                this._outputValue(information.data, information.data.lowestHitpoints)
            )}`;

            highestReflect.element.style.color =
                information.data.highestReflectDamageTaken >= Global.game.combat.player.stats.maxHitpoints
                    ? 'orange'
                    : '';

            if (this._isNearDeath(information.data, information.monsters)) {
                highestDamageTaken.element.style.color = 'orange';
                lowestHitpoints.element.style.color = 'orange';
                highestDamageTaken.tooltip.style.color = 'orange';
                lowestHitpoints.tooltip.style.color = 'orange';
            } else {
                highestDamageTaken.element.style.color = '';
                lowestHitpoints.element.style.color = '';
                highestDamageTaken.tooltip.style.color = '';
                lowestHitpoints.tooltip.style.color = '';
            }

            deathRate.element.style.color = information.data.deathRate > 0 ? 'red' : '';

            const currentRealm = Global.game.realms.getObjectByID(information.data.realmId);

            prayer.tooltip.innerHTML += this._getPrayerTooltip(
                information.data[`prayerXpPerSecond${currentRealm?.localID}`],
                information.data.ppConsumedPerSecond
            );

            deathRate.tooltip.innerHTML = this._getDeathRateTooltip(
                information.data.deathRate,
                information.data.killTimeS
            );

            runes.tooltip.innerHTML = this._getRuneTooltip(
                information.data.usedRunesBreakdown,
                information.data.killTimeS
            );

            mark.tooltip.innerHTML = this._getMarkTooltip(information.data);

            drops.tooltip.innerHTML =
                Global.stores.plotter.state.selectedDrop === 'mcs:none'
                    ? 'Kills multiplied by doubling chance. (includes chance to receive no drops)'
                    : 'Drop chance for selected item.';

            drops.label.textContent =
                Global.stores.plotter.state.selectedDrop === Drops.noneItem
                    ? 'Drops'
                    : Global.game.items.getObjectByID(Global.stores.plotter.state.selectedDrop).name;
        } else {
            this._title.textContent = 'Information';
            this._monsterInformation.classList.remove('is-open');
        }
    }

    public _getData(): InformationData {
        if (!Global.stores.plotter.state.isInspecting && !Global.stores.plotter.state.isBarSelected) {
            return;
        }

        const isEntity =
            Global.stores.plotter.barIsDungeon(Global.stores.plotter.state.selectedBar) ||
            Global.stores.plotter.barIsTask(Global.stores.plotter.state.selectedBar) ||
            Global.stores.plotter.barIsStronghold(Global.stores.plotter.state.selectedBar) ||
            Global.stores.plotter.barIsDepth(Global.stores.plotter.state.selectedBar);

        const isEntitySelected =
            (!Global.stores.plotter.state.isBarSelected && Global.stores.plotter.state.isInspecting) ||
            (!Global.stores.plotter.state.isInspecting && isEntity);

        if (!isEntitySelected) {
            const monster = Lookup.monsters.getObjectByID(Global.stores.plotter.selectedMonsterId);

            let entityId = undefined;

            if (
                Global.stores.plotter.state.isInspecting &&
                (Lookup.isDungeon(Global.stores.plotter.state.inspectedId) ||
                    Lookup.isStronghold(Global.stores.plotter.state.inspectedId) ||
                    Lookup.isDepth(Global.stores.plotter.state.inspectedId))
            ) {
                entityId = Lookup.getEntity(Global.stores.plotter.state.inspectedId)?.id;
            }

            return {
                title: Format.replaceApostrophe(monster.name),
                media: monster.media,
                combatStyle: monster.attackType,
                data: Global.simulation.monsterSimData[Global.simulation.simId(monster.id, entityId)]
            };
        }

        const entity = Lookup.getEntity(
            Global.stores.plotter.state.inspectedId ?? Global.stores.plotter.selectedMonsterId
        );

        if (Lookup.isDungeon(entity.id)) {
            return {
                title: Format.replaceApostrophe(entity.name),
                media: (<Dungeon>entity).media,
                data: Global.simulation.dungeonSimData[entity.id]
            };
        }

        if (Lookup.isStronghold(entity.id)) {
            return {
                title: Format.replaceApostrophe(entity.name),
                media: (<Stronghold>entity).media,
                data: Global.simulation.strongholdSimData[entity.id]
            };
        }

        if (Lookup.isDepth(entity.id)) {
            return {
                title: Format.replaceApostrophe(entity.name),
                media: (<AbyssDepth>entity).media,
                data: Global.simulation.depthSimData[entity.id]
            };
        }

        if (Lookup.isSlayerTask(entity.id)) {
            return {
                title: Format.replaceApostrophe(entity.name),
                media: Global.game.slayer.media,
                data: Global.simulation.slayerSimData[entity.id],
                monsters: Global.simulation.slayerTaskMonsters[entity.id]
            };
        }
    }

    private _outputValue(data: SimulationData, value: number) {
        return data.simSuccess && !isNaN(value) && value !== Number.MAX_SAFE_INTEGER
            ? Util.mcsFormatNum(value, 4)
            : 'N/A';
    }

    private _isNearDeath(data: SimulationData, monsters?: Monster[]) {
        let isNearDeath = data.highestDamageTaken >= data.lowestHitpoints;

        if (monsters) {
            const monsterData = monsters.map((monster: Monster) => {
                const id = Global.simulation.simId(monster.id);

                return Global.simulation.monsterSimData[id];
            });

            isNearDeath = monsterData.some(data => data.highestDamageTaken >= data.lowestHitpoints);
        }

        return isNearDeath;
    }

    private _getDeathRateTooltip(deathRate: number, killTimeS: number) {
        let dataMultiplier = Global.stores.plotter.timeMultiplier;

        if (dataMultiplier === -1) {
            dataMultiplier = killTimeS;
        }

        const estDeathRate = Math.floor((deathRate / killTimeS) * dataMultiplier * 10000) / 10000;

        if (Number.isNaN(estDeathRate)) {
            return 'N/A';
        }

        return `<span>${estDeathRate} Est. Deaths/${Global.stores.plotter.timeShorthand}</span><br/>`;
    }

    private _getRuneTooltip(runesUsed: { [index: string]: number }, killTimeS: number) {
        let dataMultiplier = Global.stores.plotter.timeMultiplier;

        if (dataMultiplier === -1) {
            dataMultiplier = killTimeS;
        }

        let tooltip = '';

        for (const id in runesUsed) {
            const rune = Global.game.items.getObjectByID(id);
            const used = (runesUsed[id] * dataMultiplier).toFixed(2);

            tooltip += `<div class="mcs-rune-line-item"><img class="mcs-rune-image" src="${
                rune.media
            }"><span>${numberWithCommas(used)}</span></div>`;
        }

        if (tooltip.length > 0) {
            tooltip = `<div>Runes / ${Global.stores.plotter.timeOption}<br/>${tooltip}</div>`;

            return tooltip;
        } else {
            return 'No runes used.';
        }
    }

    private _getPrayerTooltip(prayerXpPerSecond: number, ppConsumedPerSecond: number) {
        let xpPerPP = prayerXpPerSecond / ppConsumedPerSecond;

        if (prayerXpPerSecond === 0) {
            xpPerPP = 0;
        }

        if (Number.isNaN(xpPerPP)) {
            return 'N/A';
        }

        let tooltip = `<span>${xpPerPP.toFixed(2)} Prayer XP/Point</span><br/>`;

        tooltip = `<div>${tooltip}</div>`;

        return tooltip;
    }

    private _getMarkTooltip(data: SimulationData) {
        if (!data.simSuccess) {
            return '';
        }

        let dataMultiplier = Global.stores.plotter.timeMultiplier;

        if (dataMultiplier === -1) {
            dataMultiplier = data.killTimeS;
        }

        const skill = Global.game.skills.getObjectByID(Global.skillIds[Global.stores.plotter.state.selectedSkill]);

        const monster = Lookup.monsters.getObjectByID(data.monsterId);

        const realm = monster
            ? Global.game.getMonsterArea(monster).realm
            : (<Dungeon | Stronghold | AbyssDepth>Lookup.getEntity(data.entityId)).realm;

        const breakdown = Drops.getChanceForMarkBreakdown(data, skill, realm, dataMultiplier);
        const marks = breakdown[skill.id];

        let tooltip = '';

        for (const { markId, percentage } of marks) {
            const mark = Global.game.summoning.actions.getObjectByID(markId);
            tooltip += `<div class="mcs-mark-line-item"><img class="mcs-mark-image" src="${
                mark.media
            }" /><span>${percentage.toFixed(2)}%</span></div>`;
        }

        return tooltip;
    }
}

customElements.define('mcs-information', Information);

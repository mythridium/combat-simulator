import { Global } from 'src/app/global';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { Source } from 'src/shared/stores/sync.store';
import { LineItemComponent } from 'src/app/interface/components/blocks/line-item-component';
import { State } from 'src/app/stores/simulation.store';
import { PlotType } from 'src/app/stores/interface.store';

interface Breakdown {
    total: number;
    items: { name: string; media: string; value: number }[];
}

export class InformationComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-information', title: Global.selectedBar.state.selected?.monster.name ?? 'Information' });
    }

    protected init() {
        Global.simulation.when(Source.Worker).subscribe(({ state }) => {
            if (state === State.Stopped && Global.selectedBar.state.selected) {
                this.render();
            }
        });

        Global.selectedBar.when(Source.Interface).subscribe(() => this.render());
        Global.interface.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const { selected } = Global.selectedBar.getState();

        if (selected) {
            this.append(
                document.element({
                    tag: 'img',
                    src: selected.monster.media,
                    classes: ['mcs-information-monster-image']
                })
            );

            this.append(
                document.element({
                    tag: 'div',
                    innerHTML: selected.sim?.result ?? 'Monster has not been simulated yet.',
                    classes: ['mcs-red']
                })
            );
        }

        this.append(
            new LineItemComponent({
                id: 'mcs-information-xp',
                text: this.toUnit('XP'),
                value: this.format(selected?.sim?.stats.skillXp['melvorD:Attack'])
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-hp-xp',
                text: this.toUnit('HP XP'),
                value: this.format(selected?.sim?.stats.skillXp['melvorD:Hitpoints'])
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-prayer-xp',
                text: this.toUnit('Prayer XP'),
                value: this.format(selected?.sim?.stats.skillXp['melvorD:Prayer'])
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-slayer-xp',
                text: this.toUnit('Slayer XP'),
                value: this.format(selected?.sim?.stats.skillXp['melvorD:Slayer'])
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-summoning-xp',
                text: this.toUnit('Summoning XP'),
                value: this.format(selected?.sim?.stats.skillXp['melvorD:Summoning'])
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-prayer-points-gained',
                text: this.toUnit('Prayer Points Gained'),
                value: this.format(selected?.sim?.stats.gainedPrayerPoints)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-prayer-points-used',
                text: this.toUnit('Prayer Points Used'),
                value: this.format(selected?.sim?.stats.usedPrayerPoints)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-ammo',
                text: this.toUnit('Ammo'),
                value: this.format(selected?.sim?.stats.usedAmmo)
            })
        );

        const breakdownRunes = this.toBreakdown(selected?.sim?.stats.usedRunes);

        this.append(
            new LineItemComponent({
                id: 'mcs-information-runes',
                text: this.toUnit('Runes'),
                value: this.format(breakdownRunes?.total),
                tooltip: {
                    content: breakdownRunes?.items.length
                        ? `
                <div class="mcs-rune-breakdown">
                    ${breakdownRunes.items.map(item => {
                        return `
                        <div class="mcs-rune">
                            <img class="mcs-rune-media" src="${item.media}" />
                            <span>${item.name}</span>
                            <span>${this.format(item.value)}</span>
                        </div>`;
                    })}
                </div>
                `
                        : 'No runes used'
                }
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-combination-runes',
                text: this.toUnit('Comb. Runes'),
                value: this.format(selected?.sim?.stats.usedCominationRunes)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-potions',
                text: this.toUnit('Potions'),
                value: this.format(selected?.sim?.stats.usedPotions)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-consumables',
                text: this.toUnit('Consumables'),
                value: this.format(selected?.sim?.stats.usedConsumabes)
            })
        );

        const breakdownSummon = this.toBreakdown(selected?.sim?.stats.usedCharges);

        this.append(
            new LineItemComponent({
                id: 'mcs-information-tablets',
                text: this.toUnit('Tablets per type'),
                value: this.format(breakdownSummon?.total)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-food',
                text: this.toUnit('Food'),
                value: this.format(selected?.sim?.stats.usedFood)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-death-rate',
                text: 'Est. Death Rate',
                value: this.format(selected?.sim?.stats.deaths)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-highest-hit',
                text: 'Highest Hit Taken',
                value: this.format(selected?.sim?.stats.highestDamageTaken)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-lowest-hitpoints',
                text: 'Lowest Hitpoints',
                value: this.format(selected?.sim?.stats.lowestHitpoints)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-kill-time',
                text: 'Kill Time (s)',
                value: this.format(selected?.sim?.stats.killTime)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-kills',
                text: this.toUnit('Kills'),
                value: this.format(selected?.sim?.stats.kills)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-gp',
                text: this.toUnit('GP'),
                value: this.format(selected?.sim?.loot.gp)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-raw-gp',
                text: this.toUnit('Raw GP'),
                value: this.format(selected?.sim?.stats.gp)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-slayer-coins',
                text: this.toUnit('Slayer Coins'),
                value: this.format(selected?.sim?.stats.sc)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-drops',
                text: this.toUnit('Drops'),
                value: this.format(selected?.sim?.loot.drops)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-signet',
                text: this.toUnit('Signet (%)'),
                value: this.format(selected?.sim?.loot.signet)
            })
        );

        if (Global.interface.state.plotType === PlotType.Pet) {
            const skill = game.skills.find(skill => skill.id === Global.interface.state.skillId);

            this.append(
                new LineItemComponent({
                    id: 'mcs-information-pet',
                    text: skill ? `${skill.name} ${this.toUnit('Pet (%)')}` : this.toUnit('Pet (%)'),
                    value: this.format(selected?.sim?.pet[Global.interface.state.skillId])
                })
            );
        }

        super.preRender(container);
    }

    private format(value: number) {
        if (value === undefined || value === null) {
            return 'N/A';
        }

        return formatNumber(value);
    }

    private toBreakdown(stat: { [index: string]: number }) {
        if (stat === undefined || stat === null) {
            return;
        }

        return Object.entries(stat).reduce(
            (result, [id, value]) => {
                result.total += value;

                const item = game.items.equipment.getObjectByID(id);

                if (item) {
                    result.items.push({ name: item.name, media: item.media, value });
                }

                return result;
            },
            { total: 0, items: [] } as Breakdown
        );
    }

    private toUnit(text: string) {
        return `${text}/${Global.interface.state.unit}`;
    }
}

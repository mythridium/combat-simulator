import { Global } from 'src/app/global';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { Source } from 'src/shared/stores/sync.store';
import { LineItemComponent } from 'src/app/interface/components/blocks/line-item-component';

interface Breakdown {
    total: number;
    items: { name: string; media: string; value: number }[];
}

export class InformationComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-information', title: Global.information.state.selected?.monster.name ?? 'Information' });
    }

    protected init() {
        Global.information.when(Source.Interface).subscribe(() => this.render());
        Global.interface.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const { selected } = Global.information.getState();

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
                    innerHTML: selected.result ?? 'Monster has not been simulated yet.',
                    classes: ['mcs-red']
                })
            );
        }

        this.append(
            new LineItemComponent({
                id: 'mcs-information-xp',
                text: this.toUnit('XP'),
                value: selected?.stats.skillXp['melvorD:Attack'] ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-hp-xp',
                text: this.toUnit('HP XP'),
                value: selected?.stats.skillXp['melvorD:Hitpoints'] ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-prayer-xp',
                text: this.toUnit('Prayer XP'),
                value: selected?.stats.skillXp['melvorD:Prayer'] ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-slayer-xp',
                text: this.toUnit('Slayer XP'),
                value: selected?.stats.skillXp['melvorD:Slayer'] ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-summoning-xp',
                text: this.toUnit('Summoning XP'),
                value: selected?.stats.skillXp['melvorD:Summoning'] ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-prayer-points',
                text: this.toUnit('Prayer Points'),
                value: selected?.stats.usedPrayerPoints ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-ammo',
                text: this.toUnit('Ammo'),
                value: selected?.stats.usedAmmo ?? 'N/A'
            })
        );

        const breakdownRunes = this.toBreakdown(selected?.stats.usedRunes);

        this.append(
            new LineItemComponent({
                id: 'mcs-information-runes',
                text: this.toUnit('Runes'),
                value: breakdownRunes?.total ?? 'N/A',
                tooltip: {
                    content: breakdownRunes?.items.length
                        ? `
                <div class="mcs-rune-breakdown">
                    ${breakdownRunes.items.map(item => {
                        return `
                        <div class="mcs-rune">
                            <img class="mcs-rune-media" src="${item.media}" />
                            <span>${item.name}</span>
                            <span>${item.value}</span>
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
                value: selected?.stats.usedCominationRunes ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-potions',
                text: this.toUnit('Potions'),
                value: selected?.stats.usedPotions ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-consumables',
                text: this.toUnit('Consumables'),
                value: selected?.stats.usedConsumabes ?? 'N/A'
            })
        );

        const breakdownSummon = this.toBreakdown(selected?.stats.usedCharges);

        this.append(
            new LineItemComponent({
                id: 'mcs-information-tablets',
                text: this.toUnit('Tablets per type'),
                value: breakdownSummon?.total ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-food',
                text: this.toUnit('Food'),
                value: selected?.stats.usedFood ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-death-rate',
                text: 'Est. Death Rate',
                value: selected?.stats.deaths ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-highest-hit',
                text: 'Highest Hit Taken',
                value: selected?.stats.highestDamageTaken ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-lowest-hitpoints',
                text: 'Lowest Hitpoints',
                value: selected?.stats.lowestHitpoints ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-kill-time',
                text: 'Kill Time (s)',
                value: selected?.stats.killTime ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-kills',
                text: this.toUnit('Kills'),
                value: selected?.stats.kills ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-gp',
                text: this.toUnit('GP'),
                value: selected?.loot.gp ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-raw-gp',
                text: this.toUnit('Raw GP'),
                value: selected?.stats.gp ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-slayer-coins',
                text: this.toUnit('Slayer Coins'),
                value: selected?.stats.sc ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-drops',
                text: this.toUnit('Drops'),
                value: selected?.loot.drops ?? 'N/A'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-information-signet',
                text: this.toUnit('Signet (%)'),
                value: selected?.loot.signet ?? 'N/A'
            })
        );

        if (Global.interface.state.skillId) {
            const skill = game.skills.find(skill => skill.id === Global.interface.state.skillId);

            this.append(
                new LineItemComponent({
                    id: 'mcs-information-pet',
                    text: skill ? `${skill.name} ${this.toUnit('Pet (%)')}` : this.toUnit('Pet (%)'),
                    value: selected?.pet[Global.interface.state.skillId] ?? 'N/A'
                })
            );
        }

        super.preRender(container);
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

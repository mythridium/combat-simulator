import { Source } from 'src/shared/stores/sync.store';
import { Global } from 'src/app/global';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { LineItemComponent } from 'src/app/interface/components/blocks/line-item-component';
import { SimulateComponent } from './simulate';
import { Workers } from 'src/app/workers/workers';

export class SummaryComponent extends CardComponent {
    constructor(private readonly workers: Workers) {
        super({ id: 'mcs-summary', title: 'Out of Combat Stats' });
    }

    protected init() {
        Global.summary.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement) {
        const state = Global.summary.getState();

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-attack-interval',
                text: 'Attack Interval',
                value: formatNumber(state.attackInterval)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-min-hit',
                text: 'Min Hit',
                value: formatNumber(state.minHit)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-max-hit',
                text: 'Max Hit',
                value: formatNumber(state.maxHit)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-summoning-max-hit',
                text: 'Summoning Max Hit',
                value: formatNumber(state.summoningMaxHit),
                tooltip: { content: `Barrier Max Hit: ${formatNumber(state.barrierMaxHit)}` }
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-accuracy',
                text: 'Accuracy',
                value: formatNumber(state.accuracy)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-melee-evasion',
                text: 'Melee Evasion',
                value: formatNumber(state.evasion.melee),
                img: 'assets/media/skills/combat/attack.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-ranged-evasion',
                text: 'Ranged Evasion',
                value: formatNumber(state.evasion.ranged),
                img: 'assets/media/skills/ranged/ranged.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-magic-evasion',
                text: 'Magic Evasion',
                value: formatNumber(state.evasion.magic),
                img: 'assets/media/skills/magic/magic.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-max-hitpoints',
                text: 'Max Hitpoints',
                value: formatNumber(state.maxHitpoints),
                img: 'assets/media/skills/hitpoints/hitpoints.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-damage-reduction',
                text: 'Damage Reduction',
                value: formatNumber(state.damageReduction),
                tooltip: { content: `Uncapped Damage Reduction: ${formatNumber(state.uncappedDamageReduction)}` }
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-auto-eat-threshold',
                text: 'Auto Eat Threshold',
                value: formatNumber(state.autoEatThreshold)
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-drop-doubling',
                text: 'Drop Doubling (%)',
                value: formatNumber(Math.max(0, Math.min(state.dropDoublingPercentage, 100)))
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-gp-multiplier',
                text: 'GP Multiplier',
                value: formatNumber(1 + state.gpMultiplier / 100)
            })
        );

        this.append(new SimulateComponent(this.workers));

        super.preRender(container);
    }
}

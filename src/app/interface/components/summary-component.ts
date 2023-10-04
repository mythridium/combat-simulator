import { Source } from 'src/shared/stores/sync.store';
import { Global } from 'src/app/global';
import { CardComponent } from './blocks/card-component';
import { LineItemComponent } from './blocks/line-item-component';

export class SummaryComponent extends CardComponent {
    constructor() {
        super({ id: 'mcs-summary', title: 'Out of Combat Stats' });

        Global.summary.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: Element) {
        const state = Global.summary.getState();

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-attack-interval',
                text: 'Attack Interval',
                value: state.attackInterval
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-min-hit',
                text: 'Min Hit',
                value: state.minHit
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-max-hit',
                text: 'Max Hit',
                value: state.maxHit
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-summoning-max-hit',
                text: 'Summoning Max Hit',
                value: state.summoningMaxHit
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-accuracy',
                text: 'Accuracy',
                value: state.accuracy
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-melee-evasion',
                text: 'Melee Evasion',
                value: state.evasion.melee,
                img: 'assets/media/skills/combat/attack.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-ranged-evasion',
                text: 'Ranged Evasion',
                value: state.evasion.ranged,
                img: 'assets/media/skills/ranged/ranged.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-magic-evasion',
                text: 'Magic Evasion',
                value: state.evasion.magic,
                img: 'assets/media/skills/magic/magic.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-max-hitpoints',
                text: 'Max Hitpoints',
                value: state.maxHitpoints,
                img: 'assets/media/skills/hitpoints/hitpoints.svg'
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-damage-reduction',
                text: 'Damage Reduction',
                value: state.damageReduction
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-auto-eat-threshold',
                text: 'Auto Eat Threshold',
                value: state.autoEatThreshold
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-drop-doubling',
                text: 'Drop Doubling (%)',
                value: Math.max(0, Math.min(state.dropDoublingPercentage, 100))
            })
        );

        this.append(
            new LineItemComponent({
                id: 'mcs-summary-gp-multiplier',
                text: 'GP Multiplier',
                value: 1 + state.gpMultiplier / 100
            })
        );

        super.preRender(container);
    }
}

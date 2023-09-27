import { GameState } from 'src/app/state/game';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';

export class SummaryComponent extends BaseComponent {
    constructor(private readonly state: GameState) {
        super({
            tag: 'div',
            id: 'mcs-summary-container',
            classes: ['mcs-container']
        });

        this.state.summary.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: Element) {
        const state = this.state.summary.getState();

        const createText = (value: string | number) => {
            const text = document.createElement('div');
            text.append(value.toString());

            return text;
        };

        this.append(createText(state.accuracy));
        this.append(createText(state.attackInterval));
        this.append(createText(state.autoEatThreshold));
        this.append(createText(state.damageReduction));
        this.append(createText(state.dropDoublingPercentage));
        this.append(createText(state.evasion.melee));
        this.append(createText(state.evasion.ranged));
        this.append(createText(state.evasion.magic));
        this.append(createText(state.gpMultiplier));

        super.preRender(container);
    }
}

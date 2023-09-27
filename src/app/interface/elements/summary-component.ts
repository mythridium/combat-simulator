import { GameState } from 'src/app/state/game';
import { BaseComponent } from 'src/app/interface/components/base-component';
import { Source } from 'src/shared/stores/sync.store';

export class SummaryComponent extends BaseComponent {
    constructor(private readonly state: GameState) {
        super({
            tag: 'div',
            id: 'mcs-equipment-container',
            classes: ['mcs-container']
        });

        this.state.summary.when(Source.Worker).subscribe(() => this.render());
    }

    protected construct(): Element {
        const state = this.state.summary.getState();

        const createText = (value: string | number) => {
            const text = document.createElement('div');
            text.append(value.toString());

            return text;
        };

        this.fragment.append(createText(state.accuracy));
        this.fragment.append(createText(state.attackInterval));
        this.fragment.append(createText(state.autoEatThreshold));
        this.fragment.append(createText(state.damageReduction));
        this.fragment.append(createText(state.dropDoublingPercentage));
        this.fragment.append(createText(state.evasion.melee));
        this.fragment.append(createText(state.evasion.ranged));
        this.fragment.append(createText(state.evasion.magic));
        this.fragment.append(createText(state.gpMultiplier));

        return super.construct();
    }
}

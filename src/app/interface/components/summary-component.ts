import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';
import { Global } from 'src/app/global';

export class SummaryComponent extends BaseComponent {
    constructor() {
        super({
            tag: 'div',
            id: 'mcs-summary-container',
            classes: ['mcs-container']
        });

        Global.summary.when(Source.Worker).subscribe(() => this.render());
    }

    protected preRender(container: Element) {
        const state = Global.summary.getState();

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

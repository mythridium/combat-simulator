import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { CheckboxComponent } from 'src/app/interface/components/blocks/checkbox-component';
import { Source } from 'src/shared/stores/sync.store';

export class PlayerSettingsComponent extends BaseComponent {
    constructor() {
        super({ id: 'mcs-player-settings', tag: 'div', classes: ['my-1', 'mcs-fixed-width', 'text-left'] });
    }

    protected init(): void {
        Global.configuration.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const cookingPool = new CheckboxComponent({
            id: 'mcs-cooking-pool',
            checked: Global.configuration.state.cookingPool,
            innerHTML: '95% Cooking Pool',
            classes: ['mb-1'],
            onChange: (_event, element) => {
                Global.configuration.setState(Source.Interface, { cookingPool: element.checked });
            }
        });

        const cookingMastery = new CheckboxComponent({
            id: 'mcs-cooking-mastery',
            checked: Global.configuration.state.cookingMastery,
            innerHTML: '99 Cooking Mastery',
            classes: ['mb-1'],
            onChange: (_event, element) => {
                Global.configuration.setState(Source.Interface, { cookingMastery: element.checked });
            }
        });

        const manualEating = new CheckboxComponent({
            id: 'mcs-manual-eating',
            checked: Global.configuration.state.isManualEating,
            innerHTML: 'Manual Eating',
            classes: ['mb-1'],
            onChange: (_event, element) => {
                Global.configuration.setState(Source.Interface, { isManualEating: element.checked });
            }
        });

        const slayerTask = new CheckboxComponent({
            id: 'mcs-slayer-task',
            checked: Global.configuration.state.isSlayerTask,
            innerHTML: 'Slayer Task',
            classes: ['mb-1'],
            onChange: (_event, element) => {
                Global.configuration.setState(Source.Interface, { isSlayerTask: element.checked });
            }
        });

        const solarEclipse = new CheckboxComponent({
            id: 'mcs-solar-eclipse',
            checked: Global.configuration.state.isSolarEclipse,
            innerHTML: 'Solar Eclipse',
            onChange: (_event, element) => {
                Global.configuration.setState(Source.Interface, { isSolarEclipse: element.checked });
            }
        });

        this.append(cookingPool, cookingMastery, manualEating, slayerTask, solarEclipse);

        super.preRender(container);
    }
}

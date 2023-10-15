import { map } from 'lodash-es';
import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { DropdownComponent } from 'src/app/interface/components/blocks/dropdown-component';
import { PlotType, Unit, plotTypes } from 'src/app/stores/interface.store';
import { Source } from 'src/shared/stores/sync.store';

export class FilterComponent extends BaseComponent {
    constructor() {
        super({ tag: 'div', id: 'mcs-plotter-filter', classes: ['mcs-flex-row', 'mb-3'] });
    }

    protected init(): void {
        Global.interface.when(Source.Interface).subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        if (Global.interface.state.plotType === PlotType.Pet) {
            this.append(
                new DropdownComponent({
                    id: 'mcs-plotter-skill',
                    label: 'Pets',
                    options: game.skills
                        .filter(skill => skill.isCombat)
                        .map(skill => ({ text: skill.name, value: skill.id })),
                    default: () => Global.interface.state.skillId,
                    onChange: option => Global.interface.setState(Source.Interface, { skillId: option.value })
                })
            );
        }

        this.append(
            new DropdownComponent({
                id: 'mcs-plotter-type',
                label: 'Plot Type',
                options: Object.entries<string>(plotTypes).map(([value, text]) => ({ text, value })),
                default: () => Global.interface.state.plotType,
                onChange: option => Global.interface.setState(Source.Interface, { plotType: option.value as PlotType })
            })
        );

        this.append(
            new DropdownComponent({
                id: 'mcs-plotter-unit',
                label: 'Time',
                default: () => Global.interface.state.unit,
                options: map(Unit, (value, key) => ({ text: key, value })),
                onChange: option => Global.interface.setState(Source.Interface, { unit: option.value as Unit })
            })
        );

        super.preRender(container);
    }
}

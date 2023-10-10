import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { ButtonComponent } from 'src/app/interface/components/blocks/button-component';
import { Import } from 'src/app/modules/import';
import { Source } from 'src/shared/stores/sync.store';

export class EquipmentSetComponent extends BaseComponent {
    constructor() {
        super({ id: 'mcs-equipment-sets', tag: 'div' });
    }

    protected init() {
        Global.interface.when(Source.Interface).subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const text = document.element({ tag: 'span', innerHTML: 'Import Set', classes: ['font-size-sm', 'mr-1'] });

        this.append(text);

        for (let index = 0; index < Global.interface.state.equipmentSets; index++) {
            const button = new ButtonComponent({
                id: `mcs-equipment-set-${index}`,
                content: (index + 1).toString(),
                onClick: () => Import.set(index)
            });

            this.append(button);
        }

        super.preRender(container);
    }
}

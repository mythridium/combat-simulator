import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';

export class SynergyComponent extends BaseComponent {
    constructor() {
        super({ id: 'mcs-synergy', tag: 'div', classes: ['my-1', 'mcs-fixed-width'] });
    }

    protected init() {
        Global.equipment.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const text = document.element({
            tag: 'div',
            innerHTML: this.synergyDescription?.description ?? 'Synergy Locked',
            classes: ['mcs-md-text']
        });

        this.append(text);

        super.preRender(container);
    }

    private get synergyDescription() {
        const summon1Slot = Global.equipment.state.equipment.find(slot => slot.slot === 'Summon1');
        const summon2Slot = Global.equipment.state.equipment.find(slot => slot.slot === 'Summon2');

        if (!summon1Slot || !summon2Slot) {
            return;
        }

        const summon1 = game.items.equipment.getObjectByID(summon1Slot.id);
        const summon2 = game.items.equipment.getObjectByID(summon2Slot.id);

        if (!summon1 || !summon2) {
            return;
        }

        return game.summoning.getSynergyData(summon1, summon2);
    }
}

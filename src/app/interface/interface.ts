import { GameState } from 'src/app/state/game';
import { ModalComponent } from './components/modal-component';
import { EquipmentComponent } from './components/equipment-component';
import { SummaryComponent } from './components/summary-component';
import { Workers } from 'src/app/workers/workers';

import './interface.scss';

export class Interface {
    private readonly modalElementId = 'myth-combat-simulator-modal';
    private modal: ModalComponent;

    constructor(
        private readonly context: Modding.ModContext,
        private readonly state: GameState,
        private readonly workers: Workers
    ) {}

    public init() {
        this.addSidebarItem();
        this.createInterface();

        document.getElementById('page-container').append(this.modal.element);
    }

    private addSidebarItem() {
        sidebar.category('Modding').item('Combat Simulator', {
            icon: 'assets/media/skills/combat/combat.png',
            itemClass: 'combat-simulator-button',
            onRender: elements => {
                elements.itemEl.setAttribute('data-toggle', 'modal');
                elements.itemEl.setAttribute('data-backdrop', 'static');
                elements.itemEl.setAttribute('data-target', `#${this.modalElementId}`);
            }
        });
    }

    private createInterface() {
        this.modal = new ModalComponent({
            id: this.modalElementId,
            title: `[Myth] Combat Simulator - ${this.context.version}`
        });

        const equipment = new EquipmentComponent(this.state, this.workers);
        const summary = new SummaryComponent(this.state);

        this.modal.append(equipment, summary);
        this.modal.render();
    }
}

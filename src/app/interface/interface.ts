import './interface.scss';
import { ModalComponent } from './components/modal-component';
import { EquipmentComponent } from './components/equipment-component';
import { SummaryComponent } from './components/summary-component';
import { Workers } from 'src/app/workers/workers';
import { ContainerComponent } from './components/blocks/container-component';
import { InformationComponent } from './components/information-component';
import { ConfigurationComponent } from './components/configuration-component';

export class Interface {
    private readonly modalElementId = 'myth-combat-simulator-modal';
    private modal: ModalComponent;

    constructor(private readonly context: Modding.ModContext, private readonly workers: Workers) {}

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

        const player = new ContainerComponent({ id: 'mcs-player', classes: ['mcs-flex-row'] });
        const plotter = new ContainerComponent({ id: 'mcs-plotter', classes: ['mcs-flex-column'] });

        const equipment = new EquipmentComponent(this.workers);
        const configuration = new ConfigurationComponent();
        const summary = new SummaryComponent();
        const information = new InformationComponent();

        player.append(equipment, configuration, summary, information);

        this.modal.append(player, plotter);
        this.modal.render();
    }
}

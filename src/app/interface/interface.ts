import './interface.scss';
import './modules/element';
import { ModalComponent } from './components/modal-component';
import { PlayerComponent } from './components/player/player-component';
import { SummaryComponent } from './components/summary/summary-component';
import { ContainerComponent } from './components/blocks/container-component';
import { InformationComponent } from './components/information-component';
import { ConfigurationComponent } from './components/configuration-component';
import { Workers } from 'src/app/workers/workers';
import { Global } from 'src/app/global';
import { Source } from 'src/shared/stores/sync.store';
import { EquipmentCategories } from 'src/app/modules/equipment-categories';

export class Interface {
    private readonly modalElementId = 'myth-combat-simulator-modal';
    private modal: ModalComponent;

    constructor(private readonly context: Modding.ModContext, private readonly workers: Workers) {}

    public init() {
        Global.equipmentCategories = new EquipmentCategories();

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
            },
            onClick: () => {
                const equipmentSets = game.combat.player.equipmentSets.length;

                if (equipmentSets !== Global.interface.state.equipmentSets) {
                    Global.interface.setState(Source.Interface, { equipmentSets });
                }
            }
        });
    }

    private createInterface() {
        this.modal = new ModalComponent({
            id: this.modalElementId,
            title: `[Myth] Combat Simulator - ${this.context.version}`
        });

        const setup = new ContainerComponent({ id: 'mcs-setup', classes: ['mcs-flex-row'] });

        const player = new PlayerComponent();
        const configuration = new ConfigurationComponent();
        const summary = new SummaryComponent(this.workers);
        const information = new InformationComponent();

        setup.append(player, configuration, summary, information);

        const plotter = new ContainerComponent({ id: 'mcs-plotter', classes: ['mcs-flex-column'] });

        this.modal.append(setup, plotter);
        this.modal.render();
    }
}

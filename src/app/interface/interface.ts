import { GameState } from '../state/game';
import { Modal } from './components/modal';
import { PlayerComponent } from './components/player';

import './interface.scss';

export class Interface {
    private readonly modalElementId = 'myth-combat-simulator-modal';
    private modal: Modal;

    constructor(private readonly context: Modding.ModContext, private readonly state: GameState) {}

    public init() {
        this.addSidebarItem();

        this.modal = new Modal(this.context, this.modalElementId);

        const player = new PlayerComponent(this.state);

        this.modal.append(player.construct());

        this.modal.construct();
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
}

import { GameState } from 'src/app/state/game';
import { Source } from 'src/shared/stores/sync.store';

export class PlayerComponent {
    private readonly fragment = new DocumentFragment();

    constructor(private readonly state: GameState) {
        this.state.player.when(Source.Worker).subscribe(state => this.render(state.equipmentIds));
    }

    public construct() {
        const button = document.createElement('button');
        button.textContent = 'Test';
        button.onclick = () => {
            this.state.player.setState(Source.Interface, { equipmentIds: ['123'] });
        };

        this.fragment.append(button);

        const container = document.createElement('div');
        container.id = 'mcs-player';
        container.className = 'mcs-container';

        container.appendChild(this.fragment);

        return container;
    }

    private render(equipmentIds: string[]) {
        const equipment = this.toEquipment(equipmentIds);

        for (const item of equipment) {
            console.log(item.id);
        }
    }

    private toEquipment(items: string[]) {
        return game.items.filter(item => items.includes(item.id)) as EquipmentItem[];
    }
}

import { GameState } from 'src/app/state/game';

export class PlayerComponent {
    private readonly fragment = new DocumentFragment();

    constructor(private readonly state: GameState) {}

    public construct() {
        this.createAttackStyles();

        const container = document.createElement('div');
        container.id = 'mcs-player';
        container.className = 'mcs-container';

        container.appendChild(this.fragment);

        return container;
    }

    private createAttackStyles() {
        for (const style of this.state.player.attackStyles) {
            const element = document.createElement('div');

            element.id = 'mcs-attack-style-' + style.localID;
            element.textContent = style.localID;

            this.fragment.append(element);
        }
    }
}

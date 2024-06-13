import 'src/app/user-interface/elements';
import './styles.scss';
import type { Main } from './main/main';

export class UserInterface {
    public main: Main;

    public init() {
        this.main = createElement('mcs-main', { classList: ['is-closed'] });

        document.body.append(createElement('mcs-tooltip'));
        document.body.append(this.main);
        this.main.prepend(createElement('div', { id: 'mcs-dialog-backdrop' }));
        document.body.append(createElement('div', { id: 'mcs-backdrop' }));

        sidebar.category('Modding').item('Combat Simulator', {
            icon: 'assets/media/skills/combat/combat.png',
            itemClass: 'mcs-combat-simulator',
            onClick: () => this.main.toggle()
        });
    }
}

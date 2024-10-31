import 'src/app/user-interface/elements';
import './styles.scss';
import type { Main } from './main/main';
import { DialogController } from './_parts/dialog/dialog-controller';
import { ConfigurationMenu } from './configuration-menu/configuration-menu';
import { Pages } from './pages/pages';

export class UserInterface {
    public main: Main;
    public menu: ConfigurationMenu;
    public mobileMenu: ConfigurationMenu;
    public pages: Pages;

    public init() {
        this.main = createElement('mcs-main', { classList: ['is-closed'] });

        document.body.append(createElement('mcs-tooltip'));
        document.body.append(this.main);

        const backdrop = createElement('div', { id: 'mcs-dialog-backdrop' });

        backdrop.onclick = () => {
            if (DialogController['current']?.allowBackdropClose) {
                DialogController.close();
            }
        };

        this.main.prepend(backdrop);
        document.body.append(createElement('div', { id: 'mcs-backdrop' }));

        this.menu = this.main.querySelector('.mcs-configuration-menu');
        this.mobileMenu = this.main.querySelector('.mcs-mobile-configuration-menu');
        this.pages = this.main.querySelector('mcs-pages');

        sidebar.category('Modding').item('Combat Simulator', {
            icon: 'assets/media/skills/combat/combat.png',
            itemClass: 'mcs-combat-simulator',
            onClick: () => this.main.toggle()
        });
    }
}

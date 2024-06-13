import './sidebar.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { Bugs } from 'src/app/user-interface/bugs/bugs';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-sidebar': Sidebar;
    }
}

@LoadTemplate('app/user-interface/sidebar/sidebar.html')
export class Sidebar extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _simulate: HTMLButtonElement;
    private readonly _configuration: HTMLButtonElement;
    private readonly _configurationMenu: HTMLDivElement;
    private readonly _summary: HTMLButtonElement;
    private readonly _modifiers: HTMLButtonElement;
    private readonly _foundABug: HTMLButtonElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-sidebar-template'));

        this._simulate = getElementFromFragment(this._content, 'mcs-simulate-sidebar', 'button');
        this._configuration = getElementFromFragment(this._content, 'mcs-configuration-sidebar', 'button');
        this._configurationMenu = getElementFromFragment(this._content, 'mcs-configuration-menu', 'div');
        this._summary = getElementFromFragment(this._content, 'mcs-summary-sidebar', 'button');
        this._modifiers = getElementFromFragment(this._content, 'mcs-modifiers-sidebar', 'button');
        this._foundABug = getElementFromFragment(this._content, 'mcs-found-a-bug-sidebar', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._simulate.onclick = () => PageController.goTo(PageId.Simulate);

        this._configuration.onclick = () => {
            const isOpen = this._configurationMenu.classList.toggle('is-open');
            const icon = this._configuration.querySelector('i');

            icon.classList.toggle('fa-eye', isOpen);
            icon.classList.toggle('fa-eye-slash', !isOpen);
        };

        this._summary.onclick = () => PageController.goTo(PageId.Summary);
        this._modifiers.onclick = () => PageController.goTo(PageId.Modifiers);
        this._foundABug.onclick = () => Bugs.report(true);
    }
}

customElements.define('mcs-sidebar', Sidebar);

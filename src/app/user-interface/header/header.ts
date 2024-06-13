import './header.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-header': Header;
    }
}

@LoadTemplate('app/user-interface/header/header.html')
export class Header extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _close: HTMLButtonElement;
    private readonly _simulate: HTMLButtonElement;
    private readonly _configuration: HTMLButtonElement;
    private readonly _summary: HTMLButtonElement;
    private readonly _modifiers: HTMLButtonElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-header-template'));

        this._close = getElementFromFragment(this._content, 'mcs-header-close', 'button');
        this._simulate = getElementFromFragment(this._content, 'mcs-simulate-header', 'button');
        this._configuration = getElementFromFragment(this._content, 'mcs-configuration-header', 'button');
        this._summary = getElementFromFragment(this._content, 'mcs-summary-header', 'button');
        this._modifiers = getElementFromFragment(this._content, 'mcs-modifiers-header', 'button');
    }

    public connectedCallback() {
        this._close.onclick = () => Global.userInterface.main.toggle();
        this._simulate.onclick = () => PageController.goTo(PageId.Simulate);
        this._configuration.onclick = () => {
            document.getElementById('mcs-combat-simulator').classList.toggle('mobile-menu-open');
        };
        this._summary.onclick = () => PageController.goTo(PageId.Summary);
        this._modifiers.onclick = () => PageController.goTo(PageId.Modifiers);

        this.appendChild(this._content);
    }
}

customElements.define('mcs-header', Header);

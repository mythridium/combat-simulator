import './pages.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-pages': Pages;
    }
}

@LoadTemplate('app/user-interface/pages/pages.html')
export class Pages extends HTMLElement {
    private readonly _content = new DocumentFragment();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-pages-template'));
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }
}

customElements.define('mcs-pages', Pages);

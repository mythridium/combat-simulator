import './pages.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { AstrologyPage } from './configuration/astrology/astrology';
import { ModDefinition } from 'src/app/api';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-pages': Pages;
    }
}

@LoadTemplate('app/user-interface/pages/pages.html')
export class Pages extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private _astrology: AstrologyPage;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-pages-template'));
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._astrology = this.querySelector('mcs-astrology');
    }

    public addModDefinition(namespace: string, definition: ModDefinition) {
        const page = createElement('div', { id: `mcs-mod-${namespace}`, className: 'mcs-page' });

        const title = createElement('mcs-page-title', {
            attributes: [['page-title', definition.header?.title ?? definition.name]]
        });

        if (definition.header?.description) {
            title.setAttribute('description', definition.header?.description);
        }

        page.append(title);

        this._astrology.insertAdjacentElement('afterend', page);
    }
}

customElements.define('mcs-pages', Pages);

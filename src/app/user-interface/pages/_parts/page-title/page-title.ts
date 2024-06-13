import './page-title.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-page-title': PageTitle;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/page-title/page-title.html')
export class PageTitle extends HTMLElement {
    public static observedAttributes = ['page-title', 'description'];

    private readonly _content = new DocumentFragment();
    private readonly _title: HTMLDivElement;
    private readonly _description: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-page-title-template'));

        this._title = getElementFromFragment(this._content, 'mcs-page-title', 'div');
        this._description = getElementFromFragment(this._content, 'mcs-page-description', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public attributeChangedCallback(name: string, _previous: string, current: string) {
        if (name === 'page-title') {
            this._title.innerText = current;
        }

        if (name === 'description') {
            if (!current) {
                this._description.style.display = 'none';
            } else {
                this._description.style.display = 'block';
                this._description.innerText = current;
            }
        }
    }
}

customElements.define('mcs-page-title', PageTitle);

import './line-item.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-line-item': LineItem;
    }
}

@LoadTemplate('app/user-interface/_parts/line-item/line-item.html')
export class LineItem extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-line-item-template'));
    }

    public connectedCallback() {
        this._shadowRoot.appendChild(this._content);
    }
}

customElements.define('mcs-line-item', LineItem);

import './hint.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-hint': Hint;
    }
}

@LoadTemplate('app/user-interface/_parts/hint/hint.html')
export class Hint extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-hint-template'));
    }

    public connectedCallback() {
        this.dataset.mcstooltip = '';
        this._shadowRoot.appendChild(this._content);
    }
}

customElements.define('mcs-hint', Hint);

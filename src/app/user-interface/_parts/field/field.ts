import './field.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-field': Field;
    }
}

@LoadTemplate('app/user-interface/_parts/field/field.html')
export class Field extends HTMLElement {
    public static observedAttributes = ['data-mcssmall'];

    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-field-template'));
    }

    public connectedCallback() {
        this._shadowRoot.appendChild(this._content);
        this._update();
    }

    public attributeChangedCallback() {
        this._update();
    }

    private _update() {
        this._shadowRoot
            .querySelector('.mcs-field')
            ?.classList.toggle('mcs-small', this.dataset.mcssmall !== undefined ? true : false);

        this._shadowRoot
            .querySelector('.mcs-field-label')
            ?.classList.toggle('mcs-small', this.dataset.mcssmall !== undefined ? true : false);
    }
}

customElements.define('mcs-field', Field);

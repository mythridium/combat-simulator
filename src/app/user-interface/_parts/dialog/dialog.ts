import './dialog.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-dialog': Dialog;
    }
}

@LoadTemplate('app/user-interface/_parts/dialog/dialog.html')
export class Dialog extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    private _dialogContent: HTMLDivElement;

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-dialog-template'));
    }

    public connectedCallback() {
        this._shadowRoot.appendChild(this._content);

        this._dialogContent = this._shadowRoot.querySelector('.mcs-dialog-content');
    }

    public _getScrollTop() {
        return this._dialogContent.scrollTop;
    }

    public _setScrollTop(scrollTop: number) {
        this._dialogContent.scrollTop = scrollTop;
    }
}

customElements.define('mcs-dialog', Dialog);

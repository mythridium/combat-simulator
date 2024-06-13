import './switch.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-switch': Switch;
    }
}

type Callback = (isChecked: boolean) => void;

@LoadTemplate('app/user-interface/_parts/switch/switch.html')
export class Switch extends HTMLElement {
    public static observedAttributes = ['data-mcsontext', 'data-mcsofftext', 'data-mcsname', 'data-mcsdescription'];

    private readonly _content = new DocumentFragment();

    private readonly _name: HTMLDivElement;
    private readonly _description: HTMLElement;
    private readonly _input: HTMLInputElement;
    private readonly _toggleText: HTMLDivElement;

    private readonly _callbacks = new Set<Callback>();

    public get _value() {
        return this._input.checked;
    }

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-switch-template'));

        this._name = getElementFromFragment(this._content, 'mcs-switch-name', 'div');
        this._description = getElementFromFragment(this._content, 'mcs-switch-description', 'small');
        this._input = getElementFromFragment(this._content, 'mcs-switch-input', 'input');
        this._toggleText = getElementFromFragment(this._content, 'mcs-switch-toggle-text', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._input.onchange = () => {
            this._onChange();

            for (const callback of this._callbacks) {
                try {
                    callback(this._input.checked);
                } catch (exception) {
                    Global.logger.error(`Error thrown from switch onChange callback`, exception);
                }
            }
        };
    }

    public disconnectedCallback() {
        this._callbacks.clear();
    }

    public attributeChangedCallback() {
        this._onChange();
    }

    public _toggle(toggle?: boolean) {
        this._input.checked = toggle ?? !this._input.checked;
        this._onChange();
    }

    public _on(callback: Callback) {
        if (this._callbacks.has(callback)) {
            return;
        }

        this._callbacks.add(callback);
    }

    public _off(callback: Callback) {
        this._callbacks.delete(callback);
    }

    private _onChange() {
        this._toggleText.innerText = this._input.checked
            ? this.dataset.mcsontext ?? 'On'
            : this.dataset.mcsofftext ?? 'Off';

        this.toggleText(this._name, this.dataset.mcsname);
        this.toggleText(this._description, this.dataset.mcsdescription);
    }

    private toggleText(element: HTMLElement, text: string) {
        if (text) {
            element.innerText = text;
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }
}

customElements.define('mcs-switch', Switch);

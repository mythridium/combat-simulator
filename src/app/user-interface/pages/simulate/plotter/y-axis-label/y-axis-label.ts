import './y-axis-label.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-plotter-y-axis-label': PlotterYAxisLabel;
    }
}

@LoadTemplate('app/user-interface/pages/simulate/plotter/y-axis-label/y-axis-label.html')
export class PlotterYAxisLabel extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _text: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-plotter-y-axis-label-template'));

        this._text = getElementFromFragment(this._content, 'mcs-plotter-y-axis-text', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public _set({ text, bottom }: { text?: string; bottom?: number }) {
        if (text != undefined) {
            this._text.textContent = text;
        }

        if (bottom != undefined) {
            this._text.style.bottom = `${bottom}%`;
        }
    }

    public _toggle(toggle: boolean) {
        if (toggle) {
            this._text.style.display = 'block';
        } else {
            this._text.style.display = 'none';
        }
    }
}

customElements.define('mcs-plotter-y-axis-label', PlotterYAxisLabel);

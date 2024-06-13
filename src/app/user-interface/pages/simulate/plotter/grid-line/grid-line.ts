import './grid-line.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-plotter-grid-line': PlotterGridLine;
    }
}

@LoadTemplate('app/user-interface/pages/simulate/plotter/grid-line/grid-line.html')
export class PlotterGridLine extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _gridLine: HTMLDivElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-plotter-grid-line-template'));

        this._gridLine = getElementFromFragment(this._content, 'mcs-plotter-grid-line', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public _set({ bottom }: { bottom?: number }) {
        if (bottom != undefined) {
            this._gridLine.style.bottom = `${bottom}%`;
        }
    }

    public _toggle(toggle: boolean) {
        if (toggle) {
            this._gridLine.style.display = 'block';
        } else {
            this._gridLine.style.display = 'none';
        }
    }
}

customElements.define('mcs-plotter-grid-line', PlotterGridLine);

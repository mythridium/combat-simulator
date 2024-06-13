import './bar.scss';
import { LoadTemplate } from 'src/app/user-interface/template';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-plotter-bar': PlotterBar;
    }
}

@LoadTemplate('app/user-interface/pages/simulate/plotter/bar/bar.html')
export class PlotterBar extends HTMLElement {
    private readonly _content = new DocumentFragment();
    private readonly _bar: HTMLDivElement;

    private _isSearched = false;
    private _isSelected = false;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-plotter-bar-template'));

        this._bar = getElementFromFragment(this._content, 'mcs-plotter-bar', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public _set({
        height,
        color,
        border,
        searched
    }: {
        height?: number;
        color?: string;
        border?: boolean;
        searched?: boolean;
    }) {
        if (searched != undefined) {
            this._isSearched = searched;
        }

        if (border != undefined) {
            this._isSelected = border;
        }

        if (height != undefined) {
            this._bar.style.height = `${height}%`;
        }

        if (color != undefined) {
            this._bar.style.backgroundColor = color;
        }

        this._setHighlight();
    }

    private _setHighlight() {
        if (this._isSelected) {
            this.style.background = 'rgba(133, 133, 133, 0.5)';
        } else if (this._isSearched) {
            this.style.background = 'rgba(255, 255, 255, 0.5)';
        } else {
            this.style.background = '';
        }

        this._bar.style.border = this._isSelected ? '2px solid red' : 'none';
    }
}

customElements.define('mcs-plotter-bar', PlotterBar);

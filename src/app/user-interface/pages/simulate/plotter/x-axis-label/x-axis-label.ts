import './x-axis-label.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { ImageLoader } from 'src/app/utils/image-loader';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-plotter-x-axis-label': PlotterXAxisLabel;
    }
}

@LoadTemplate('app/user-interface/pages/simulate/plotter/x-axis-label/x-axis-label.html')
export class PlotterXAxisLabel extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _image: HTMLImageElement;
    private readonly _cross: HTMLImageElement;

    private readonly crossUrl: string;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-plotter-x-axis-label-template'));

        this._image = getElementFromFragment(this._content, 'mcs-plotter-x-axis-image', 'img');
        this._cross = getElementFromFragment(this._content, 'mcs-plotter-x-axis-cross', 'img');

        this.crossUrl = Global.context.getResourceUrl('assets/cross.svg');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        ImageLoader.register(this._cross, this.crossUrl);
    }

    public _set(image: string) {
        this._image.src = image;
    }

    public _toggle(toggle: boolean) {
        if (toggle) {
            this._cross.style.display = '';
        } else {
            this._cross.style.display = 'none';
        }
    }
}

customElements.define('mcs-plotter-x-axis-label', PlotterXAxisLabel);

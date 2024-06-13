import './button-image.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { ImageLoader } from 'src/app/utils/image-loader';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-button-image': ButtonImage;
    }
}

type Callback = (isSelected: boolean, event: MouseEvent) => void;

@LoadTemplate('app/user-interface/_parts/button-image/button-image.html')
export class ButtonImage extends HTMLElement {
    public static observedAttributes = [
        'data-mcssrc',
        'data-mcsdisabled',
        'data-mcsselected',
        'data-mcsskipasync',
        'data-mcssmall'
    ];

    private readonly _content = new DocumentFragment();
    private readonly _shadowRoot: ShadowRoot;

    private readonly _button: HTMLButtonElement;
    private readonly _image: HTMLImageElement;

    private readonly _callbacks = new Set<Callback>();

    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._content.append(getTemplateNode('mcs-button-image-template'));

        this._button = getElementFromFragment(this._content, 'mcs-button-image-button', 'button');
        this._image = getElementFromFragment(this._content, 'mcs-button-image-image', 'img');
    }

    public connectedCallback() {
        this.dataset.mcstooltip = '';
        this._shadowRoot.appendChild(this._content);

        if (this.dataset.mcsreadonly === undefined) {
            this._button.onclick = event => {
                this._toggle();

                for (const callback of this._callbacks) {
                    try {
                        callback(this.dataset.mcsselected !== undefined, event);
                    } catch (exception) {
                        Global.logger.error(`Callback threw error in button image.`, exception);
                    }
                }
            };
        }
    }

    public disconnectedCallback() {
        this._callbacks.clear();
    }

    public attributeChangedCallback() {
        this._update();
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

    public _toggle(toggle?: boolean) {
        this.toggleAttribute('data-mcsselected', toggle);
    }

    private _update() {
        this._button.disabled = this.dataset.mcsdisabled !== undefined ? true : false;
        this._button.classList.toggle('mcs-readonly', this.dataset.mcsreadonly !== undefined ? true : false);
        this._button.classList.toggle('mcs-selected', this.dataset.mcsselected !== undefined ? true : false);
        this._image.classList.toggle('mcs-small', this.dataset.mcssmall !== undefined ? true : false);

        if (this._image.src !== this.dataset.mcssrc && !this._image.src.includes(this.dataset.mcssrc)) {
            if (this.dataset.mcssrc !== undefined) {
                if (this.dataset.mcsskipasync !== undefined) {
                    this._image.src = this.dataset.mcssrc;
                } else {
                    ImageLoader.register(this._image, this.dataset.mcssrc);
                }
            } else {
                this._image.style.display = 'none';
            }
        }
    }
}

customElements.define('mcs-button-image', ButtonImage);

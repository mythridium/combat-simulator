import './image-button-component.scss';
import { BaseComponent } from './base-component';
import { Props } from 'tippy.js';

export interface ImageButtonOptions {
    id: string;
    src: string;
    onClick(event: MouseEvent): void;
    disabled?: boolean;
    classes?: string[];
    tooltip?: Partial<Props>;
    lazy?: boolean;
}

export class ImageButtonComponent extends BaseComponent {
    constructor(private readonly options: ImageButtonOptions) {
        super({
            tag: 'button',
            id: options.id,
            classes: ['mcs-image-btn', 'btn', 'btn-outline-dark', ...(options.classes ?? [])],
            tooltip: options.tooltip
        });
    }

    protected preRender(container: HTMLElement) {
        this.append(document.element({ tag: 'img', src: this.options.src, lazy: this.options.lazy }));

        if (this.options.disabled) {
            container.setAttribute('disabled', 'disabled');
        }

        container.addEventListener('click', event => this.options.onClick(event));

        super.preRender(container);
    }
}

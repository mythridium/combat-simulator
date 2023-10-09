import './line-item-component.scss';
import { BaseComponent } from './base-component';
import { Props } from 'tippy.js';

export interface CardOptions {
    id: string;
    text: string;
    value: string | number;
    img?: string;
    classes?: string[];
    tooltip?: Partial<Props>;
}

export class LineItemComponent extends BaseComponent {
    constructor(private readonly options: CardOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-line-item', 'font-size-sm', 'mx-1', ...(options.classes ?? [])]
        });
    }

    public preRender(container: HTMLElement) {
        const wrapper = document.element({ tag: 'div', classes: ['mcs-line-item-wrapper'] });
        const text = document.element({ tag: 'span', classes: ['mcs-line-item-text'], innerHTML: this.options.text });
        const value = document.element({
            tag: 'span',
            classes: ['mcs-line-item-value'],
            innerHTML: this.options.value.toString(),
            tooltip: this.options.tooltip
        });

        if (this.options.img) {
            const img = document.element({
                tag: 'img',
                classes: ['mcs-line-item-img', 'skill-icon-xxs', 'mr-1'],
                src: this.options.img
            });

            wrapper.append(img);
        }

        wrapper.append(text, value);
        this.append(wrapper);

        super.preRender(container);
    }
}

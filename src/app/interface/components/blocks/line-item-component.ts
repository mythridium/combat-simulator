import { BaseComponent } from './base-component';

export interface CardOptions {
    id: string;
    text: string;
    value: string | number;
    img?: string;
    classes?: string[];
}

export class LineItemComponent extends BaseComponent {
    constructor(private readonly options: CardOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-line-item', 'font-size-sm', 'mx-1', ...(options.classes ?? [])]
        });
    }

    public preRender(container: Element) {
        const wrapper = document.createElement('div');
        const text = document.createElement('span');
        const value = document.createElement('span');

        wrapper.className = 'mcs-line-item-wrapper';
        text.className = 'mcs-line-item-text';
        value.className = 'mcs-line-item-value';

        text.innerHTML = this.options.text;
        value.innerHTML = this.options.value.toString();

        if (this.options.img) {
            const img = document.createElement('img');

            img.className = 'mcs-line-item-img skill-icon-xxs mr-1';
            img.src = this.options.img;

            wrapper.append(img);
        }

        wrapper.append(text, value);
        this.append(wrapper);

        super.preRender(container);
    }
}

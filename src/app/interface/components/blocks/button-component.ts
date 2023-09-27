import { BaseComponent } from './base-component';

export interface ButtonOptions {
    id: string;
    content: string | Element;
    onClick(): void;
    disabled?: boolean;
    classes?: string[];
}

export class ButtonComponent extends BaseComponent {
    constructor(private readonly options: ButtonOptions) {
        super({
            tag: 'button',
            id: options.id,
            classes: ['btn', 'btn-primary', 'm-1', ...(options.classes ?? [])]
        });
    }

    protected preRender(container: Element) {
        const content = document.createElement('span');

        if (typeof this.options.content === 'string') {
            content.innerHTML = this.options.content;
        } else {
            content.innerHTML = this.options.content.outerHTML;
        }

        this.append(content);

        if (this.options.disabled) {
            container.setAttribute('disabled', 'disabled');
        }

        container.addEventListener('click', () => this.options.onClick());

        super.preRender(container);
    }
}

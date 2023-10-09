import { BaseComponent } from './base-component';

export interface ButtonOptions {
    id: string;
    content: string | HTMLElement;
    onClick(event: MouseEvent): void;
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

    protected preRender(container: HTMLElement) {
        const content = document.element({
            tag: 'span',
            innerHTML: typeof this.options.content === 'string' ? this.options.content : this.options.content.outerHTML
        });

        if (this.options.disabled) {
            container.setAttribute('disabled', 'disabled');
        }

        container.addEventListener('click', event => this.options.onClick(event));

        this.append(content);

        super.preRender(container);
    }
}

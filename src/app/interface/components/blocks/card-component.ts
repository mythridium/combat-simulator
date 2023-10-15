import './card-component.scss';
import { BaseComponent } from './base-component';

export interface CardOptions {
    id: string;
    title?: string;
    classes?: string[];
    withoutSpacing?: boolean;
}

export class CardComponent extends BaseComponent {
    constructor(private readonly options: CardOptions) {
        const spacing = options.withoutSpacing ? [] : ['m-1', 'p-2'];
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-card', ...spacing, 'text-center', 'bg-combat-inner-dark', ...(options.classes ?? [])]
        });
    }

    protected construct(): HTMLElement {
        if (this.options.title) {
            this.append(
                document.element({ tag: 'h5', classes: ['mcs-card-title', 'mb-2'], innerHTML: this.options.title })
            );
        }

        return super.construct();
    }
}

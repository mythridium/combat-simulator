import './card-component.scss';
import { BaseComponent } from './base-component';

export interface CardOptions {
    id: string;
    title?: string;
    classes?: string[];
}

export class CardComponent extends BaseComponent {
    constructor(private readonly options: CardOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-card', 'm-1', 'p-2', 'text-center', 'bg-combat-inner-dark', ...(options.classes ?? [])]
        });
    }

    public render() {
        if (this.options.title) {
            this.append(
                document.element({ tag: 'h5', classes: ['mcs-card-title', 'mb-2'], innerHTML: this.options.title })
            );
        }

        super.render();
    }
}

import { BaseComponent } from './base-component';

export interface ContainerOptions {
    id: string;
    classes?: string[];
}

export class ContainerComponent extends BaseComponent {
    constructor(options: ContainerOptions) {
        super({
            tag: 'div',
            id: options.id,
            classes: ['mcs-container', 'm-2', ...(options.classes ?? [])]
        });
    }
}

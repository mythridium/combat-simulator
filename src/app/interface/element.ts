import { Props } from 'tippy.js';
import { BaseComponent } from './components/blocks/base-component';
import { ImageLoader } from './image-loader';

declare global {
    interface ElementOptions<K extends keyof HTMLElementTagNameMap> {
        tag: K;
        id?: string;
        classes?: string[];
        innerHTML?: string;
        src?: string;
        lazy?: boolean;
        tooltip?: Partial<Props>;
        onClick?: (event: MouseEvent) => void;
    }

    interface Document {
        element: <K extends keyof HTMLElementTagNameMap>(options: ElementOptions<K>) => ElementComponent<K>;
    }
}

class ElementComponent<K extends keyof HTMLElementTagNameMap> extends BaseComponent {
    constructor(private readonly options: ElementOptions<K>) {
        super({
            id: options.id ?? '',
            tag: options.tag,
            classes: options.classes,
            tooltip: options.tooltip
        });
    }

    public render() {
        super.render();

        if (this.options.innerHTML) {
            this.element.innerHTML = this.options.innerHTML;
        }

        if (this.options.src && this.options.lazy) {
            ImageLoader.register(<HTMLImageElement>this.element, this.options.src);
        }

        if (this.options.src && !this.options.lazy) {
            (<HTMLImageElement>this.element).src = this.options.src;
        }

        if (this.options.onClick) {
            this.element.onclick = this.options.onClick;
        }
    }
}

document.element = <K extends keyof HTMLElementTagNameMap>(options: ElementOptions<K>): ElementComponent<K> =>
    new ElementComponent(options);

export {};

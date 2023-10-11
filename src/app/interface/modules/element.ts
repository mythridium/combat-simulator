import { Props } from 'tippy.js';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { ImageLoader } from './image-loader';

interface ElementOptionsTagMap {
    div: SharedElementOptions;
    span: SharedElementOptions;
    h5: SharedElementOptions;
    label: LabelElementOptions;
    img: ImageElementOptions;
    input: InputElementOptions;
}

type ElementOptions<K extends keyof ElementOptionsTagMap = keyof ElementOptionsTagMap> = {
    [P in K]: ElementOptionsTagMap[P];
}[K];

interface BaseElementOptions {
    id?: string;
    classes?: string[];
    innerHTML?: string;
    tooltip?: Partial<Props>;
    onClick?: (event: MouseEvent, element: HTMLElement) => void;
}

interface SharedElementOptions extends BaseElementOptions {
    tag: 'div' | 'span' | 'h5';
}

interface ImageElementOptions extends BaseElementOptions {
    tag: 'img';
    src: string;
    lazy?: boolean;
}

interface InputElementOptions extends BaseElementOptions {
    tag: 'input';
    type: string;
    name?: string;
    checked?: boolean;
}

interface LabelElementOptions extends BaseElementOptions {
    tag: 'label';
    for: string;
}

declare global {
    interface Document {
        element: <K extends keyof ElementOptionsTagMap>(options: ElementOptions<K>) => ElementComponent<K>;
    }
}

class ElementComponent<K extends keyof ElementOptionsTagMap> extends BaseComponent {
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

        if (this.options.tag === 'img') {
            const element = this.asElement()['img'];

            if (this.options.lazy) {
                ImageLoader.register(element, this.options.src);
            } else {
                element.src = this.options.src;
            }
        }

        if (this.options.tag === 'input') {
            const element = this.asElement()['input'];

            element.name = this.options.name;
            element.type = this.options.type;

            if (this.options.checked !== undefined) {
                element.checked = this.options.checked;
            }
        }

        if (this.options.tag === 'label') {
            const element = this.asElement()['label'];

            element.setAttribute('for', this.options.for);
        }

        if (this.options.innerHTML) {
            this.element.innerHTML = this.options.innerHTML;
        }

        if (this.options.onClick) {
            this.element.onclick = event => this.options.onClick(event, this.element);
        }
    }

    private readonly asElement: () => { [K in keyof ElementOptionsTagMap]: HTMLElementTagNameMap[K] } = () => ({
        div: this.element as HTMLDivElement,
        span: this.element as HTMLSpanElement,
        h5: this.element as HTMLHeadingElement,
        label: this.element as HTMLLabelElement,
        img: this.element as HTMLImageElement,
        input: this.element as HTMLInputElement
    });
}

document.element = <K extends keyof ElementOptionsTagMap>(options: ElementOptions<K>): ElementComponent<K> =>
    new ElementComponent(options);

export {};

export interface BaseOptions<K extends keyof HTMLElementTagNameMap> {
    tag: K;
    id: string;
    classes?: string[];
}

export class BaseComponent {
    public element: Element;

    private readonly fragment = new DocumentFragment();
    private children: (Element | BaseComponent)[] = [];

    protected constructor(protected readonly _options: BaseOptions<any>) {}

    public append(child: Element | BaseComponent, ...children: Element[] | BaseComponent[]) {
        this.children.push(child, ...children);
    }

    public render() {
        const element = this.construct();

        this.preRender(element);

        element.append(this.fragment);

        if (this.element) {
            this.element.replaceWith(element);
        }

        this.element = element;
        this.children = [];
    }

    protected preRender(_container: Element) {
        for (const child of this.children) {
            let element: Element;

            if (this.isComponent(child)) {
                child.render();
                element = child.element;
            } else {
                element = child;
            }

            this.fragment.append(element);
        }
    }

    private construct() {
        const container = document.element({
            tag: this._options.tag,
            id: this._options.id,
            classes: this._options.classes
        });

        return container as Element;
    }

    private isComponent(child: string | Node | BaseComponent): child is BaseComponent {
        return child instanceof BaseComponent;
    }
}

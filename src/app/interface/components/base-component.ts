export interface BaseOptions {
    tag: string;
    id: string;
    classes?: string[];
}

export class BaseComponent {
    public element: Element;

    protected readonly fragment = new DocumentFragment();
    protected readonly children: (Element | BaseComponent)[] = [];

    protected constructor(protected readonly _options: BaseOptions) {}

    public append(child: Element | BaseComponent, ...children: Element[] | BaseComponent[]) {
        this.children.push(child, ...children);
    }

    public render() {
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

        const element = this.construct();

        if (this.element) {
            this.element.replaceWith(element);
        }

        this.element = element;
    }

    protected construct() {
        const container = document.createElement(this._options.tag);

        container.id = this._options.id;
        container.append(this.fragment);

        if (this._options.classes?.length) {
            container.classList.add(...this._options.classes);
        }

        return container as Element;
    }

    private isComponent(child: string | Node | BaseComponent): child is BaseComponent {
        return child instanceof BaseComponent;
    }
}

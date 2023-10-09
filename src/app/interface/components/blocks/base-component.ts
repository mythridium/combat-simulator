import { Props } from 'tippy.js';

export interface BaseOptions<K extends keyof HTMLElementTagNameMap> {
    tag: K;
    id: string;
    classes?: string[];
    tooltip?: Partial<Props>;
}

export class BaseComponent {
    public element: HTMLElement;
    protected tooltips: TippyTooltip[] = [];

    private readonly fragment = new DocumentFragment();
    private children: (HTMLElement | BaseComponent)[] = [];

    protected constructor(protected readonly _options: BaseOptions<any>) {}

    public append(
        child: HTMLElement | BaseComponent | HTMLElement[] | BaseComponent[],
        ...children: HTMLElement[] | BaseComponent[]
    ) {
        if (!Array.isArray(child)) {
            child = [child] as HTMLElement[] | BaseComponent[];
        }

        this.children.push(...child, ...children);
    }

    public render() {
        for (const tooltip of this.tooltips) {
            tooltip.destroy();
        }

        const element = this.construct();

        this.preRender(element);

        element.append(this.fragment);

        if (this.element) {
            this.element.replaceWith(element);
        }

        this.element = element;
        this.children = [];

        if (this._options.tooltip) {
            this.tooltips.push(tippy(element, this._options.tooltip));
        }

        this.postRender();
    }

    protected preRender(_container: HTMLElement) {
        for (const child of this.children) {
            let element: HTMLElement;

            if (this.isComponent(child)) {
                child.render();
                element = child.element;
            } else {
                element = child;
            }

            this.fragment.append(element);
        }
    }

    protected postRender() {
        for (const tooltip of this.tooltips) {
            tooltip.setProps({
                hideOnClick: true,
                allowHTML: true,
                delay: 0,
                duration: 0
            });

            if (nativeManager.isMobile) {
                tooltip.setProps({
                    interactive: true,
                    appendTo: () => document.body,
                    onMount(instance) {
                        if (!instance.popper || instance.popper.onclick) {
                            return;
                        }

                        instance.popper.onclick = event => {
                            event.stopPropagation();
                            instance.hide();
                        };
                    }
                });
            }
        }
    }

    private construct() {
        const container = document.createElement(this._options.tag) as HTMLElement;

        if (this._options.id) {
            container.id = this._options.id;
        }

        if (this._options.classes?.length) {
            container.className = this._options.classes.join(' ');
        }

        return container as HTMLElement;
    }

    private isComponent(child: string | Node | BaseComponent): child is BaseComponent {
        return child instanceof BaseComponent;
    }
}

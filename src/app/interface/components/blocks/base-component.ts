import { ComponentSubscriptionManager } from 'src/app/modules/component-subscription-manager';
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
    private isInitialised = false;

    protected constructor(protected readonly _options: BaseOptions<any>) {
        this._init();
    }

    private _init() {
        ComponentSubscriptionManager.set(this);
        this.init();
        ComponentSubscriptionManager.set(undefined);
    }

    protected init() {}

    protected destroy() {
        for (const tooltip of this.tooltips) {
            tooltip.destroy();
        }

        for (const child of this.children) {
            if (this.isComponent(child)) {
                ComponentSubscriptionManager.destroy(child);
                child.destroy();
            }
        }

        this.children = [];
    }

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
        if (!this.isInitialised) {
            this.isInitialised = true;
        } else {
            this.destroy();
        }

        const element = this.construct();

        this.preRender(element);

        element.append(this.fragment);

        if (this.element) {
            this.element.replaceWith(element);
        }

        this.element = element;

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

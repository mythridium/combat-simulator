import { ComponentSubscriptionManager } from 'src/app/modules/component-subscription-manager';
import { Props } from 'tippy.js';

export interface BaseOptions<K extends keyof HTMLElementTagNameMap> {
    tag: K;
    id: string;
    classes?: string[];
    tooltip?: Partial<Props>;
}

type ConstructorOf<C> = { new (...args: any[]): C };

export class BaseComponent {
    public element: HTMLElement;

    protected tooltips: TippyTooltip[] = [];

    private children: (HTMLElement | BaseComponent)[] = [];
    private readonly fragment = new DocumentFragment();
    private isInitialised = false;

    protected constructor(protected readonly _options: BaseOptions<any>) {
        this._init();
    }

    private _init() {
        ComponentSubscriptionManager.set(this);
        this.init();
        ComponentSubscriptionManager.set(undefined);
    }

    protected _destroy() {
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

    protected init() {}
    protected destroy() {}

    public get<T extends BaseComponent>(instance: ConstructorOf<T>): T;
    public get<T extends BaseComponent>(id: string): T;
    public get<T extends BaseComponent>(instanceOrId: ConstructorOf<T> | string) {
        if (typeof instanceOrId === 'string') {
            return this.children.find(child => {
                if (
                    child instanceof BaseComponent &&
                    (child._options.id === instanceOrId || child.element?.id === instanceOrId)
                ) {
                    return child;
                }
            }) as T;
        }

        const child = this.children.find(child => child instanceof instanceOrId);

        return child as T;
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
            this._destroy();
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

    protected construct() {
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

import './tooltip.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/dom';
import { TooltipController } from './tooltip-controller';
import { Global } from 'src/app/global';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-tooltip': Tooltip;
    }
}

@LoadTemplate('app/user-interface/_parts/tooltip/tooltip.html')
export class Tooltip extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _tooltip: HTMLDivElement;
    private readonly _tooltipContent: HTMLDivElement;
    private readonly _arrow: HTMLDivElement;

    private showFor?: HTMLElement;
    private anchorFor?: HTMLElement;
    private cleanUp?: () => void;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-tooltip-template'));

        this._tooltip = getElementFromFragment(this._content, 'mcs-tooltip', 'div');
        this._tooltipContent = getElementFromFragment(this._content, 'mcs-tooltip-content', 'div');
        this._arrow = getElementFromFragment(this._content, 'mcs-tooltip-arrow', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
        TooltipController['tooltip'] = this;

        if (nativeManager.isMobile) {
            this.classList.add('is-mobile');

            let touch = false;

            this._tooltipContent.ontouchend = event => {
                if (touch) {
                    return;
                }

                event.preventDefault();
                this._hide();
            };

            this._tooltipContent.ontouchmove = () => {
                touch = true;
            };

            this._tooltipContent.ontouchstart = () => {
                touch = false;
            };
        }

        window.addEventListener(
            'wheel',
            (event: WheelEvent) => {
                if (!this.showFor && !this.anchorFor) {
                    return;
                }

                if (event.altKey) {
                    event.preventDefault();

                    if (this._isScrollable(this._tooltipContent, event.deltaY > 0)) {
                        this._tooltipContent.scrollBy({ top: event.deltaY });
                    }
                }
            },
            { passive: false }
        );
    }

    public _init(element: HTMLElement, anchor?: HTMLElement) {
        let timeoutId: number | NodeJS.Timeout;

        const events: [string, (event: Event) => void, { passive: boolean }?][] = [
            [
                'click',
                (event: MouseEvent) => {
                    // hide if the element is a button and clicked.
                    if (element.tagName !== 'BUTTON') {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    this._hide();
                }
            ],
            ['mouseover', () => this._show(element, anchor)],
            ['mouseout', () => this._hide()],
            ['focus', () => this._show(element, anchor)],
            [
                'blur',
                () => {
                    // Don't hide if the element blurs but any tooltip element is still hovered.
                    // it would hide the tooltip from another element being hovered
                    if (this.showFor?.matches(':hover')) {
                        return;
                    }

                    this._hide();
                }
            ],
            [
                'touchstart',
                event => {
                    if (!nativeManager.isMobile) {
                        return;
                    }

                    timeoutId = setTimeout(() => {
                        timeoutId = null;
                        event.stopPropagation();
                        this._show(element, anchor);
                    }, 500);
                },
                { passive: false }
            ],
            [
                'touchend',
                () => {
                    if (!nativeManager.isMobile || !timeoutId) {
                        return;
                    }

                    clearTimeout(timeoutId);
                },
                { passive: false }
            ],
            [
                'touchmove',
                () => {
                    if (!nativeManager.isMobile || !timeoutId) {
                        return;
                    }

                    clearTimeout(timeoutId);
                },
                { passive: false }
            ],
            [
                'contextmenu',
                event => {
                    if (!nativeManager.isMobile) {
                        return;
                    }

                    event.preventDefault();
                }
            ]
        ];

        for (const [event, listener, options] of events) {
            element.addEventListener(event, listener, options);
        }
    }

    public _trigger() {
        if (this.showFor) {
            this._update(this.showFor, this.anchorFor);
        }
    }

    public _update(element: HTMLElement, anchor?: HTMLElement) {
        if (element.dataset.mcstooltipdisabled != null) {
            this._hide();
            return;
        }

        if (this._tooltip.style.display !== 'block') {
            return;
        }

        if (element !== this.showFor) {
            return;
        }

        try {
            this._tooltipContent.innerHTML = element.querySelector('[data-mcsTooltipContent]')?.innerHTML ?? '';
        } catch (exception) {
            Global.logger.error(`Failed to update tooltip content.`, element, exception);
        }

        computePosition(anchor ?? element, this._tooltip, {
            placement: 'top',
            middleware: [offset(6), flip(), shift({ padding: 5 }), arrow({ element: this._arrow })]
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(this._tooltip.style, {
                left: `${x}px`,
                top: `${y}px`
            });

            const { x: arrowX, y: arrowY } = middlewareData.arrow;

            const staticSide = {
                top: 'bottom',
                right: 'left',
                bottom: 'top',
                left: 'right'
            }[placement.split('-')[0]];

            Object.assign(this._arrow.style, {
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                right: '',
                bottom: '',
                [staticSide]: '-4px',
                ...this._getArrowBorder(staticSide)
            });
        });
    }

    public _hide() {
        this._tooltip.style.display = '';
        this.showFor = undefined;
        this.anchorFor = undefined;

        if (this.cleanUp) {
            this.cleanUp();
            this.cleanUp = undefined;
        }
    }

    private _isScrollable(element: HTMLElement, down: boolean) {
        const isScrollable =
            element.scrollHeight > element.clientHeight &&
            ['scroll', 'auto'].indexOf(getComputedStyle(element).overflowY) >= 0;

        if (isScrollable) {
            if (!down && element.scrollTop === 0) {
                return false;
            }

            if (down && element.scrollTop + element.clientHeight >= element.scrollHeight - 3) {
                return false;
            }
        }

        return isScrollable;
    }

    private _show(element: HTMLElement, anchor?: HTMLElement) {
        if (element.dataset.mcstooltipdisabled != null) {
            return;
        }

        this.showFor = element;
        this.anchorFor = anchor;
        this._tooltip.style.display = 'block';
        this._update(element, anchor);

        this.cleanUp = autoUpdate(anchor ?? element, this._tooltip, () => this._update(element, anchor));
    }

    private _getArrowBorder(placement: string) {
        const border = 'solid 1px #b3b3b3';

        const borders = {
            borderTop: '',
            borderBottom: '',
            borderLeft: '',
            borderRight: ''
        };

        switch (placement) {
            case 'top':
                borders.borderTop = border;
                borders.borderLeft = border;
                break;
            case 'bottom':
                borders.borderBottom = border;
                borders.borderRight = border;
                break;
            case 'left':
                borders.borderLeft = border;
                borders.borderBottom = border;
                break;
            case 'right':
                borders.borderTop = border;
                borders.borderRight = border;
                break;
        }

        return borders;
    }
}

customElements.define('mcs-tooltip', Tooltip);

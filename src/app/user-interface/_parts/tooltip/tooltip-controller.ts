import type { Main } from 'src/app/user-interface/main/main';
import { Tooltip } from './tooltip';

export abstract class TooltipController {
    private static tooltip: Tooltip;

    public static init(element: HTMLElement, anchor?: HTMLElement) {
        this.tooltip._init(element, anchor);
    }

    public static initAll(main: Main) {
        const tooltips = main.querySelectorAll<HTMLElement>('[data-mcsTooltip]');

        for (const tooltip of Array.from(tooltips)) {
            this.tooltip._init(tooltip);
        }
    }

    public static trigger() {
        this.tooltip._trigger();
    }

    public static update(element: HTMLElement, anchor?: HTMLElement) {
        this.tooltip._update(element, anchor);
    }

    public static hide() {
        this.tooltip._hide();
    }
}

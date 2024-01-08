import { Tippy } from 'tippy.js';

declare global {
    const tippy: TippyGlobal;

    interface Element {
        _tippy?: TippyTooltip;
    }

    interface WorkerGlobalScope {
        tippy: TippyGlobal;
    }

    interface TippyGlobal extends Tippy {
        hideAll: () => void;
    }
}

export {};

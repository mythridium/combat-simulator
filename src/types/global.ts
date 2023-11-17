import { Tippy, CreateSingleton, HideAll } from 'tippy.js';

declare global {
    const tippy: TippyGlobal;

    interface Element {
        _tippy?: TippyTooltip;
    }

    interface WorkerGlobalScope {
        tippy: TippyGlobal;
    }

    interface TippyGlobal extends Tippy {
        hideAll: HideAll;
        createSingleton: CreateSingleton;
    }
}

export {};

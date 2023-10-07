import { Tippy } from 'tippy.js';

declare global {
    interface MythCombatSimulator {
        isDebug: boolean;
        isVerbose: boolean;
    }

    interface Window {
        mcs: MythCombatSimulator;
    }

    interface WorkerGlobalScope {
        mcs: MythCombatSimulator;
        tippy: Tippy;
    }

    const tippy: Tippy;

    interface Element {
        _tippy?: TippyTooltip;
    }
}

self.mcs = {
    isDebug: false,
    isVerbose: false
};

export {};

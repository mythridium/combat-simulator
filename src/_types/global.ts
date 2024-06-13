import { Tippy, CreateSingleton, HideAll } from 'tippy.js';
import type { Global as GlobalClient } from 'src/app/global';
import type { Global as GlobalWorker } from 'src/worker/global';

declare global {
    interface Constants {
        isDebug: boolean;
        isVerbose: boolean;
        global: GlobalClient | GlobalWorker;
        modifierDiff?: () => any;
    }

    const tippy: TippyGlobal;

    interface Element {
        _tippy?: TippyTooltip;
    }

    interface Window {
        mcs: Constants;
    }

    interface WorkerGlobalScope {
        mcs: Constants;
        tippy: TippyGlobal;
    }

    interface TippyGlobal extends Tippy {
        hideAll: HideAll;
        createSingleton: CreateSingleton;
    }
}

export {};

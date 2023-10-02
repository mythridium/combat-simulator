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
    }
}

self.mcs = {
    isDebug: false,
    isVerbose: false
};

export {};

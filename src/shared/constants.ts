declare global {
    interface MythCombatSimulator {
        isDebug: boolean;
        isVerbose: boolean;
    }

    interface Window {
        mcs: MythCombatSimulator;
    }

    interface Worker {
        mcs: MythCombatSimulator;
    }
}

self.mcs = {
    isDebug: false,
    isVerbose: false
};

export {};

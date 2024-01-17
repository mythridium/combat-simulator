declare global {
    interface Constants {
        isDebug: boolean;
        isVerbose: boolean;
    }

    interface Window {
        mcs: Constants;
    }

    interface WorkerGlobalScope {
        mcs: Constants;
    }
}

export {};

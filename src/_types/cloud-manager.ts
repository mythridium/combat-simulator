declare global {
    interface CloudManager {
        hasFullVersionEntitlement: boolean;
        hasTotHEntitlement: boolean;
        hasAoDEntitlement: boolean;
        hasExpansionEntitlement: boolean;
        isTest: boolean;
    }

    const cloudManager: CloudManager;

    interface Window {
        cloudManager: CloudManager;
    }

    interface WorkerGlobalScope {
        cloudManager: CloudManager;
    }
}

export {};

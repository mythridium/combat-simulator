declare global {
    interface CloudManager {
        hasFullVersionEntitlement: boolean;
        hasTotHEntitlement: boolean;
        hasAoDEntitlement: boolean;
        isTest: boolean;
        isBirthdayEvent2023Active(): boolean;
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

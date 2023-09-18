declare global {
    interface CloudManager {
        hasFullVersionEntitlement: boolean;
        hasTotHEntitlement: boolean;
        hasAoDEntitlement: boolean;
        isTest: boolean;
    }

    const cloudManager: CloudManager;

    interface Window {
        cloudManager: CloudManager;
    }
}

export {};

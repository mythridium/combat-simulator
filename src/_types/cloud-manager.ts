declare global {
    interface CloudManager {
        hasFullVersionEntitlement: boolean;
        hasTotHEntitlement: boolean;
        hasTotHEntitlementAndIsEnabled: boolean;
        hasAoDEntitlement: boolean;
        hasAoDEntitlementAndIsEnabled: boolean;
        hasItAEntitlement: boolean;
        hasItAEntitlementAndIsEnabled: boolean;
        hasExpansionEntitlement: boolean;
        hasExpansionEntitlementAndIsEnabled: boolean;
        isAprilFoolsEvent2024Active: () => boolean;
        isBirthdayEvent2023Active: () => boolean;
        isTest: boolean;
        log: () => void;
        setStatus: () => void;
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

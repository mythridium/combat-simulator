declare global {
    interface CloudManager {
        hasFullVersionEntitlement: boolean;
        hasTotHEntitlement: boolean;
        hasTotHEntitlementAndIsEnabled: boolean;
        hasAoDEntitlement: boolean;
        hasAoDEntitlementAndIsEnabled: boolean;
        hasExpansionEntitlement: boolean;
        hasExpansionEntitlementAndIsEnabled: boolean;
        isBeta: boolean;
        isTest: boolean;
        isOnAuthPage: boolean;
        isBirthdayEvent2023Active(): boolean;
        isAprilFoolsEvent2024Active(): boolean;
        currentGamemodeId?: string;
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

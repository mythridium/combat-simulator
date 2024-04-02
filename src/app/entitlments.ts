export abstract class Entitlments {
    public static get full() {
        return cloudManager.hasFullVersionEntitlement;
    }

    public static get toth() {
        return cloudManager.hasTotHEntitlement;
    }

    public static get tothEnabled() {
        return this.toth && cloudManager.hasTotHEntitlementAndIsEnabled !== false;
    }

    public static get aod() {
        return cloudManager.hasAoDEntitlement;
    }

    public static get aodEnabled() {
        return this.aod && cloudManager.hasAoDEntitlementAndIsEnabled !== false;
    }

    public static get aprilFools() {
        if (cloudManager.isAprilFoolsEvent2024Active === undefined) {
            return false;
        }

        if (typeof cloudManager.isAprilFoolsEvent2024Active === 'function') {
            return cloudManager.isAprilFoolsEvent2024Active();
        }

        return cloudManager.isAprilFoolsEvent2024Active;
    }
}

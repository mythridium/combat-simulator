export interface SkillData {
    localId: string;
    name: string;
}

export interface InitRequest {
    origin: string;
    scripts: string[];
    entitlements: {
        full: boolean;
        toth: boolean;
        aod: boolean;
    };
    dataPackages: [DataNamespace, GameDataPackage, SkillData | undefined][];
    modifierData: string;
}

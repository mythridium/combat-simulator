export interface InitRequest {
    workerId: number;
    origin: string;
    scripts: string[];
    entitlements: {
        full: boolean;
        toth: boolean;
        aod: boolean;
    };
    dataPackages: [DataNamespace, GameDataPackage][];
    skills: [string, DataNamespace][];
}

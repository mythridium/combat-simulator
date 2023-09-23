export interface InitRequest {
    workerId: number;
    origin: string;
    scripts: string[];
    entitlements: {
        full: boolean;
        toth: boolean;
        aod: boolean;
    };
    modDataPackages: [DataNamespace, GameDataPackage][];
}

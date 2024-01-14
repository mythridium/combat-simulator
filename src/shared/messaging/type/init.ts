export interface InitRequest {
    origin: string;
    scripts: string[];
    html: string;
    entitlements: {
        full: boolean;
        toth: boolean;
        aod: boolean;
    };
    moddedModifierData: string;
}

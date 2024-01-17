export interface InitRequest {
    origin: string;
    scripts: string[];
    entitlements: {
        toth: boolean;
        aod: boolean;
    };
}

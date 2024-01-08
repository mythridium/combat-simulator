export interface InitRequest {
    origin: string;
    scripts: string[];
    entitlements: {
        full: boolean;
        toth: boolean;
        aod: boolean;
    };
}

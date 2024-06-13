export type PackageTypes = 'Demo' | 'Full' | 'TotH' | 'AoD' | 'ItA' | 'AprilFools2024';

export type IDataPackage = {
    [packageName in PackageTypes]?: any;
};

export type PackageTypes = 'Demo' | 'Full' | 'TotH' | 'AoD';

export type IDataPackage = {
    [packageName in PackageTypes]?: any;
};

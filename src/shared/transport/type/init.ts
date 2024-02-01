import { IDataPackage } from 'src/shared/_types/data-package';

export interface InitRequest {
    origin: string;
    scripts: string[];
    entitlements: {
        toth: boolean;
        aod: boolean;
    };
    gameData: GameData;
}

export interface GameData {
    slayerTaskData: SlayerTaskData[];
    dataPackage: IDataPackage;
    summoningMarkLevels: number[];
    namespaces: DataObject;
    gamemodes: DataObject;
    agilityActions: DataObject;
    agilityPillars: DataObject;
    agilityElitePillars: DataObject;
}

export interface DataObject {
    [key: string]: string;
}

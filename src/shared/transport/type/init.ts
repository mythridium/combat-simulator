import { GamemodeModifiedData } from 'src/shared/converter/gamemode';

export interface InitRequest extends InitGameData {
    origin: string;
    scripts: string[];
    entitlements: {
        toth: boolean;
        aod: boolean;
        ita: boolean;
        aprilFools2024: boolean;
        birthday2023: boolean;
    };
}

export interface InitGameData {
    currentGamemodeId: string;
    dataPackage: GameDataPackage[];
    skills: { name: string; namespace: DataNamespace; media: string }[];
    namespaces: DataNamespace[];
    gamemodes: GamemodeModifiedData[];
}

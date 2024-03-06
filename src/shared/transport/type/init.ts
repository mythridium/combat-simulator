import { AgilityConvertedData } from 'src/shared/converter/agility';
import { GamemodeConvertedData } from 'src/shared/converter/gamemode';

export interface InitRequest extends InitGameData {
    origin: string;
    scripts: string[];
    entitlements: {
        toth: boolean;
        aod: boolean;
    };
    modifierData: string;
}

export interface InitGameData {
    dataPackage: GameDataPackage[];
    skills: { name: string; namespace: DataNamespace; media: string }[];
    namespaces: DataNamespace[];
    agility: AgilityConvertedData;
    gamemodes: GamemodeConvertedData[];
}

import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { MICSR } from 'src/shared/micsr';
import { Simulation } from './simulation';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger({ entity: 'Client', color: Color.Green });
    public static context: Modding.ModContext;
    public static simulation: Simulation;
    public static micsr: MICSR;

    public static skills: { name: string; namespace: DataNamespace }[] = [];
    public static dataPackages: GameDataPackage[] = [];
}

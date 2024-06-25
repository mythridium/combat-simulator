import { SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { Simulation } from './simulation';
import { UserInterface } from './user-interface/user-interface';
import { PlotterStore } from './stores/plotter.store';
import { GameStore } from './stores/game.store';
import { SimulatorStore } from './stores/simulator.store';
import { SimGame } from 'src/shared/simulator/sim-game';
import { MICSR } from 'src/shared/micsr';
import { StatsStore } from './stores/stats.store';
import { EquipmentStore } from './stores/equipment.store';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger({ entity: 'Client', color: Color.Green });
    public static context: Modding.ModContext;
    public static simulation: Simulation;

    public static loaded: (result: boolean) => void;
    public static isLoaded = new Promise<boolean>(resolve => {
        this.loaded = resolve;
    });

    public static micsr: MICSR;
    public static game: SimGame;
    public static melvor: Game;

    public static stores = {
        plotter: new PlotterStore(),
        game: new GameStore(),
        simulator: new SimulatorStore(),
        equipment: new EquipmentStore(),
        stats: new StatsStore()
    };

    public static userInterface: UserInterface;
    public static templates: string[] = [];

    public static skills: { name: string; namespace: DataNamespace; media: string }[] = [];
    public static dataPackages: GameDataPackage[] = [];
}

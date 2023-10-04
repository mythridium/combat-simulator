import { Color, Logger } from 'src/shared/logger';
import type { SimGame } from './simulator/sim-game';
import { ConfigurationStore } from 'src/shared/stores/configuration.store';
import { EquipmentStore } from 'src/shared/stores/equipment.store';

declare global {
    interface Window {
        glo: typeof Global;
    }
}

export abstract class Global {
    public static logger = new Logger(self.name, Color.Pink);

    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static game: SimGame;

    public static configuration = new ConfigurationStore();
    public static equipment = new EquipmentStore();
}

// make it easy to debug global object in dev tools.
if (self.mcs.isDebug || self.mcs.isVerbose) {
    self.glo = Global;
}

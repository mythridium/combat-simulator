import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { MICSR } from 'src/shared/micsr';
import type { SimGame } from 'src/shared/simulator/sim-game';
import { Transport } from 'src/shared/transport/transport';
import { Simulator } from './simulator';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger({ entity: 'Worker', color: Color.Pink });
    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static transport = new Transport(this.this, this.logger);
    public static game: SimGame;
    public static micsr: MICSR;
    public static simulator: Simulator;
}

import { Color, Logger } from 'src/shared/logger';
import type { SimGame } from './simulator/sim-game';

export abstract class Global {
    public static logger = new Logger('Worker', Color.Pink);

    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static game: SimGame;
}

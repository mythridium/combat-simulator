import { SimGame } from './simulator/sim-game';

export abstract class Global {
    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static game: SimGame;
}

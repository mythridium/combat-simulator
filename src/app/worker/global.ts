import type { SimGame } from 'src/app/sim-game';

export abstract class Global {
    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static game: SimGame;
}

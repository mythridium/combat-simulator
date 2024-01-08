import { Constants } from 'src/shared/constants';
import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import type { SimGame } from './melvor/sim-game';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger('Worker', Color.Pink, Constants.isDebug);
    public static this: WorkerGlobalScope & typeof globalThis = <any>self;

    public static game: SimGame;
}

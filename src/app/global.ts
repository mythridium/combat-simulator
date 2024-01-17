import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { WebWorker } from './worker/web-worker';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger({ entity: 'Client', color: Color.Green });
    public static context: Modding.ModContext;
    public static worker: WebWorker;
}

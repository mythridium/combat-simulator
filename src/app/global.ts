import { Constants } from 'src/shared/constants';
import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { WebWorker } from './worker/web-worker';

export abstract class Global extends SharedGlobal {
    public static context: Modding.ModContext;
    public static logger = new Logger('Client', Color.Green, Constants.isDebug);
    public static worker: WebWorker;
}

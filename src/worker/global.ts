import { Global as SharedGlobal } from 'src/shared/global';
import { Color, Logger } from 'src/shared/logger';
import { Transport } from 'src/shared/transport/transport';

export abstract class Global extends SharedGlobal {
    public static logger = new Logger({ entity: 'Worker', color: Color.Pink });
    public static this: WorkerGlobalScope & typeof globalThis = <any>self;
    public static transport = new Transport(this.this, this.logger);
}

import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { WebWorker } from './worker';
import { Global } from './global';

class Setup {
    private readonly logger = new Logger('Worker', Color.Pink);
    private readonly worker: WebWorker;

    constructor() {
        this.worker = new WebWorker(Global.this, this.logger);
    }
}

new Setup();

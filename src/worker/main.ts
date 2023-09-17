import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { WebWorker } from './worker';

class Setup {
    private readonly logger = new Logger('Worker <no id>', Color.Pink);
    private readonly worker: WebWorker;

    constructor() {
        this.worker = new WebWorker(<Worker>(<unknown>self), this.logger);
        this.logger.log('Worker Loaded');
    }
}

new Setup();

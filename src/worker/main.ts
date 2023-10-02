import 'src/shared/constants';
import { WebWorker } from './worker';
import { Global } from './global';

class Setup {
    private readonly worker: WebWorker;

    constructor() {
        this.worker = new WebWorker(Global.this);
    }
}

new Setup();

import 'src/shared/constants';
import { Workers } from './workers/workers';
import { Interface } from './interface/interface';
import { ModalQueue } from './interface/modules/modal-queue';
import { Mods } from './modules/mods';
import { Global } from './global';
import { Source } from 'src/shared/stores/sync.store';

export class App {
    private readonly modalQueue: ModalQueue;
    private readonly mods: Mods;

    private workers: Workers;
    private interface: Interface;

    constructor(private readonly context: Modding.ModContext) {
        this.modalQueue = new ModalQueue(this.context);
        this.mods = new Mods(this.context, this.modalQueue);
        this.mods.setup();

        this.context.onInterfaceReady(async () => {
            if (localStorage.getItem('mcs-use-max-cpu')) {
                Global.workers.setState(Source.Default, { useMaxCPU: true });
            }

            await this.mods.init();

            Global.logger.log('Client Loaded');

            this.workers = new Workers(this.context, this.mods, this.modalQueue);
            this.interface = new Interface(this.context, this.workers);

            const isInitialised = await this.workers.init();

            if (isInitialised) {
                this.interface.init();
            }
        });
    }
}

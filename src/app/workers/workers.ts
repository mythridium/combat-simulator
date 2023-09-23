import { Logger } from 'src/shared/logger';
import { WebWorker } from './web-worker';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { MessageAction, MessageRequest } from 'src/shared/messages/message';
import { GameState } from 'src/app/state/game';
import { Source } from 'src/shared/stores/sync.store';

export class Workers {
    public get primary() {
        return this.workers[0];
    }

    public readonly url: string;
    private readonly workers: WebWorker[] = [];

    constructor(
        private readonly context: Modding.ModContext,
        private readonly logger: Logger,
        private readonly state: GameState
    ) {
        this.url = this.context.getResourceUrl('src/worker.mjs');
        const threads = Math.max(navigator.hardwareConcurrency - 1, 1);

        for (let i = 0; i < threads; i++) {
            const worker = new WebWorker(this.url, this.logger);
            this.workers.push(worker);
        }

        this.state.player.when(Source.Interface).subscribe(async () => {
            await this.primary.send({ action: MessageAction.State, data: { player: this.state.player.raw() } });
        });
    }

    public async init(payload: Omit<InitRequest, 'workerId'>) {
        let isSuccess = false;

        try {
            const requests = this.workers.map(async (worker, index) => {
                const data: InitRequest = { workerId: index + 1, ...payload };
                return worker.send({ action: MessageAction.Init, data });
            });

            await Promise.all(requests);
            isSuccess = true;
        } catch (exception) {
            this.logger.error(exception);

            addModalToQueue({
                title: `[Myth] Combat Simulator`,
                html: `
                    <h5 class="font-w400 text-combat-smoke font-size-sm mb-1">Oops! An error occurred during startup.</h5>
                    <h5 class="font-w600 text-combat-smoke font-size-sm mt-3 mb-1">Please copy the following information and create a new issue</h5>
                    <h5 class="font-w600 text-combat-smoke font-size-sm mt-2"><a href="https://github.com/mythridium/combat-simulator/issues" target="_blank">GitHub <span class="font-size-xs">(opens in new tab)</span></a></h5>
                    <div class="form-group">
                        <textarea class="text-danger form-control" id="combat-simulator-init-exception" rows="12" onclick="this.select();">
Mod Version: ${this.context.version}

${exception.stack}</textarea>
                    </div>
                    `,
                allowOutsideClick: false,
                showCancelButton: false
            });
        }

        return isSuccess;
    }

    public async send<K extends MessageAction>(message: MessageRequest<K>) {
        const requests = this.workers.map(async worker => worker.send(message));

        await Promise.all(requests);
    }
}

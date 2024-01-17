import 'src/shared/constants';
import { Global } from './global';
import { MessageAction } from 'src/shared/transport/message';

export abstract class Main {
    public static async init() {
        Global.transport.on(MessageAction.Init, async data => {
            const duration = await Global.time(async () => {
                Global.logger.log(`Received init data`, data);
            });

            Global.logger.log(`Initialised in ${duration} ms`);
        });
    }
}

import 'src/shared/constants';
import { Global } from './global';
import { MessageAction } from 'src/shared/transport/message';
import { WorkerMock } from './context/mock';
import { Environment } from './context/environment';
import { RequirementConverter } from 'src/shared/converter/requirement';

export abstract class Main {
    public static async init() {
        Global.transport.on(MessageAction.Init, async data => {
            const duration = await Global.time(async () => {
                WorkerMock.init();
                await Environment.init(data);
            });

            Global.logger.log(`Initialised in ${duration} ms`);
        });

        Global.transport.on(MessageAction.Simulate, async data => {
            const start = performance.now();

            const result = await Global.simulator.simulateMonster(
                data.monsterId,
                data.dungeonId,
                data.trials,
                data.maxTicks
            );

            return { monsterId: data.monsterId, dungeonId: data.dungeonId, result, time: performance.now() - start };
        });

        Global.transport.on(MessageAction.Cancel, async () => Global.simulator.cancelSimulation());

        Global.transport.on(
            MessageAction.CheckRequirements,
            async ({ requirements, notifyOnFailure, slayerLevelReq, checkSlayer }) => {
                return Global.game.checkRequirements(
                    RequirementConverter.fromData(Global.game, requirements),
                    notifyOnFailure,
                    slayerLevelReq,
                    checkSlayer
                );
            }
        );
    }
}

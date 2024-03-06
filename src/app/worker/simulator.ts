import { MessageAction } from 'src/shared/transport/message';
import { InitPayload } from './payload/init';
import { WebWorker } from './web-worker';
import { SimulateRequest } from 'src/shared/transport/type/simulate';
import { Global } from 'src/app/global';
import { AgilityConverter } from 'src/shared/converter/agility';
import { GamemodeConverter } from 'src/shared/converter/gamemode';

export class Simulator {
    private readonly worker = new WebWorker();

    public init() {
        const payload = new InitPayload();

        return this.worker.send({
            action: MessageAction.Init,
            data: {
                origin: payload.origin,
                scripts: payload.scripts,
                entitlements: {
                    toth: cloudManager.hasTotHEntitlement,
                    aod: cloudManager.hasAoDEntitlement
                },
                modifierData: payload.modifierData,
                dataPackage: Global.dataPackages,
                skills: Global.skills,
                namespaces: Array.from(game.registeredNamespaces.registeredNamespaces.values()).filter(
                    namespace => namespace.isModded
                ),
                agility: AgilityConverter.toData(
                    game.agility.actions.allObjects,
                    game.agility.pillars.allObjects,
                    game.agility.elitePillars.allObjects
                ),
                gamemodes: game.gamemodes.allObjects.map(gamemode => GamemodeConverter.toData(gamemode))
            }
        });
    }

    public simulate(request: SimulateRequest) {
        return this.worker.send({
            action: MessageAction.Simulate,
            data: {
                monsterId: request.monsterId,
                dungeonId: request.dungeonId,
                saveString: request.saveString,
                trials: request.trials,
                maxTicks: request.maxTicks
            }
        });
    }

    public cancel() {
        return this.worker.send({ action: MessageAction.Cancel, data: undefined });
    }
}

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
                    toth: cloudManager.hasTotHEntitlementAndIsEnabled,
                    aod: cloudManager.hasAoDEntitlementAndIsEnabled,
                    ita: cloudManager.hasItAEntitlementAndIsEnabled,
                    aprilFools2024: cloudManager.isAprilFoolsEvent2024Active(),
                    birthday2023: cloudManager.isBirthdayEvent2023Active()
                },
                dataPackage: Global.dataPackages,
                skills: Global.skills,
                namespaces: Array.from(Global.melvor.registeredNamespaces.registeredNamespaces.values()).filter(
                    namespace => namespace.isModded
                ),
                agility: AgilityConverter.toData(
                    Global.melvor.agility.actions.allObjects,
                    Global.melvor.agility.pillars.allObjects
                ),
                gamemodes: Global.melvor.gamemodes.allObjects
                    .filter(gamemode => gamemode.id !== 'melvorD:Unset')
                    .map(gamemode => GamemodeConverter.toData(gamemode)),
                currentGamemodeId: Global.melvor.currentGamemode.id
            }
        });
    }

    public simulate(request: SimulateRequest) {
        return this.worker.send({
            action: MessageAction.Simulate,
            data: {
                monsterId: request.monsterId,
                entityId: request.entityId,
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

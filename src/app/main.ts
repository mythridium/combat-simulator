import 'src/shared/constants';
import { Color, Logger } from 'src/shared/logger';
import { Scripts } from './workers/scripts';
import { Workers } from './workers/workers';
import { Interface } from './interface/interface';
import { GameState } from './state/game';
import { ModalQueue } from './interface/modal-queue';

export class App {
    private readonly logger = new Logger('Client', Color.Green);

    private workers: Workers;
    private interface: Interface;
    private modalQueue: ModalQueue;

    private readonly namespacesSeenLoading: string[] = [];
    private readonly modDataPackages: [DataNamespace, GameDataPackage][] = [];

    constructor(private readonly context: Modding.ModContext, private readonly game: Game) {
        this.modalQueue = new ModalQueue(this.context);

        this.context
            .patch(NamespaceMap, 'registerNamespace')
            .after((_, name: string, _displayName: string, isModded: boolean) => {
                if (isModded) {
                    this.namespacesSeenLoading.push(name);
                }
            });

        this.context.patch(Game, 'registerDataPackage').after((_, dataPackage) => {
            const namespace = this.game.registeredNamespaces.getNamespace(dataPackage.namespace);

            if (namespace.isModded) {
                this.modDataPackages.push([namespace, dataPackage]);
            }
        });

        this.context.onInterfaceReady(async () => {
            this.startupCheck();
            this.logger.log('Client Loaded');

            const state = new GameState();

            this.workers = new Workers(this.context, this.logger, this.modalQueue, state);
            this.interface = new Interface(state, this.game);

            await this.init();
        });
    }

    private startupCheck() {
        const exclude: string[] = ['creatorToolkit', 'mythCombatSimulator'];
        const loadedNamespacesNotSeen = Array.from(this.game.registeredNamespaces.registeredNamespaces.entries())
            .filter(
                ([name, namespace]) =>
                    namespace.isModded && !this.namespacesSeenLoading.includes(name) && !exclude.includes(name)
            )
            .map(([_name, namespace]) => namespace.displayName);

        if (loadedNamespacesNotSeen.length) {
            const message = `<span class="text-warning">Make sure Combat Simulator is at the TOP of your mod list.
                             <br /><br/>
                             The following mods will not have any data in the Combat Simulator.</span>
                             <br /><br />`;

            this.modalQueue.add(
                `${message}<span class="text-combat-smoke">${loadedNamespacesNotSeen.join(', ')}</span>`
            );
        }
    }

    private async init() {
        let origin = location.origin;

        if (cloudManager.isTest) {
            origin += '/lemvorIdle';
        }

        const isInitialised = await this.workers.init({
            scripts: Scripts.getScriptsForWorker(),
            origin,
            entitlements: {
                full: cloudManager.hasFullVersionEntitlement,
                toth: cloudManager.hasTotHEntitlement,
                aod: cloudManager.hasAoDEntitlement
            },
            modDataPackages: this.modDataPackages
        });

        if (isInitialised) {
            this.interface.init();
        }
    }
}

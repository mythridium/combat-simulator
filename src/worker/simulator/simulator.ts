import { SummaryStore } from 'src/shared/stores/summary.store';
import { Environment } from './environment';
import { Messages } from 'src/shared/messages/messages';
import { MessageAction } from 'src/shared/messages/message';
import { Source } from 'src/shared/stores/sync.store';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { Global } from 'src/worker/global';

export class Simulator {
    public readonly summaryStore = new SummaryStore();

    private readonly environment = new Environment();

    constructor(private readonly messages: Messages) {}

    public async init(data: InitRequest) {
        await this.environment.init(data);

        this.messages.on(MessageAction.State, async data => {
            Global.game.combat.player.computeAllStats();

            const stats = Global.game.combat.player.stats;

            this.summaryStore.setState(Source.Worker, {
                attackInterval: stats.attackInterval,
                accuracy: stats.accuracy,
                damageReduction: stats.damageReduction,
                evasion: {
                    melee: stats.evasion.melee,
                    ranged: stats.evasion.ranged,
                    magic: stats.evasion.magic
                },
                maxHitpoints: stats.maxHitpoints,
                maxHit: stats.maxHit,
                minHit: stats.minHit,
                summoningMaxHit: stats.summoningMaxHit,
                autoEatThreshold: Global.game.combat.player.autoEatThreshold,
                dropDoublingPercentage: Global.game.combat.player.modifiers.combatLootDoubleChance,
                gpMultiplier: Global.game.combat.player.modifiers.increasedCombatGP
            });

            return this.summaryStore.getState();
        });

        this.messages.on(MessageAction.Simulate, data => Global.game.combat.simulate(data));
    }
}

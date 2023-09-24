import { SummaryStore } from 'src/shared/stores/summary.store';
import { Environment } from './environment';
import { Messages } from 'src/shared/messages/messages';
import { MessageAction } from 'src/shared/messages/message';
import { Source } from 'src/shared/stores/sync.store';
import { InitRequest } from 'src/shared/messages/message-type/init';

export class Simulator {
    public readonly summaryStore = new SummaryStore();

    private readonly environment = new Environment();

    constructor(private readonly messages: Messages) {}

    public async init(data: InitRequest) {
        await this.environment.init(data);

        this.messages.on(MessageAction.State, async data => {
            console.log(data);
            this.environment.game.combat.player.computeAllStats();

            const stats = this.environment.game.combat.player.stats;

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
                autoEatThreshold: this.environment.game.combat.player.autoEatThreshold,
                dropDoublingPercentage: this.environment.game.combat.player.modifiers.combatLootDoubleChance,
                gpMultiplier: this.environment.game.combat.player.modifiers.increasedCombatGP
            });

            return this.summaryStore.raw();
        });
    }
}

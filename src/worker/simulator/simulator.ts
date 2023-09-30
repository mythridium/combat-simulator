import { SummaryStore } from 'src/shared/stores/summary.store';
import { Environment } from './environment';
import { Messages } from 'src/shared/messages/messages';
import { MessageAction } from 'src/shared/messages/message';
import { Source } from 'src/shared/stores/sync.store';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { Global } from 'src/worker/global';
import { Logger } from 'src/shared/logger';

export class Simulator {
    public readonly summaryStore = new SummaryStore();

    private readonly environment = new Environment();

    constructor(private readonly messages: Messages, private readonly logger: Logger) {}

    public async init(data: InitRequest) {
        await this.environment.init(data);

        this.messages.on(MessageAction.State, async data => {
            console.log(data);
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
                autoEatThreshold: game.combat.player.autoEatThreshold,
                dropDoublingPercentage: game.combat.player.modifiers.combatLootDoubleChance,
                gpMultiplier: game.combat.player.modifiers.increasedCombatGP
            });

            return this.summaryStore.raw();
        });

        this.messages.on(MessageAction.Simulate, async () => {
            const monster = Global.game.monsters.getObjectByID('melvorD:Plant');
            const combatArea = Global.game.combatAreas.getObjectByID('melvorD:Farmlands');

            Global.game.combat.selectMonster(monster, combatArea);

            let tickCount = 0;

            while (tickCount <= 1000) {
                if (!Global.game.combat.isActive && !Global.game.combat.spawnTimer.active) {
                    Global.game.combat.selectMonster(monster, combatArea);
                }

                if (Global.game.combat.paused) {
                    Global.game.combat.resumeDungeon();
                }

                Global.game.combat.passiveTick();
                Global.game.combat.activeTick();
                Global.game.combat.checkDeath();
                tickCount++;
            }

            Global.game.combat.endFight();
            if (Global.game.combat.spawnTimer.isActive) {
                Global.game.combat.spawnTimer.stop();
            }

            if (Global.game.combat.enemy.state !== EnemyState.Dead) {
                Global.game.combat.enemy.processDeath();
            }

            Global.game.combat.loot.removeAll();
            Global.game.combat.selectedArea = undefined;

            if (Global.game.combat.paused) {
                Global.game.combat.paused = false;
            }

            this.logger.log(`Finished ${tickCount} ticks while fighting ${monster.id}`);
            this.logger.log(Global.game.customGp);
        });
    }
}

import 'src/shared/constants';
import { Global } from './global';
import { MessageAction } from 'src/shared/transport/message';
import { WorkerMock } from './context/mock';
import { Environment } from './context/environment';
import { RequirementConverter } from 'src/shared/converter/requirement';
import { OutOfCombatStats } from 'src/shared/_types/out-of-combat-stats';

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
                '',
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

        Global.transport.on(MessageAction.Update, async ({ key, model }) => {
            (<any>Global.stores)[key].update(model);

            Global.game.combat.player.computeAllStats();

            return this.outOfCombatStats();
        });

        Global.transport.on(MessageAction.Import, async data => {
            for (const [key, value] of Object.entries(data)) {
                (<any>Global.stores)[key].update(value);
            }

            Global.game.combat.player.computeAllStats();

            return this.outOfCombatStats();
        });
    }

    private static outOfCombatStats(): OutOfCombatStats {
        const stats = Global.game.combat.player.stats;

        return {
            attackInterval: stats.attackInterval,
            summoningInteval: Global.game.combat.player.summonAttackInterval,
            respawnInterval: Global.game.combat.player.getMonsterSpawnTime(),
            accuracy: stats.accuracy,
            damageReduction: stats.damageReduction,
            uncappedDamageReduction:
                Global.game.combat.player.equipmentStats.damageReduction +
                Global.game.combat.player.modifiers.increasedDamageReduction -
                Global.game.combat.player.modifiers.decreasedDamageReduction,
            evasion: {
                melee: stats.evasion.melee,
                ranged: stats.evasion.ranged,
                magic: stats.evasion.magic
            },
            hitpoints: stats.maxHitpoints,
            maximumHit: stats.maxHit,
            minimumHit: stats.minHit,
            summoningHit: stats.summoningMaxHit,
            summoningBarrierHit: Math.floor(
                Global.game.combat.player.modifySummonAttackDamage(stats.summoningMaxHit, true)
            ),
            autoEatThreshold: Global.game.combat.player.autoEatThreshold,
            doubling: Global.game.combat.player.modifiers.combatLootDoubleChance,
            gp: Global.game.combat.player.modifiers.increasedCombatGP
        };
    }
}

import { Global } from 'src/app/global';
import { OutOfCombatStats } from './out-of-combat-stats';
import type { Main } from 'src/app/user-interface/main/main';
import { SettingsController } from 'src/app/settings-controller';
import { Util } from 'src/shared/util';
import { Lookup } from 'src/shared/utils/lookup';
import { GameStats } from 'src/shared/utils/game-stats';

export abstract class StatsController {
    private static outOfCombatStats: OutOfCombatStats;

    public static init(main: Main) {
        this.outOfCombatStats = main.querySelector('.mcs-main-out-of-combat-stats');
    }

    public static update() {
        if (SettingsController.isImporting) {
            // prevent spamming re-calculations while importing, we manually call it once at the end.
            return;
        }

        GameStats.compute();
        this.updateStats();

        this.outOfCombatStats?._update();
    }

    private static updateStats() {
        // loot doubling is always between 0% and 100% chance
        const lootBonusPercent = Math.min(
            100,
            Math.max(
                0,
                Global.game.combat.player.modifiers.combatLootDoublingChance +
                    Global.game.combat.player.modifiers.globalItemDoublingChance
            )
        );

        const gpBonus = Util.averageDoubleMultiplier(Global.game.combat.getCurrencyModifier(Global.game.gp));

        const stats = Global.game.combat.player.stats;

        const summonMaxHit = Math.floor(
            Global.game.combat.player.modifySummonAttackDamage(stats.summoningMaxHit, false)
        );
        const barrierMaxHit = Math.floor(
            Global.game.combat.player.modifySummonAttackDamage(stats.summoningMaxHit, true)
        );

        Global.stores.stats.set({
            attackInterval: stats.attackInterval,
            summonAttackInterval: Global.game.combat.player.summonAttackInterval,
            respawnInterval: Global.game.combat.player.getMonsterSpawnTime(),
            maxAttackRoll: stats.accuracy,
            maxHit: stats.maxHit,
            minHit: stats.minHit,
            summoningMaxHit: summonMaxHit,
            summoningBarrierMaxHit: barrierMaxHit,
            critChance: Global.game.combat.player.modifiers.getCritChance(Global.game.combat.player.attackType),
            critDamage: 150 + Global.game.combat.player.modifiers.critMultiplier,
            maxDefRoll: stats.evasion.melee,
            maxRngDefRoll: stats.evasion.ranged,
            maxMagDefRoll: stats.evasion.magic,
            damageReduction: stats.getResistance(Lookup.normalDamage),
            abyssalResistance: cloudManager.hasItAEntitlementAndIsEnabled
                ? stats.getResistance(Lookup.abyssalDamage)
                : 0,
            maxHitpoints: Global.game.combat.player.stats.maxHitpoints,
            autoEatThreshold: Math.floor(Global.game.combat.player.autoEatThreshold),
            slayerAreaNegation: Global.game.combat.player.modifiers.flatSlayerAreaEffectNegation,
            abyssalSlayerAreaNegation: Global.game.combat.player.modifiers.flatAbyssalSlayerAreaEffectNegation,
            gpBonus,
            lootBonusPercent
        });
    }
}

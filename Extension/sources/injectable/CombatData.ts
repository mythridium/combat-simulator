/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>
    Modified Copyright (C) <2020> <Visua0>
    Modified Copyright (C) <2020, 2021> <G. Miclotte>
    Modified Copyright (C) <2022, 2023> <Broderick Hyman>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * CombatData class, stores all the combat data of a simulation
 */
class CombatData {
    combatStats: {
        attackInterval: number;
        minHit: number;
        maxHit: number;
        summoningMaxHit: number;
        maxAttackRoll: number;
        maxDefRoll: number;
        maxRngDefRoll: number;
        maxMagDefRoll: number;
        maxHitpoints: number;
        damageReduction: number;
        autoEatThreshold: number;
        lootBonusPercent: number;
        gpBonus: number;
    };
    decreasedAttackSpeed: any;
    dropSelected: any;
    equipmentStats: any;
    luckyHerb: any;
    manager: SimManager;
    // manager: CombatManager;
    player: SimPlayer;
    spells: {
        standard: NamespaceRegistry<StandardSpell>;
        curse: NamespaceRegistry<CurseSpell>;
        aurora: NamespaceRegistry<AuroraSpell>;
        ancient: NamespaceRegistry<AncientSpell>;
        archaic: NamespaceRegistry<ArchaicSpell>;
    };
    micsr: MICSR;

    /**
     *
     */
    constructor(manager: SimManager) {
        // constructor(micsr: MICSR, manager: CombatManager) {
        // constructor(micsr: MICSR, manager: SimManager) {
        this.manager = manager;
        this.micsr = manager.micsr;
        this.player = this.manager.player;
        // Spell Selection
        this.spells = {
            standard: this.micsr.standardSpells,
            curse: this.micsr.curseSpells,
            aurora: this.micsr.auroraSpells,
            ancient: this.micsr.ancientSpells,
            archaic: this.micsr.archaicSpells,
        };
        // Combat Stats
        this.combatStats = {
            attackInterval: 4000,
            minHit: 0,
            maxHit: 0,
            summoningMaxHit: 0,
            maxAttackRoll: 0,
            maxDefRoll: 0,
            maxRngDefRoll: 0,
            maxMagDefRoll: 0,
            maxHitpoints: 0,
            damageReduction: 0,
            autoEatThreshold: 0,
            lootBonusPercent: 0,
            gpBonus: 0,
        };
        // lucky herb bonus
        this.luckyHerb = 0;
        // equipment stats
        this.equipmentStats = this.player.equipmentStats;
        // selected item drop
        this.dropSelected = "micsr:none";
    }

    /**
     * Calculates the combat stats from equipment, combat style, spell selection and player levels and stores them in `this.combatStats`
     */
    updateCombatStats() {
        this.player.computeAllStats();

        /*
        First, gather all bonuses TODO: extract this
         */
        //
        this.computePotionBonus();
        const modifiers = this.player.modifiers;

        /*
        Second, start computing and configuring TODO: extract this
         */

        // loot doubling
        this.combatStats.lootBonusPercent =
            this.micsr.showModifiersInstance.getModifierValue(
                modifiers,
                "ChanceToDoubleLootCombat"
            ) +
            this.micsr.showModifiersInstance.getModifierValue(
                modifiers,
                "ChanceToDoubleItemsGlobal"
            );
        // loot doubling is always between 0% and 100% chance
        this.combatStats.lootBonusPercent = Math.max(
            0,
            this.combatStats.lootBonusPercent
        );
        this.combatStats.lootBonusPercent = Math.min(
            100,
            this.combatStats.lootBonusPercent
        );
        // gp bonus
        this.combatStats.gpBonus = Util.averageDoubleMultiplier(
            this.micsr.showModifiersInstance.getModifierValue(
                modifiers,
                "GPFromMonsters"
            ) +
                this.micsr.showModifiersInstance.getModifierValue(
                    modifiers,
                    "GPGlobal"
                ) // +
            // TODO (this.player.isSlayerTask ? modifiers.summoningSynergy_ : 0)
        );

        // attack speed without aurora
        this.combatStats.attackInterval = this.player.stats.attackInterval;

        // max attack roll
        this.combatStats.maxAttackRoll = this.player.stats.accuracy;

        // max hit roll
        this.combatStats.maxHit = this.player.stats.maxHit;
        this.combatStats.minHit = this.player.stats.minHit;

        // max summ roll
        this.combatStats.summoningMaxHit = this.player.stats.summoningMaxHit;

        // max defence roll
        this.combatStats.maxDefRoll = this.player.stats.evasion.melee;
        this.combatStats.maxRngDefRoll = this.player.stats.evasion.ranged;
        this.combatStats.maxMagDefRoll = this.player.stats.evasion.magic;

        // Calculate damage reduction
        this.combatStats.damageReduction = this.player.stats.damageReduction;

        // Max Hitpoints
        this.combatStats.maxHitpoints = this.player.levels.Hitpoints;
        this.combatStats.maxHitpoints +=
            this.micsr.showModifiersInstance.getModifierValue(
                modifiers,
                "MaxHitpoints"
            );
        this.combatStats.maxHitpoints = this.player.stats.maxHitpoints;

        // Calculate auto eat threshold
        // @ts-expect-error TS(2445)
        this.combatStats.autoEatThreshold = this.player.autoEatThreshold;
    }

    /**
     * Computes the potion bonuses for the selected potion
     * */
    computePotionBonus() {
        this.luckyHerb = 0;
        // if (this.player.potion) {
        //     const potion =
        //     // @ts-expect-error TS(2304): Cannot find name 'items'.
        //         items[
        //             Herblore.potions[this.player.potion].potionIDs[
        //                 this.player.potionTier
        //             ]
        //         ];
        //     if (potion.potionBonusID === 11) {
        //         this.luckyHerb = potion.potionBonus;
        //     }
        // }
    }

    playerAttackSpeed() {
        let attackSpeed = this.combatStats.attackInterval;
        attackSpeed -= this.decreasedAttackSpeed();
        return attackSpeed;
    }

    getSummoningXP() {
        const summ1 = this.player.equipmentID(equipmentSlotData.Summon1.id);
        const summ2 = this.player.equipmentID(equipmentSlotData.Summon2.id);
        let xp = 0;
        // @ts-expect-error TS(2304): Cannot find name 'items'.
        if (summ1 >= 0 && items[summ1].summoningMaxHit) {
            // @ts-expect-error TS(2304): Cannot find name 'getBaseSummoningXP'.
            xp += getBaseSummoningXP(items[summ1].summoningID, true, 3000);
        }
        // @ts-expect-error TS(2304): Cannot find name 'items'.
        if (summ2 >= 0 && items[summ2].summoningMaxHit) {
            // @ts-expect-error TS(2304): Cannot find name 'getBaseSummoningXP'.
            xp += getBaseSummoningXP(items[summ2].summoningID, true, 3000);
        }
        return xp;
    }
}

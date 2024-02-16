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

import type { SimEnemy } from './sim-enemy';
import type { SimGame } from './sim-game';
import type { SimPlayer } from './sim-player';
import { MICSR } from './micsr';
import { SimClasses } from './sim';
import { Util } from './util';

export interface ISimGains {
    gp: number;
    skillXP: { [index: string]: number };
    petRolls: {
        other: any[];
    };
    slayercoins: number;
    usedAmmo: number;
    usedRunesBreakdown: { [index: string]: number };
    usedRunes: number;
    usedCombinationRunes: number;
    usedConsumables: number;
    usedFood: number;
    usedPotions: number;
    usedPrayerPoints: number;
    gainedPrayerPoints: number;
    usedSummoningCharges: number;
    highestDamageTaken: number;
    highestReflectDamageTaken: number;
    lowestHitpoints: number;
}

export interface ISimStats {
    success: boolean;
    monsterID: string;
    dungeonID: string;
    tickCount: number;
    simStats: {
        deathCount: number;
        killCount: number;
    };
    gainsPerSecond: ISimGains;
    failMessage: string;
}

export interface ISimResult {
    [index: string]: any;
    // success
    simSuccess: boolean;
    reason: string;
    tickCount: number;
    // xp rates
    xpPerSecond: number;
    hpXpPerSecond: number;
    slayerXpPerSecond: number;
    prayerXpPerSecond: number;
    summoningXpPerSecond: number;
    // consumables
    ppGainedPerSecond: number;
    ppConsumedPerSecond: number;
    ammoUsedPerSecond: number;
    runesUsedPerSecond: number;
    usedRunesBreakdown: { [index: string]: number };
    combinationRunesUsedPerSecond: number;
    usedConsumablesPerSecond: number;
    potionsUsedPerSecond: number;
    tabletsUsedPerSecond: number;
    atePerSecond: number;
    // survivability
    deathRate: number;
    highestDamageTaken: number;
    highestReflectDamageTaken: number;
    lowestHitpoints: number;
    // kill time
    killTimeS: number;
    killsPerSecond: number;
    // loot gains
    baseGpPerSecond: number;
    dropChance: number;
    signetChance: number;
    petChance: number;
    petRolls: {};
    slayerCoinsPerSecond: number;
    // not displayed -> TODO: remove?
    simulationTime: number;
}

/**
 * SimManager class, allows creation of a functional Player object without affecting the game
 */
export class SimManager extends CombatManager {
    public declare game: SimGame;
    public declare player: SimPlayer;
    public declare enemy: SimEnemy;

    simStats: {
        deathCount: number;
        killCount: number;
    };
    tickCount: number;
    micsr: MICSR;

    constructor(game: SimGame, namespace: DataNamespace) {
        super(game, namespace);

        this.tickCount = 0;
        this.micsr = game.micsr;
        this.player = new SimClasses.SimPlayer(this, game);
        this.enemy = new SimClasses.SimEnemy(this, game);
        this.simStats = {
            killCount: 0,
            deathCount: 0
        };
        this.detachGlobals();
        this.replaceGlobals();
    }

    get onSlayerTask() {
        return (
            this.player.isSlayerTask &&
            this.areaType !== CombatAreaType.Dungeon &&
            this.areaType !== CombatAreaType.None
        );
    }

    initialize() {
        this.stopCombat();
        if (!Util.isWebWorker) {
            this['dungeonCompletion'].clear();
        }
        // Set up player gamemode before combat initialize
        // TODO: This can probably be removed once we use the SimGame gamemode for everything
        this.player.currentGamemodeID = this.micsr.game.currentGamemode.id;
        super.initialize();
        this.player.initialize();
    }

    // detach globals attached by parent constructor
    detachGlobals() {
        this.loot.render = () => undefined;
    }

    addItemStat() {}

    addMonsterStat() {}

    addCombatStat() {}

    setCallbacks() {}

    // replace globals with properties
    replaceGlobals() {
        this.resetSimStats();
    }

    // don't render anything
    render() {}

    // reset sim stats
    resetSimStats() {
        this.tickCount = 0;
        this.simStats = {
            killCount: 0,
            deathCount: 0
        };
        // process death, this will consume food or put you at 20% HP
        this.player.processDeath();
        // reset gains, this includes resetting food usage and setting player to 100% HP
        this.player.resetGains();
    }

    getSimStats(monsterID: string, dungeonID: string, success: boolean, failMesage: string): ISimStats {
        return {
            success: success,
            monsterID: monsterID,
            dungeonID: dungeonID,
            tickCount: this.tickCount,
            simStats: this.simStats,
            gainsPerSecond: this.player.getGainsPerSecond(this.tickCount),
            failMessage: failMesage
        };
    }

    convertSlowSimToResult(simResult: ISimStats, targetTrials: any): ISimResult {
        const gps = simResult.gainsPerSecond;
        const ticksPerSecond = 1000 / TICK_INTERVAL;
        const trials = simResult.simStats.killCount + simResult.simStats.deathCount;

        // if (!simResult.success || targetTrials - trials > 0) {
        //     debugger;
        // }

        let reason = '';
        if (!simResult.success && simResult.failMessage) {
            reason += simResult.failMessage;
        }
        if (simResult.success && targetTrials - trials > 0) {
            reason += `Simulated ${trials}/${targetTrials} trials.`;
        }
        let killTimeS = simResult.tickCount / ticksPerSecond / simResult.simStats.killCount;
        let killsPerSecond = 1 / killTimeS;
        let deathRate = simResult.simStats.deathCount / trials;

        return {
            // success
            simSuccess: simResult.success,
            reason: reason,
            tickCount: simResult.tickCount,
            // xp rates
            xpPerSecond:
                gps.skillXP[this.micsr.skillIDs.Attack] +
                gps.skillXP[this.micsr.skillIDs.Strength] +
                gps.skillXP[this.micsr.skillIDs.Defence] +
                gps.skillXP[this.micsr.skillIDs.Ranged] +
                gps.skillXP[this.micsr.skillIDs.Magic], // TODO: this depends on attack style
            hpXpPerSecond: gps.skillXP[this.micsr.skillIDs.Hitpoints],
            slayerXpPerSecond: gps.skillXP[this.micsr.skillIDs.Slayer],
            prayerXpPerSecond: gps.skillXP[this.micsr.skillIDs.Prayer],
            summoningXpPerSecond: gps.skillXP[this.micsr.skillIDs.Summoning],
            // consumables
            ppGainedPerSecond: gps.gainedPrayerPoints,
            ppConsumedPerSecond: gps.usedPrayerPoints,
            ammoUsedPerSecond: gps.usedAmmo,
            runesUsedPerSecond: gps.usedRunes,
            usedRunesBreakdown: gps.usedRunesBreakdown,
            combinationRunesUsedPerSecond: gps.usedCombinationRunes,
            usedConsumablesPerSecond: gps.usedConsumables,
            potionsUsedPerSecond: gps.usedPotions,
            tabletsUsedPerSecond: gps.usedSummoningCharges,
            atePerSecond: gps.usedFood,
            // survivability
            deathRate: deathRate,
            highestDamageTaken: gps.highestDamageTaken,
            highestReflectDamageTaken: gps.highestReflectDamageTaken,
            lowestHitpoints: gps.lowestHitpoints,
            // kill time
            killTimeS: killTimeS,
            killsPerSecond: killsPerSecond,
            // loot gains
            baseGpPerSecond: gps.gp, // gpPerSecond is computed from this
            dropChance: NaN,
            signetChance: NaN,
            petChance: NaN,
            petRolls: gps.petRolls,
            slayerCoinsPerSecond: gps.slayercoins,
            // not displayed -> TODO: remove?
            simulationTime: NaN
        };
    }

    // track kills and deaths
    onPlayerDeath() {
        this.player.processDeath();
        this.simStats.deathCount++;
    }

    onEnemyDeath(): boolean {
        // this.player.rewardGPForKill();
        // if (this.selectedArea.type === 'Dungeon') {
        //     this.progressDungeon();
        // } else {
        //     this.rewardForEnemyDeath();
        // }
        // // from baseManager
        // this.enemy.processDeath();

        this.simStats.killCount++;

        const dungeonProgress = this.dungeonProgress;
        const result = super.onEnemyDeath();

        // if we targeting a dungeon, reduce the dungeon progress since the enemy death will increment it back to the same monster.
        if (this.selectedArea instanceof Dungeon) {
            this.dungeonProgress = dungeonProgress;
        }

        return result;
    }

    dropSignetHalfB() {}

    dropEnemyBones() {}

    awardSkillLevelCapIncreaseForDungeonCompletion() {}

    // dropEnemyLoot() {
    // }

    // rewardForEnemyDeath() {
    //     this.dropEnemyBones();
    //     this.dropSignetHalfB();
    //     // @ts-expect-error
    //     this.dropEnemyLoot();
    //     this.dropEnemyGP(this.enemy.monster);
    //     let slayerXPReward = 0;
    //     if (this.areaType === 'Slayer') {
    //         slayerXPReward += this.enemy.stats.maxHitpoints / numberMultiplier / 2;
    //     }
    //     if (this.onSlayerTask) {
    //         this.player.rewardSlayerCoins();
    //         slayerXPReward += this.enemy.stats.maxHitpoints / numberMultiplier;
    //     }
    //     if (slayerXPReward > 0)
    //         this.player.addXP(this.micsr.skillIDs.Slayer, slayerXPReward);
    // }

    selectMonster(monster: any, areaData: any) {
        // clone of combatManager.selectMonster
        let slayerLevelReq = 0;
        if (areaData instanceof SlayerArea) {
            slayerLevelReq = areaData.slayerLevelRequired;
        }
        if (
            !this.game.checkRequirements(
                areaData.entryRequirements,
                true,
                slayerLevelReq,
                areaData instanceof SlayerArea
            )
        ) {
            return;
        }
        this.preSelection();
        this.selectedArea = areaData;
        this.selectedMonster = monster;
        this.onSelection();
    }

    preSelection(): boolean {
        this.stopCombat(true, true);
        return true;
    }

    loadNextEnemy() {
        super.loadNextEnemy();
    }

    onSelection() {
        this.isActive = true;
        this.loadNextEnemy();
    }

    stopCombat(fled = true, areaChange = false) {
        this.isActive = false;
        this.endFight();
        if (this.spawnTimer.isActive) this.spawnTimer.stop();
        if (this.enemy.state !== EnemyState.Dead) this.enemy.processDeath();
        this.loot.removeAll();
        this.selectedArea = undefined;
        if (this.paused) {
            this.paused = false;
        }
    }

    pauseDungeon() {
        this.paused = true;
    }

    resumeDungeon() {
        this.startFight();
        this.paused = false;
    }

    tick() {
        this.passiveTick();
        this.activeTick();
        this.checkDeath();
        this.tickCount++;
    }

    runTrials(monsterID: any, dungeonID: any, trials: any, tickLimit: any, verbose = false): ISimStats {
        this.resetSimStats();
        const startTimeStamp = performance.now();
        const monster = this.game.monsters.getObjectByID(monsterID);
        let areaData = this.game.getMonsterArea(monster!);
        if (dungeonID !== undefined) {
            areaData = this.micsr.dungeons.getObjectByID(dungeonID)!;
            this.dungeonProgress = 0;
            while (areaData.monsters[this.dungeonProgress].id !== monsterID) {
                this.dungeonProgress++;
            }
        }
        const totalTickLimit = trials * tickLimit;
        // debugger;
        let success = this.game.checkRequirements(
            areaData.entryRequirements,
            true,
            areaData instanceof SlayerArea ? areaData.slayerLevelRequired : undefined,
            areaData instanceof SlayerArea
        );
        let failMessage = success ? '' : 'Missing Slayer Area Requirements';
        if (success) {
            this.selectMonster(monster, areaData);

            this.micsr.logger.log('Fighting:', monster?.name, areaData.name);
            while (this.simStats.killCount + this.simStats.deathCount < trials && this.tickCount < totalTickLimit) {
                if (!this.isActive && !this.spawnTimer.active) {
                    this.selectMonster(monster, areaData);
                }
                if (this.paused) {
                    this.resumeDungeon();
                }
                this.tick();
                if (this.spawnTimer.active) {
                    if (this.spawnTimer.ticksLeft % 10 === 1) {
                        //this.micsr.log('spawning', this.spawnTimer.ticksLeft);
                    }
                } else {
                    //this.micsr.log('ticked', this.enemy.hitpoints, this.enemy.stats.maxHitpoints, this.player.hitpoints, this.player.stats.maxHitpoints);
                }
            }
        }
        // TODO: Show the requirements necessary for a monster
        // However make sure that partial slayer tasks don't show the error
        // else {
        //     failMessage = `Failed one of the following requirements: ${areaData.entryRequirements.map(r => r.type).join(", ")}.`;
        // }
        this.stopCombat();
        const processingTime = performance.now() - startTimeStamp;
        const simStats = this.getSimStats(monsterID, dungeonID, success, failMessage);
        if (verbose) {
            this.micsr.logger.log(
                `Processed ${this.simStats.killCount} / ${this.simStats.deathCount} k/d and ${
                    this.tickCount
                } ticks in ${processingTime / 1000}s (${processingTime / this.tickCount}ms/tick).`,
                simStats
            );
        }
        return simStats;
    }

    // decode(reader: SaveWriter, version: number): void {

    // }
}

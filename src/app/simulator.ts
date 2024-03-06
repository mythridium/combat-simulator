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

import { Interface } from 'src/app/interface/interface';
import { IImportSettings } from './import';
import { ISimResult, ISimStats } from 'src/shared/simulator/sim-manager';
import { MICSR } from 'src/shared/micsr';
import { Global } from './global';
import { MessageAction } from 'src/shared/transport/message';
import { WebWorker } from './worker/web-worker';

export interface ISimData extends ISimStats, ISimResult {
    inQueue?: boolean;
    adjustedRates: any;
}

export interface ISimSave {
    settings: IImportSettings;
    monsterSimData: { [index: string]: ISimData };
    dungeonSimData: { [index: string]: ISimData };
    slayerSimData: { [index: string]: ISimData };
}

declare var gameFileVersion: string;
declare function checkFileVersion(version: string): boolean;

/**
 * Simulator class, used for all simulation work, and storing simulation results and settings
 */
export class Simulator {
    currentJob: any;
    currentSim: any;
    dungeonSimData: { [index: string]: ISimData };
    dungeonSimFilter: { [index: string]: boolean };
    isTestMode: any;
    maxThreads: any;
    monsterSimData: { [index: string]: ISimData };
    monsterSimIDs: string[];
    monsterSimFilter: { [index: string]: boolean };
    notSimulatedReason: any;
    selectedPlotIsTime: any;
    selectedPlotScales: any;
    simCancelled: any;
    simInProgress: any;
    simStartTime: any;
    simulationQueue: any;
    simulationWorkers: any;
    slayerSimData: { [index: string]: ISimData };
    slayerSimFilter: { [index: string]: boolean };
    slayerTaskMonsters: any;
    testCount: any;
    testMax: any;
    workerURL: any;
    micsr: MICSR;

    constructor(public readonly parent: Interface) {
        this.micsr = parent.micsr;
        // Simulation settings
        this.monsterSimFilter = {};
        this.dungeonSimFilter = {};
        this.slayerSimFilter = {};
        // not simulated reason
        this.notSimulatedReason = 'entity not simulated';
        // Simulation data;
        this.monsterSimIDs = [];
        this.monsterSimData = {};
        this.micsr.monsters.forEach((monster: any) => {
            this.monsterSimData[monster.id] = this.newSimData(true);
            this.monsterSimIDs.push(monster.id);
            this.monsterSimFilter[monster.id] = true;
        });
        this.dungeonSimData = {};
        this.micsr.dungeons.forEach((dungeon: any) => {
            this.dungeonSimData[dungeon.id] = this.newSimData(false);
            this.dungeonSimFilter[dungeon.id] = false;
            dungeon.monsters.forEach((monster: any) => {
                const simID = this.simID(monster.id, dungeon.id);
                if (!this.monsterSimData[simID]) {
                    this.monsterSimData[simID] = this.newSimData(true);
                    this.monsterSimIDs.push(simID);
                }
            });
        });
        //
        this.slayerTaskMonsters = {};
        this.slayerSimData = {};
        this.micsr.slayerTaskData.forEach((task: any) => {
            this.slayerTaskMonsters[task.display] = [];
            this.slayerSimData[task.display] = this.newSimData(false);
            this.slayerSimFilter[task.display] = true;
        });
        /** Variables of currently stored simulation */
        this.currentSim = this.initCurrentSim();
        // Options for time multiplier
        this.selectedPlotIsTime = true;
        this.selectedPlotScales = true;
        // Test Settings
        this.isTestMode = false;
        this.testMax = 10;
        this.testCount = 0;
        // Simulation queue and webworkers
        this.currentJob = 0;
        this.simInProgress = false;
        this.simulationQueue = [];
        this.simulationWorkers = [];
        this.maxThreads = 1; // TODO: window.navigator.hardwareConcurrency;
        this.simStartTime = 0;
        /** If the current sim has been cancelled */
        this.simCancelled = false;
    }

    newSimData(isMonster: boolean): ISimData {
        const data: any = {
            simSuccess: false,
            reason: this.notSimulatedReason,
            adjustedRates: {}
        };
        if (isMonster) {
            data.inQueue = false;
            data.petRolls = { other: [] };
        }
        return data;
    }

    /**
     * Initializes a performance test
     */
    runTest(numSims: any) {
        this.testCount = 0;
        this.isTestMode = true;
        this.testMax = numSims;
        this.simulateCombat(false);
    }

    /**
     * Creates the webworkers for simulation jobs
     */
    async createWorkers() {
        for (let i = 0; i < this.maxThreads; i++) {
            this.intializeWorker();

            const newWorker = {
                inUse: false,
                selfTime: 0
            };

            this.simulationWorkers.push(newWorker);
        }
    }

    intializeWorker() {
        return Global.simulation.init();
    }

    /**
     * Iterate through all the combatAreas and this.micsr.dungeons to create a set of monsterSimData and dungeonSimData
     */
    async simulateCombat(single: boolean) {
        this.setupCurrentSim(single);
        // Start simulation workers
        document.getElementById('MCS Simulate All Button').textContent = `Cancel (0/${this.simulationQueue.length})`;
        await this.initializeSimulationJobs();
    }

    initCurrentSim() {
        return {
            options: {
                trials: this.micsr.trials
            }
        };
    }

    simID(monsterID: string, dungeonID?: string) {
        if (dungeonID === undefined) {
            return monsterID;
        }
        return `${dungeonID}-${monsterID}`;
    }

    pushMonsterToQueue(monsterID: string, dungeonID?: string) {
        const simID = this.simID(monsterID, dungeonID);
        if (!this.monsterSimData[simID].inQueue) {
            this.monsterSimData[simID].inQueue = true;
            this.simulationQueue.push({
                monsterID: monsterID,
                dungeonID: dungeonID
            });
        }
    }

    resetSingleSimulation() {
        // clear queue
        this.simulationQueue = [];
        this.resetSimDone();
        // check selection
        if (!this.parent.barSelected && !this.parent.isViewingDungeon) {
            this.parent.notify('There is nothing selected!', 'danger');
            return {};
        }
        // area monster
        if (!this.parent.isViewingDungeon && this.parent.barIsMonster(this.parent.selectedBar)) {
            const monsterID = this.parent.barMonsterIDs[this.parent.selectedBar];
            if (this.monsterSimFilter[monsterID]) {
                this.pushMonsterToQueue(monsterID, undefined);
            } else {
                this.parent.notify('The selected monster is filtered!', 'danger');
            }
            return {};
        }
        // dungeon
        let dungeonID: string | undefined = undefined;
        if (!this.parent.isViewingDungeon && this.parent.barIsDungeon(this.parent.selectedBar)) {
            dungeonID = this.parent.barMonsterIDs[this.parent.selectedBar];
        } else if (this.parent.isViewingDungeon && this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            dungeonID = this.parent.viewedDungeonID;
        }
        if (dungeonID !== undefined) {
            if (this.dungeonSimFilter[dungeonID]) {
                if (this.parent.isViewingDungeon && this.parent.barSelected) {
                    this.pushMonsterToQueue(this.parent.getSelectedDungeonMonsterID(), dungeonID);
                    return { dungeonID: dungeonID };
                }
                this.micsr.dungeons.getObjectByID(dungeonID)!.monsters.forEach(monster => {
                    this.pushMonsterToQueue(monster.id, dungeonID);
                });
                return { dungeonID: dungeonID };
            }
            this.parent.notify('The selected dungeon is filtered!', 'danger');
            return {};
        }
        // slayer area
        let taskID = undefined;
        if (!this.parent.isViewingDungeon && this.parent.barIsTask(this.parent.selectedBar)) {
            taskID = this.parent.barMonsterIDs[this.parent.selectedBar];
        } else if (this.parent.isViewingDungeon && this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            taskID = this.parent.viewedDungeonID;
        }
        if (taskID !== undefined) {
            if (this.slayerSimFilter[taskID]) {
                this.queueSlayerTask(taskID);
                return { taskID: taskID };
            }
            this.parent.notify('The selected task list is filtered!', 'danger');
            return {};
        }
        // can't be reached
        return {};
    }

    queueSlayerTask(taskName: string) {
        const task = this.micsr.slayerTaskData.find(t => t.display == taskName);
        if (!task) {
            throw new Error(`Could not find task: ${taskName}`);
        }
        this.slayerTaskMonsters[taskName] = [];
        if (!this.slayerSimFilter[taskName]) {
            return;
        }
        const minLevel = task.minLevel;
        const maxLevel = task.maxLevel === -1 ? 6969 : task.maxLevel;
        this.micsr.monsters.forEach((monster: any) => {
            // check if it is a slayer monster
            if (!monster.canSlayer) {
                return;
            }
            // check if combat level fits the current task type
            const cbLevel = monster.combatLevel;
            if (cbLevel < minLevel || cbLevel > maxLevel) {
                return;
            }
            // check if the area is accessible, this only works for auto slayer
            // without auto slayer you can get some tasks for which you don't wear/own the gear
            let area = this.micsr.game.getMonsterArea(monster);
            if (
                !this.parent.game.checkRequirements(
                    area.entryRequirements,
                    undefined,
                    area instanceof SlayerArea ? area.slayerLevelRequired : undefined,
                    area instanceof SlayerArea
                )
            ) {
                return;
            }
            // all checks passed
            this.pushMonsterToQueue(monster.id, undefined);
            this.slayerTaskMonsters[taskName].push(monster);
        });
    }

    resetSimulationData(single: boolean) {
        // Reset the simulation status of all enemies
        this.resetSimDone();
        // Set up simulation queue
        this.simulationQueue = [];
        if (single) {
            this.currentSim.ids = this.resetSingleSimulation();
            return;
        }
        // Queue simulation of monsters in combat areas
        this.micsr.game.combatAreaDisplayOrder.forEach(area => {
            area.monsters.forEach(monster => {
                if (this.monsterSimFilter[monster.id]) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            });
        });
        // Wandering Bard
        if (this.monsterSimFilter[this.micsr.bardID]) {
            this.pushMonsterToQueue(this.micsr.bardID, undefined);
        }
        // Queue simulation of monsters in slayer areas
        this.micsr.game.slayerAreaDisplayOrder.forEach(area => {
            if (
                !this.micsr.game.checkRequirements(
                    area.entryRequirements,
                    undefined,
                    area.slayerLevelRequired,
                    area instanceof SlayerArea
                )
            ) {
                const tryToSim = area.monsters.reduce(
                    (sim, monster) =>
                        (this.monsterSimFilter[monster.id] && !this.monsterSimData[monster.id].inQueue) || sim,
                    false
                );
                if (tryToSim) {
                    this.parent.notify(`Can't access ${area.name}`, 'danger');
                    area.monsters.forEach(monster => {
                        this.monsterSimData[monster.id].reason = 'cannot access area';
                    });
                }
                return;
            }
            area.monsters.forEach(monster => {
                if (this.monsterSimFilter[monster.id]) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            });
        });
        // Queue simulation of monsters in dungeons
        this.micsr.game.dungeonDisplayOrder.forEach(dungeon => {
            if (this.dungeonSimFilter[dungeon.id]) {
                for (let j = 0; j < dungeon.monsters.length; j++) {
                    const monster = dungeon.monsters[j];
                    this.pushMonsterToQueue(monster.id, dungeon.id);
                }
            }
        });
        // Queue simulation of monsters in slayer tasks
        this.micsr.taskIDs.forEach(taskID => {
            this.queueSlayerTask(taskID);
        });
    }

    /**
     * Setup currentsim variables
     */
    setupCurrentSim(single: boolean) {
        this.simStartTime = performance.now();
        this.simCancelled = false;
        this.currentSim = this.initCurrentSim();
        // reset and setup sim data
        this.resetSimulationData(single);
    }

    combineReasons(data: any, monsters: any, dungeonID: any) {
        let reasons: any = [];
        monsters.forEach((monster: any) => {
            const simID = this.simID(monster.id, dungeonID);
            if (!this.monsterSimData[simID].simSuccess) {
                data.simSuccess = false;
            }
            const reason = this.monsterSimData[simID].reason;
            if (reason && !reasons.includes(reason)) {
                reasons.push(reason);
            }
        });
        if (reasons.length) {
            data.reason = reasons.join(', ');
            return true;
        }
        data.reason = undefined;
        return false;
    }

    computeAverageSimData(
        filter: boolean,
        averageData: ISimData,
        monsters: Monster[],
        isSlayerTask: boolean,
        dungeonID?: string
    ) {
        // check filter
        if (!filter) {
            averageData.simSuccess = false;
            averageData.reason = 'entity filtered';
            return;
        }
        // combine failure reasons, if any
        if (isSlayerTask) {
            averageData.reason = '';
        } else {
            this.combineReasons(averageData, monsters, dungeonID);
        }

        averageData.simSuccess = true;
        averageData.tickCount = 0;

        // not time-weighted averages
        averageData.deathRate = 0;
        averageData.highestDamageTaken = 0;
        averageData.highestReflectDamageTaken = 0;
        averageData.lowestHitpoints = Number.MAX_SAFE_INTEGER;
        averageData.killTimeS = 0;
        averageData.simulationTime = 0;

        monsters.forEach(monster => {
            const simID = this.simID(monster.id, dungeonID);
            const monsterData = this.monsterSimData[simID];
            if (monsterData.simSuccess) {
                if (!isSlayerTask) {
                    averageData.simSuccess &&= monsterData.simSuccess;
                }
                averageData.deathRate = 1 - (1 - averageData.deathRate) * (1 - monsterData.deathRate);
                averageData.highestDamageTaken = Math.max(
                    averageData.highestDamageTaken,
                    monsterData.highestDamageTaken
                );
                averageData.highestReflectDamageTaken = Math.max(
                    averageData.highestReflectDamageTaken,
                    monsterData.highestReflectDamageTaken
                );
                averageData.lowestHitpoints = Math.min(averageData.lowestHitpoints, monsterData.lowestHitpoints);
                averageData.killTimeS += monsterData.killTimeS;
                averageData.simulationTime += monsterData.simulationTime;
                averageData.tickCount = Math.max(averageData.tickCount, monsterData.tickCount);
            }
        });

        averageData.killsPerSecond = 1 / averageData.killTimeS;

        // time-weighted averages
        const computeAvg = (tag: string) => {
            averageData[tag] =
                monsters
                    .map(monster => this.monsterSimData[this.simID(monster.id, dungeonID)])
                    .reduce((avgData, mData) => {
                        if (!mData.simSuccess) {
                            return avgData;
                        }

                        return avgData + mData[tag] * mData.killTimeS;
                    }, 0) / averageData.killTimeS;
        };
        [
            // xp rates
            'xpPerSecond',
            'hpXpPerSecond',
            'slayerXpPerSecond',
            'prayerXpPerSecond',
            'summoningXpPerSecond',
            // consumables
            'ppGainedPerSecond',
            'ppConsumedPerSecond',
            'ammoUsedPerSecond',
            'runesUsedPerSecond',
            'combinationRunesUsedPerSecond',
            'usedConsumablesPerSecond',
            'potionsUsedPerSecond',
            'tabletsUsedPerSecond',
            'atePerSecond',
            // survivability
            // 'deathRate',
            // 'highestDamageTaken',
            // 'lowestHitpoints',
            // kill time
            // 'killTimeS',
            // 'killsPerSecond',
            // loot gains
            'baseGpPerSecond',
            'dropChance',
            'signetChance',
            'petChance',
            'slayerCoinsPerSecond',
            // unsorted
            'dmgPerSecond',
            'attacksMadePerSecond',
            'attacksTakenPerSecond'
            // 'simulationTime',
        ].forEach(tag => computeAvg(tag));

        // average rune breakdown
        averageData.usedRunesBreakdown = {};
        monsters
            .map(monster => this.monsterSimData[this.simID(monster.id, dungeonID)])
            .forEach(mData => {
                for (const runeID in mData.usedRunesBreakdown) {
                    if (averageData.usedRunesBreakdown[runeID] === undefined) {
                        averageData.usedRunesBreakdown[runeID] = 0;
                    }
                    averageData.usedRunesBreakdown[runeID] +=
                        (mData.usedRunesBreakdown[runeID] * mData.killTimeS) / averageData.killTimeS;
                }
            });

        if (isSlayerTask) {
            averageData.killTimeS = 0;
            averageData.killsPerSecond = 0;

            monsters.forEach(monster => {
                const simID = this.simID(monster.id, dungeonID);
                const monsterData = this.monsterSimData[simID];

                if (monsterData.simSuccess) {
                    averageData.killTimeS += monsterData.killTimeS;
                    averageData.killsPerSecond += 1 / monsterData.killTimeS;
                }
            });

            averageData.killTimeS = averageData.killTimeS / (monsters.length || 1);
            averageData.killsPerSecond = averageData.killsPerSecond / (monsters.length || 1);
        }
    }

    /** Performs all data analysis post queue completion */
    performPostSimAnalysis(isNewRun = false) {
        // Perform calculation of dungeon stats
        this.micsr.dungeons.allObjects.forEach((dungeon: Dungeon) => {
            this.computeAverageSimData(
                this.dungeonSimFilter[dungeon.id],
                this.dungeonSimData[dungeon.id],
                dungeon.monsters,
                false,
                dungeon.id
            );
        });
        this.micsr.slayerTaskData.forEach((task: SlayerTaskData) => {
            this.computeAverageSimData(
                this.slayerSimFilter[task.display],
                this.slayerSimData[task.display],
                this.slayerTaskMonsters[task.display],
                true
            );
        });
        // Update other data
        this.parent.loot.update();
        // scale
        this.parent.consumables.update();
        // log time and save result
        if (isNewRun) {
            this.micsr.logger.log(`Elapsed Simulation Time: ${performance.now() - this.simStartTime}ms`);
            if (this.parent.trackHistory) {
                this.saveResult();
            }
        }
    }

    saveResult() {
        // store simulation
        const save: ISimSave = {
            settings: this.parent.import.exportSettings(),
            monsterSimData: JSON.parse(JSON.stringify(this.monsterSimData)),
            dungeonSimData: JSON.parse(JSON.stringify(this.dungeonSimData)),
            slayerSimData: JSON.parse(JSON.stringify(this.slayerSimData))
        };
        this.parent.savedSimulations.push({ save, name: `Load simulation ${++this.parent.simulationCount}` });
        this.parent.createCompareCard();
    }

    /** Starts processing simulation jobs */
    async initializeSimulationJobs() {
        if (!this.simInProgress) {
            if (this.simulationQueue.length > 0) {
                this.simInProgress = true;
                this.currentJob = 0;
                for (let i = 0; i < this.simulationWorkers.length; i++) {
                    this.simulationWorkers[i].selfTime = 0;
                    if (i < this.simulationQueue.length) {
                        await this.startJob(i);
                    } else {
                        break;
                    }
                }
            } else {
                this.performPostSimAnalysis(true);
                this.parent.updateDisplayPostSim();
            }
        }
    }

    /** Starts a job for a given worker
     * @param {number} workerID
     */
    async startJob(workerID: any) {
        if (this.currentJob < this.simulationQueue.length && !this.simCancelled) {
            const monsterID = this.simulationQueue[this.currentJob].monsterID;
            const dungeonID = this.simulationQueue[this.currentJob].dungeonID;
            const saveString = this.micsr.game.generateSaveStringSimple();
            // debugger;
            this.simulationWorkers[workerID].inUse = true;
            this.currentJob++;

            const response = await Global.simulation.simulate({
                monsterId: monsterID,
                dungeonId: dungeonID,
                saveString: saveString,
                trials: this.micsr.trials,
                maxTicks: this.micsr.maxTicks
            });

            this.simulationWorkers[workerID].inUse = false;
            this.simulationWorkers[workerID].selfTime += response.time;

            const simID = this.simID(response.monsterId, response.dungeonId);
            Object.assign(this.monsterSimData[simID], response.result);
            this.monsterSimData[simID].simulationTime = response.time;
            document.getElementById('MCS Simulate All Button').textContent = `Cancel (${this.currentJob - 1}/${
                this.simulationQueue.length
            })`;

            this.startJob(workerID);
        } else {
            // Check if none of the workers are in use
            let allDone = true;
            this.simulationWorkers.forEach((simWorker: any) => {
                if (simWorker.inUse) {
                    allDone = false;
                }
            });

            if (allDone) {
                this.simInProgress = false;
                this.performPostSimAnalysis(true);
                this.parent.updateDisplayPostSim();
                if (this.isTestMode) {
                    this.testCount++;
                    if (this.testCount < this.testMax) {
                        await this.simulateCombat(false);
                    } else {
                        this.isTestMode = false;
                    }
                }
            }
        }
    }

    /**
     * Attempts to cancel the currently running simulation and sends a cancelation message to each of the active workers
     */
    cancelSimulation() {
        this.simCancelled = true;
        this.simulationWorkers.forEach(async (simWorker: any) => {
            if (simWorker.inUse) {
                await Global.simulation.cancel();
                //simWorker.worker.postMessage({ action: 'CANCEL_SIMULATION' });
            }
        });
    }

    /**
     * Resets the simulation status for each monster
     */
    resetSimDone() {
        for (let simID in this.monsterSimData) {
            this.monsterSimData[simID] = this.newSimData(true);
        }
        for (let simID in this.dungeonSimData) {
            this.dungeonSimData[simID] = this.newSimData(false);
        }
        for (let simID in this.slayerSimData) {
            this.slayerSimData[simID] = this.newSimData(false);
        }
    }

    /**
     * Extracts a set of data for plotting that matches the keyValue in monsterSimData and dungeonSimData
     * @param {string} keyValue
     * @return {number[]}
     */
    getDataSet(keyValue: any) {
        const dataSet = [];
        const isSignet = keyValue === 'signetChance';
        if (!this.parent.isViewingDungeon) {
            // Compile data from monsters in combat zones
            this.micsr.monsterIDs.forEach((monsterID: any) => {
                dataSet.push(
                    this.getBarValue(this.monsterSimFilter[monsterID], this.monsterSimData[monsterID], keyValue)
                );
            });
            // Perform simulation of monsters in dungeons
            this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                dataSet.push(
                    this.getBarValue(this.dungeonSimFilter[dungeonID], this.dungeonSimData[dungeonID], keyValue)
                );
            });
            // Perform simulation of monsters in slayer tasks
            this.micsr.taskIDs.forEach(taskID => {
                dataSet.push(this.getBarValue(this.slayerSimFilter[taskID], this.slayerSimData[taskID], keyValue));
            });
        } else if (this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            // dungeons
            const dungeonID = this.parent.viewedDungeonID;
            this.micsr.dungeons.getObjectByID(dungeonID!)!.monsters.forEach((monster: any) => {
                const simID = this.simID(monster.id, dungeonID);
                if (!isSignet) {
                    dataSet.push(this.getBarValue(true, this.monsterSimData[simID], keyValue));
                } else {
                    dataSet.push(0);
                }
            });
            if (isSignet) {
                const monsters = this.micsr.dungeons.getObjectByID(dungeonID!)!.monsters;
                const boss = monsters[monsters.length - 1];
                const simID = this.simID(boss.id, dungeonID);
                dataSet[dataSet.length - 1] = this.getBarValue(true, this.monsterSimData[simID], keyValue);
            }
        } else if (this.parent.viewedDungeonID) {
            // slayer tasks
            const taskID = this.parent.viewedDungeonID;
            this.slayerTaskMonsters[taskID].forEach((monsterID: any) => {
                if (!isSignet) {
                    dataSet.push(this.getBarValue(true, this.monsterSimData[monsterID], keyValue));
                } else {
                    dataSet.push(0);
                }
            });
        }
        return dataSet;
    }

    getValue(filter: any, data: any, keyValue: any, scale: any) {
        if (filter && data.simSuccess) {
            return this.getAdjustedData(data, keyValue) * this.getTimeMultiplier(data, keyValue, scale);
        }
        return NaN;
    }

    getBarValue(filter: any, data: any, keyValue: any) {
        return this.getValue(filter, data, keyValue, this.selectedPlotScales);
    }

    getTimeMultiplier(data: any, keyValue: any, scale: any) {
        let dataMultiplier = 1;
        if (scale) {
            dataMultiplier = this.parent.timeMultiplier;
        }
        if (this.parent.timeMultiplier === -1 && scale) {
            dataMultiplier = this.getAdjustedData(data, 'killTimeS');
        }
        if (keyValue === 'petChance') {
            dataMultiplier = 1;
        }
        return dataMultiplier;
    }

    getAdjustedData(data: any, tag: any) {
        if (this.parent.consumables.applyRates) {
            if (data.adjustedRates[tag] !== undefined) {
                return data.adjustedRates[tag];
            }
        }
        return data[tag];
    }

    getRawData() {
        const dataSet: any[] = [];
        if (!this.parent.isViewingDungeon) {
            // Compile data from monsters in combat zones
            this.micsr.monsterIDs.forEach((monsterID: any) => {
                dataSet.push(this.monsterSimData[monsterID]);
            });
            // Perform simulation of monsters in dungeons
            this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                dataSet.push(this.dungeonSimData[dungeonID]);
            });
            // Perform simulation of monsters in slayer tasks
            this.micsr.taskIDs.forEach(taskID => {
                dataSet.push(this.slayerSimData[taskID]);
            });
        } else if (this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            // dungeons
            const dungeonID = this.parent.viewedDungeonID;
            this.micsr.dungeons.getObjectByID(dungeonID!)!.monsters.forEach((monster: any) => {
                dataSet.push(this.monsterSimData[this.simID(monster.id, dungeonID)]);
            });
        } else if (this.parent.viewedDungeonID) {
            // slayer tasks
            const taskID = this.parent.viewedDungeonID;
            this.slayerTaskMonsters[taskID].forEach((monsterID: any) => {
                dataSet.push(this.monsterSimData[monsterID]);
            });
        }
        return dataSet;
    }

    /**
     * Finds the monsters/dungeons you can currently fight
     * @return {boolean[]}
     */
    getEnterSet() {
        const enterSet = [];
        // Compile data from monsters in combat zones
        for (const area of this.micsr.combatAreas.allObjects) {
            for (const monster of area.monsters) {
                enterSet.push(true);
            }
        }
        // Wandering Bard
        enterSet.push(true);
        // Check which slayer areas we can access with current stats and equipment
        for (const area of this.micsr.slayerAreas.allObjects) {
            // push `canEnter` for every monster in this zone
            for (const monster of area.monsters) {
                enterSet.push(
                    this.parent.game.checkRequirements(
                        area.entryRequirements,
                        undefined,
                        area.slayerLevelRequired,
                        area instanceof SlayerArea
                    )
                );
            }
        }
        // Perform simulation of monsters in dungeons and auto slayer
        this.micsr.dungeonIDs.forEach((_: string) => {
            enterSet.push(true);
        });
        this.micsr.taskIDs.forEach(taskID =>
            this.slayerTaskMonsters[taskID].forEach((_: string) => {
                enterSet.push(true);
            })
        );
        return enterSet;
    }
}

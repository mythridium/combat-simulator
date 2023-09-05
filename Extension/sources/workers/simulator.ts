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

(async () => {
    // spoof MICSR
    const logging = {
        debug: (...args: any[]) => console.debug("MICSR:", ...args),
        log: (...args: any[]) => console.log("MICSR:", ...args),
        warn: (...args: any[]) => console.warn("MICSR:", ...args),
        error: (...args: any[]) => console.error("MICSR:", ...args),
    };

    // spoof document
    const document = {
        getElementById() {},
        createElement() {},
    };

    // spoof $ so we get useful information regarding where the bugs are
    const $ = (...args: any[]) => console.log(...args);

    importScripts("https://steam.melvoridle.com/assets/js/pako.min.js");

    // Fake globals
    const combatMenus = {
        eventMenu: {
            setButtonCallbacks() {},
        },
    };

    self.addModalToQueue = () => undefined;

    // Hard to copy functions
    const levelUnlockSum = (skill: Skill<BaseSkillData>) => (previous: number, current: Skill<BaseSkillData>) => {
        if (skill.level >= current.level) previous++;
        return previous;
      };

    let combatSimulator: CombatSimulator;

    onmessage = async (event) => {
        /*
    // TODO: remove temporary reply
    switch (event.data.action) {
        case 'RECEIVE_GAMEDATA':
            // constants
            event.data.constantNames.forEach((name: any) => {
                self[name] = event.data.constants[name];
            });
            // functions
            event.data.functionNames.forEach((name: any) => {
                eval(event.data.functions[name]);
            });
            // classes
            event.data.classNames.forEach((name: any) => {
                eval(event.data.classes[name]);
            });
            // create instances
            return;
        case 'START_SIMULATION':
            postMessage({
                action: 'FINISHED_SIM',
                monsterID: event.data.monsterID,
                dungeonID: event.data.dungeonID,
                simResult: {
                    // success
                    simSuccess: true,
                    reason: undefined,
                    tickCount: 10,
                    // xp rates
                    xpPerSecond: 10,
                    hpXpPerSecond: 10,
                    slayerXpPerSecond: 10,
                    prayerXpPerSecond: 10,
                    summoningXpPerSecond: 10,
                    // consumables
                    ppConsumedPerSecond: 10,
                    ammoUsedPerSecond: 0,
                    runesUsedPerSecond: 0,
                    usedRunesBreakdown: 0,
                    combinationRunesUsedPerSecond: 0,
                    potionsUsedPerSecond: 0, // TODO: divide by potion capacity
                    tabletsUsedPerSecond: 0,
                    atePerSecond: 0,
                    // survivability
                    deathRate: 0.5,
                    highestDamageTaken: 10,
                    lowestHitpoints: 10,
                    // kill time
                    killTimeS: 10,
                    killsPerSecond: 0.1,
                    // loot gains
                    baseGpPerSecond: 10, // gpPerSecond is computed from this
                    dropChance: NaN,
                    signetChance: NaN,
                    petChance: NaN,
                    petRolls: [],
                    slayerCoinsPerSecond: 0,
                    // not displayed -> TODO: remove?
                    simulationTime: NaN,
                },
                selfTime: 0,
            });
            return;
        case 'CANCEL_SIMULATION':
            combatSimulator.cancelSimulation();
            return;
    }
     */
        switch (event.data.action) {
            case "RECEIVE_GAMEDATA":
                // debugger;

                // constants
                event.data.constantNames.forEach((name: any) => {
                    // this.micsr.log('constant', name, event.data.constants[name])
                    // logging.log('constant', name)
                    self[name] = event.data.constants[name];
                });
                // functions
                event.data.functionNames.forEach((name: any) => {
                    // this.micsr.log('function', name, event.data.functions[name])
                    // logging.log('function', name)
                    eval(event.data.functions[name]);
                });
                // classes
                event.data.classNames.forEach((name: any) => {
                    // logging.log('class', name)
                    eval(event.data.classes[name]);
                });

                // create instances
                // restore data
                const cloneData = new CloneData();
                cloneData.restoreModifierData();
                SlayerTask.data = event.data.slayerTaskData;
                // Save off global object
                // @ts-expect-error
                self.exp = new ExperienceCalculator();
                const full = event.data.dataPackage.Full;
                const toth = event.data.dataPackage.TotH;
                // @ts-expect-error
                cloudManager.hasTotHEntitlement = !!toth;
                // @ts-expect-error
                cloudManager.hasFullVersionEntitlement = !!full;

                const micsr = new MICSR();
                const simGame = new SimGame(micsr, true);
                micsr.dataPackage = event.data.dataPackage;
                micsr.cleanupDataPackage("Demo");
                if (cloudManager.hasFullVersionEntitlement) {
                    micsr.cleanupDataPackage("Full");
                }
                if (cloudManager.hasTotHEntitlement) {
                    micsr.cleanupDataPackage("TotH");
                }

                // @ts-expect-error
                Summoning.markLevels = event.data.SummoningMarkLevels;

                await micsr.initialize(simGame, simGame as any);

                // @ts-expect-error
                self.firstSkillAction = true;
                self.saveData = (vars?) => {};
                // @ts-expect-error
                self.deleteScheduledPushNotification = () => {};

                combatSimulator = new CombatSimulator(micsr);
                break;
            case "START_SIMULATION":
                const startTime = performance.now();
                //settings
                // run the simulation
                combatSimulator
                    .simulateMonster(
                        event.data.saveString,
                        event.data.monsterID,
                        event.data.dungeonID,
                        event.data.trials,
                        event.data.maxTicks
                    )
                    .then((simResult: any) => {
                        const timeTaken = performance.now() - startTime;
                        postMessage({
                            action: "FINISHED_SIM",
                            monsterID: event.data.monsterID,
                            dungeonID: event.data.dungeonID,
                            simResult: simResult,
                            selfTime: timeTaken,
                        });
                    });
                break;
            case "CANCEL_SIMULATION":
                combatSimulator.cancelSimulation();
                break;
        }
    };

    onerror = (error) => {
        postMessage({
            action: "ERR_SIM",
            error: error,
        });
    };
})();

class CombatSimulator {
    cancelStatus: any;
    micsr: MICSR;

    constructor(micsr: MICSR) {
        this.micsr = micsr;
        this.cancelStatus = false;
    }

    /**
     * Simulation Method for a single monster
     */
    async simulateMonster(
        saveString: string,
        monsterID: string,
        dungeonID: string,
        trials: number,
        maxTicks: number
    ) {
        try {
            // this.micsr.log("Creating manager");
            const reader = new SaveWriter("Read", 1);
            const saveVersion = reader.setDataFromSaveString(saveString);
            this.micsr.game.decodeSimple(reader, saveVersion);
            this.micsr.game.onLoad();
            this.micsr.game.combat.player.initForWebWorker();

            // this.micsr.log("Finished setup");
            return this.micsr.game.combat.convertSlowSimToResult(
                this.micsr.game.combat.runTrials(
                    monsterID,
                    dungeonID,
                    trials,
                    maxTicks
                ),
                trials
            );
        } catch (error) {
            this.micsr.error(
                `Error while simulating monster ${monsterID} in dungeon ${dungeonID}: ${error}`
            );
            let reason = "simulation error";
            if (error instanceof Error) {
                reason += `: ${error.message}`;
            }
            return {
                simSuccess: false,
                reason: reason,
            };
        }
    }

    /**
     * Checks if the simulation has been messaged to be cancelled
     * @return {Promise<boolean>}
     */
    async isCanceled() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.cancelStatus);
            });
        });
    }

    cancelSimulation() {
        this.cancelStatus = true;
    }
}

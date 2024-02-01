import { MICSR } from 'src/shared/micsr';

export class CombatSimulator {
    cancelStatus: any;
    micsr: MICSR;

    constructor(micsr: MICSR) {
        this.micsr = micsr;
        this.cancelStatus = false;
    }

    /** Simulation Method for a single monster */
    public async simulateMonster(
        saveString: string,
        monsterID: string,
        dungeonID: string,
        trials: number,
        maxTicks: number
    ) {
        try {
            const reader = new SaveWriter('Read', 1);
            const saveVersion = reader.setDataFromSaveString(saveString);

            this.micsr.game.decodeSimple(reader, saveVersion);
            this.micsr.game.onLoad();
            this.micsr.game.combat.player.initForWebWorker();

            return this.micsr.game.combat.convertSlowSimToResult(
                this.micsr.game.combat.runTrials(monsterID, dungeonID, trials, maxTicks, undefined),
                trials
            );
        } catch (error) {
            this.micsr.logger.error(`Error while simulating monster ${monsterID} in dungeon ${dungeonID}: ${error}`);
            let reason = 'simulation error';

            if (error instanceof Error) {
                reason += `: ${error.message}`;
            }

            return {
                simSuccess: false,
                reason: reason
            };
        }
    }

    /** Checks if the simulation has been messaged to be cancelled */
    public isCanceled() {
        return new Promise(resolve => setTimeout(() => resolve(this.cancelStatus)));
    }

    public cancelSimulation() {
        this.cancelStatus = true;
    }
}

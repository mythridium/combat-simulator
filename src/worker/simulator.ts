import { Global } from './global';

export class Simulator {
    public cancelStatus = false;

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

            Global.micsr.game.decodeSimple(reader, saveVersion);
            Global.micsr.game.onLoad();
            Global.micsr.game.combat.player.initForWebWorker();

            return Global.micsr.game.combat.convertSlowSimToResult(
                Global.micsr.game.combat.runTrials(monsterID, dungeonID, trials, maxTicks, undefined),
                trials
            );
        } catch (error) {
            Global.micsr.logger.error(
                `Error while simulating monster ${monsterID} in dungeon ${dungeonID}: ${error.stack}`
            );
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

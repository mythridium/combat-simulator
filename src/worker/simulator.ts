import { Global } from './global';

export class Simulator {
    /** Simulation Method for a single monster */
    public async simulateMonster(
        saveString: string,
        monsterId: string,
        entityId: string,
        trials: number,
        maxTicks: number
    ) {
        try {
            Global.cancelStatus = false;

            const reader = new SaveWriter('Read', 1);
            const saveVersion = reader.setDataFromSaveString(saveString);

            Global.game.decodeSimple(reader, saveVersion);
            Global.game.onLoad();
            Global.game.combat.player.initForWebWorker();

            const stats = await Global.game.combat.runTrials(monsterId, entityId, trials, maxTicks);

            return Global.game.combat.convertSlowSimToResult(stats, trials);
        } catch (error) {
            Global.logger.error(`Error while simulating monster ${monsterId} in area ${entityId}: ${error.stack}`);
            let reason = 'simulation error';

            if (error instanceof Error) {
                reason += `: ${error.message}`;
            }

            return {
                simSuccess: false,
                reason,
                stack: error.stack
            };
        }
    }

    /** Checks if the simulation has been messaged to be cancelled */
    public isCanceled() {
        return new Promise(resolve => setTimeout(() => resolve(Global.cancelStatus)));
    }

    public cancelSimulation() {
        Global.cancelStatus = true;
    }
}

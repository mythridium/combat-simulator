import type { SimCombatManager } from './sim-combat-manager';
import type { SimGame } from './sim-game';
import type { SimPlayer } from './sim-player';
import type { SimEnemy } from './sim-enemy';

/**
 * We cannot import these classes normally since they extends game classes which are not available
 * until `importScripts` is called. As a result, we need to dynamically import them at runtime after
 * this has happened.
 *
 * This is a wrapper class to keep things in one place. Would have liked to make this a more generic
 * approach, however the exports are named, and webpack needs to detect the url plus typescript can
 * pick them up directly.
 *
 * A little tedious, but shouldn't have many cases of this.
 */
export abstract class SimClasses {
    public static SimGame: typeof SimGame;
    public static SimCombatManager: typeof SimCombatManager;
    public static SimPlayer: typeof SimPlayer;
    public static SimEnemy: typeof SimEnemy;

    public static async init() {
        this.SimGame = await this.simGame();
        this.SimCombatManager = await this.simCombatManager();
        this.SimPlayer = await this.simPlayer();
        this.SimEnemy = await this.simEnemy();
    }

    private static async simGame() {
        const { SimGame } = await import(/* webpackMode: "eager" */ 'src/worker/melvor/sim-game');

        return SimGame;
    }

    private static async simCombatManager() {
        const { SimCombatManager } = await import(/* webpackMode: "eager" */ 'src/worker/melvor/sim-combat-manager');

        return SimCombatManager;
    }

    private static async simPlayer() {
        const { SimPlayer } = await import(/* webpackMode: "eager" */ 'src/worker/melvor/sim-player');

        return SimPlayer;
    }

    private static async simEnemy() {
        const { SimEnemy } = await import(/* webpackMode: "eager" */ 'src/worker/melvor/sim-enemy');

        return SimEnemy;
    }
}

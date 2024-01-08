import type { SimPlayer } from './sim-player';
import type { SimEnemy } from './sim-enemy';
import type { SimGame } from './sim-game';

export class SimCombatManager extends CombatManager {
    public declare game: SimGame;
    public declare player: SimPlayer;
    public declare enemy: SimEnemy;
}

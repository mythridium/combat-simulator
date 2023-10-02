import type { SimPlayer } from './sim-player';
import type { SimEnemy } from './sim-enemy';
import type { SimGame } from './sim-game';
import { SimClasses } from './sim-classes';
import { SimulateRequest } from 'src/shared/messages/message-type/simulate';
import { Global } from 'src/worker/global';

export class SimManager extends CombatManager {
    public declare game: SimGame;
    public declare player: SimPlayer;
    public declare enemy: SimEnemy;

    constructor(game: SimGame, namespace: DataNamespace) {
        super(game, namespace);

        this.player = new SimClasses.SimPlayer(this, game);
        this.enemy = new SimClasses.SimEnemy(this, game);
    }

    public openAreaMenu() {}
    public closeAreaMenu() {}
    public render() {}

    public simulate({ monsterId, dungeonId }: SimulateRequest) {
        const monster = this.game.monsters.getObjectByID('melvorD:Plant');
        const combatArea = this.game.combatAreas.getObjectByID('melvorD:Farmlands');

        this.game.combat.selectMonster(monster, combatArea);

        let tickCount = 0;

        while (tickCount <= 1000) {
            if (!this.game.combat.isActive && !this.game.combat.spawnTimer.active) {
                this.game.combat.selectMonster(monster, combatArea);
            }

            if (this.game.combat.paused) {
                this.game.combat.resumeDungeon();
            }

            this.game.combat.passiveTick();
            this.game.combat.activeTick();
            this.game.combat.checkDeath();
            tickCount++;
        }

        this.game.combat.endFight();
        if (this.game.combat.spawnTimer.isActive) {
            this.game.combat.spawnTimer.stop();
        }

        if (this.game.combat.enemy.state !== EnemyState.Dead) {
            this.game.combat.enemy.processDeath();
        }

        this.game.combat.loot.removeAll();
        this.game.combat.selectedArea = undefined;

        if (this.game.combat.paused) {
            this.game.combat.paused = false;
        }

        Global.logger.log(`Finished ${tickCount} ticks while fighting ${monster.id}`);
        Global.logger.log(`GP: ${this.game.customGp} | ${monsterId} | ${dungeonId}`);

        return {
            isSuccess: true
        };
    }
}

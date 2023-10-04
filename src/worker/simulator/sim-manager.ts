import type { SimPlayer } from './sim-player';
import type { SimEnemy } from './sim-enemy';
import type { SimGame } from './sim-game';
import { SimClasses } from './sim-classes';
import { SimulateRequest, SimulateStats } from 'src/shared/messages/message-type/simulate';
import { Global } from 'src/worker/global';

export class SimManager extends CombatManager {
    public declare game: SimGame;
    public declare player: SimPlayer;
    public declare enemy: SimEnemy;

    constructor(game: SimGame, namespace: DataNamespace) {
        super(game, namespace);

        this.player = new SimClasses.SimPlayer(this, game);
        this.enemy = new SimClasses.SimEnemy(this, game);

        this.reset();
    }

    public stats: SimulateStats;
    public tickCount = 0;
    public totalTicks = 0;

    public openAreaMenu() {}
    public closeAreaMenu() {}
    public render() {}
    public setCallbacks() {}
    public addCombatStat() {}
    public addMonsterStat() {}
    public dropSignetHalfB() {}
    public dropEnemyBones() {}
    public awardSkillLevelCapIncreaseForDungeonCompletion() {}

    public initialize() {
        if (this.fightInProgress) {
            this.player.target = this.player;
            this.enemy.target = this.enemy;
            this.fightInProgress = false;
            this.player.computeAllStats();
            this.player.assignEquipmentEventHandlers();
            this.enemy.computeAllStats();
            this.fightInProgress = true;
            this.enemy.target = this.player;
            this.player.target = this.enemy;
            this.player.updateConditionals('All', false, false);
            this.statUpdateOnEnemySpawn();
        } else {
            this.player.computeAllStats();
            this.player.assignEquipmentEventHandlers();
            this.enemy.computeAllStats();
        }
        this.player.computeEffectCount();
        this.enemy.computeEffectCount();
    }

    public reset() {
        this.tickCount = 0;
        this.totalTicks = 0;

        this.stats = {
            kills: 0,
            deaths: 0,
            gp: 0,
            sc: 0,
            highestDamageTaken: 0,
            lowestHitpoints: this.player.stats.maxHitpoints,
            usedAmmo: 0,
            usedFood: 0,
            usedPotions: 0,
            usedPrayerPoints: 0,
            usedConsumabes: 0,
            usedRunes: {},
            usedCominationRunes: 0,
            usedCharges: { summon1: 0, summon2: 0 },
            skillXp: this.game.skills.allObjects.reduce((result, skill) => {
                result[skill.id] = skill.xp;
                return result;
            }, {} as { [index: string]: number }),
            petRolls: {},
            ancientRelicRolls: {},
            markRolls: {}
        };
    }

    public onPlayerDeath() {
        this.stats.deaths++;
        super.onPlayerDeath();
    }

    public onEnemyDeath(): boolean {
        this.stats.kills++;
        return super.onEnemyDeath();
    }

    public tick() {
        this.passiveTick();
        this.activeTick();
        this.checkDeath();
        this.tickCount++;
    }

    public selectMonster(monster: Monster, area: CombatArea) {
        if (!this.checkAreaEntryRequirements(area)) {
            return;
        }

        this.preSelection();
        this.selectedArea = area;
        this.selectedMonster = monster;
        this.onSelection();
    }

    public preSelection() {
        return this.stop();
    }

    public onSelection() {
        this.loadNextEnemy();
        this.isActive = true;
    }

    public stop() {
        this.isActive = false;
        this.endFight();

        if (this.spawnTimer.isActive) {
            this.spawnTimer.stop();
        }

        if (this.enemy.state !== EnemyState.Dead) {
            this.enemy.processDeath();
        }

        this.loot.removeAll();
        this.selectedArea = undefined;

        if (this.paused) {
            this.paused = false;
        }

        return true;
    }

    public async simulate({ monsterId, dungeonId }: SimulateRequest) {
        const start = performance.now();
        this.game.onLoad();
        this.reset();

        const monster = this.game.monsters.getObjectByID('melvorD:Plant');
        const combatArea = this.game.combatAreas.getObjectByID('melvorD:Farmlands');

        this.selectMonster(monster, combatArea);
        this.totalTicks = 1000 * 1000;

        while (this.stats.kills + this.stats.deaths < 1000 && this.tickCount < this.totalTicks) {
            if (!this.isActive && !this.spawnTimer.active) {
                this.selectMonster(monster, combatArea);
            }

            if (this.paused) {
                this.resumeDungeon();
            }

            this.tick();
            this.player.hitpoints = this.player.stats.maxHitpoints;
        }

        this.stop();

        this.stats.skillXp = this.game.skills.allObjects.reduce((result, skill) => {
            const start = this.stats.skillXp[skill.id] || 0;

            result[skill.id] = skill.xp - start;

            return result;
        }, {} as { [index: string]: number });

        const end = performance.now() - start;

        Global.logger.log(
            `Finished ${numberWithCommas(this.tickCount)} ticks in ${Math.round(end)} ms while fighting ${monster.id}`,
            this.stats
        );

        return {
            isSuccess: true,
            stats: this.stats
        };
    }
}

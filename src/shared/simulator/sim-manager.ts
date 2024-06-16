import type { SimEnemy } from './sim-enemy';
import type { SimGame } from './sim-game';
import type { SimPlayer } from './sim-player';
import { SimClasses } from './sim';
import { Util } from 'src/shared/util';
import { Global } from 'src/shared/global';
import { Lookup } from 'src/shared/utils/lookup';

export interface SimulationGains {
    gpMelvor: number;
    gpAbyssal: number;
    skillXP: { [index: string]: number };
    abyssalSkillXP: { [index: string]: number };
    markRolls: { [index: string]: number };
    petRolls: { [index: string]: number };
    slayerCoinsMelvor: number;
    slayerCoinsAbyssal: number;
    usedAmmo: number;
    usedRunesBreakdown: { [index: string]: number };
    usedRunes: number;
    usedCombinationRunes: number;
    usedConsumables: number;
    usedFood: number;
    usedPotions: number;
    usedPrayerPointsMelvor: number;
    gainedPrayerPointsMelvor: number;
    usedPrayerPointsAbyssal: number;
    gainedPrayerPointsAbyssal: number;
    usedSummoningCharges: number;
    highestDamageTaken: number;
    highestReflectDamageTaken: number;
    lowestHitpoints: number;
}

export interface SimulationStats {
    success: boolean;
    monsterId: string;
    entityId: string;
    tickCount: number;
    realmId: string;
    simStats: {
        deathCount: number;
        killCount: number;
    };
    gainsPerSecond: SimulationGains;
    failMessage: string;
}

export interface SimulationResult {
    [index: string]: any;
    // success
    simSuccess: boolean;
    reason: string;
    stack?: string;
    tickCount: number;
    // xp rates
    xpPerSecondMelvor: number;
    hpXpPerSecondMelvor: number;
    slayerXpPerSecondMelvor: number;
    prayerXpPerSecondMelvor: number;
    summoningXpPerSecondMelvor: number;
    xpPerSecondAbyssal: number;
    hpXpPerSecondAbyssal: number;
    slayerXpPerSecondAbyssal: number;
    prayerXpPerSecondAbyssal: number;
    summoningXpPerSecondAbyssal: number;
    // consumables
    ppGainedPerSecondMelvor: number;
    ppConsumedPerSecondMelvor: number;
    ppGainedPerSecondAbyssal: number;
    ppConsumedPerSecondAbyssal: number;
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
    baseGpPerSecondMelvor: number;
    baseGpPerSecondAbyssal: number;
    gpPerSecondMelvor: number;
    gpPerSecondAbyssal: number;
    dropChance: number;
    signetChance: number;
    petChance: number;
    petRolls: { [index: string]: number };
    markChance: number;
    markRolls: { [index: string]: number };
    slayerCoinsPerSecondMelvor: number;
    slayerCoinsPerSecondAbyssal: number;
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

    firstInit = true;

    constructor(game: SimGame, namespace: DataNamespace) {
        super(game, namespace);

        this.tickCount = 0;
        this.player = new SimClasses.SimPlayer(this, game);
        this.enemy = new SimClasses.SimEnemy(this, game);
        this.simStats = {
            killCount: 0,
            deathCount: 0
        };

        this.detachGlobals();
        this.replaceGlobals();

        for (const skill of game.skills.allObjects) {
            this.registerStatProvider(skill.providedStats);
        }
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
            this.dungeonCompletion.clear();
        }

        // Set up player gamemode before combat initialize
        // TODO: This can probably be removed once we use the SimGame gamemode for everything
        this.player.currentGamemodeID = Global.get.game.currentGamemode.id;

        super.initialize();
        this.player.initialize();
    }

    // detach globals attached by parent constructor
    detachGlobals() {
        this.loot.render = () => undefined;
    }

    setButtonVisibility() {}
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

    getSimStats(
        monsterId: string,
        entityId: string,
        realmId: string,
        success: boolean,
        failMessage: string
    ): SimulationStats {
        return {
            success,
            monsterId,
            entityId,
            realmId,
            tickCount: this.tickCount,
            simStats: this.simStats,
            gainsPerSecond: this.player.getGainsPerSecond(this.tickCount),
            failMessage
        };
    }

    convertSlowSimToResult(simResult: SimulationStats, targetTrials: number): SimulationResult {
        const gps = simResult.gainsPerSecond;
        const ticksPerSecond = 1000 / TICK_INTERVAL;
        const trials = simResult.simStats.killCount + simResult.simStats.deathCount;

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
            realmId: simResult.realmId,
            // xp rates
            xpPerSecondMelvor:
                gps.skillXP[Global.get.skillIds.Attack] +
                gps.skillXP[Global.get.skillIds.Strength] +
                gps.skillXP[Global.get.skillIds.Defence] +
                gps.skillXP[Global.get.skillIds.Ranged] +
                gps.skillXP[Global.get.skillIds.Magic], // TODO: this depends on attack style
            hpXpPerSecondMelvor: gps.skillXP[Global.get.skillIds.Hitpoints],
            slayerXpPerSecondMelvor: gps.skillXP[Global.get.skillIds.Slayer],
            prayerXpPerSecondMelvor: gps.skillXP[Global.get.skillIds.Prayer],
            summoningXpPerSecondMelvor: gps.skillXP[Global.get.skillIds.Summoning],
            xpPerSecondAbyssal:
                gps.abyssalSkillXP[Global.get.skillIds.Attack] +
                gps.abyssalSkillXP[Global.get.skillIds.Strength] +
                gps.abyssalSkillXP[Global.get.skillIds.Defence] +
                gps.abyssalSkillXP[Global.get.skillIds.Ranged] +
                gps.abyssalSkillXP[Global.get.skillIds.Magic], // TODO: this depends on attack style
            hpXpPerSecondAbyssal: gps.abyssalSkillXP[Global.get.skillIds.Hitpoints],
            slayerXpPerSecondAbyssal: gps.abyssalSkillXP[Global.get.skillIds.Slayer],
            prayerXpPerSecondAbyssal: gps.abyssalSkillXP[Global.get.skillIds.Prayer],
            summoningXpPerSecondAbyssal: gps.abyssalSkillXP[Global.get.skillIds.Summoning],
            corruptionXpPerSecond: gps.abyssalSkillXP[Global.get.skillIds.Corruption],
            // consumables
            ppGainedPerSecondMelvor: gps.gainedPrayerPointsMelvor,
            ppConsumedPerSecondMelvor: gps.usedPrayerPointsMelvor,
            ppGainedPerSecondAbyssal: gps.gainedPrayerPointsAbyssal,
            ppConsumedPerSecondAbyssal: gps.usedPrayerPointsAbyssal,
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
            baseGpPerSecondMelvor: gps.gpMelvor, // gpPerSecond is computed from this
            baseGpPerSecondAbyssal: gps.gpAbyssal,
            gpPerSecondMelvor: NaN,
            gpPerSecondAbyssal: NaN,
            dropChance: NaN,
            signetChance: NaN,
            petChance: NaN,
            petRolls: gps.petRolls,
            markChance: NaN,
            markRolls: gps.markRolls,
            slayerCoinsPerSecondMelvor: gps.slayerCoinsMelvor,
            slayerCoinsPerSecondAbyssal: gps.slayerCoinsAbyssal
        };
    }

    // track kills and deaths
    onPlayerDeath() {
        this.player.processDeath();
        this.simStats.deathCount++;
    }

    onEnemyDeath(): boolean {
        this.simStats.killCount++;

        const areaProgress = this.areaProgress;
        const result = super.onEnemyDeath();

        // if we targeting a dungeon, reduce the dungeon progress since the enemy death will increment it back to the same monster.
        if (
            this.selectedArea instanceof Dungeon ||
            this.selectedArea instanceof AbyssDepth ||
            this.selectedArea instanceof Stronghold
        ) {
            this.areaProgress = areaProgress;
        }

        return result;
    }

    addCurrency(currency: Currency, baseAmount: number, source: any, modifier = 0) {
        modifier += this.getCurrencyModifier(currency);
        let amount = applyModifier(baseAmount, modifier);
        amount += this.player.modifiers.getValue('melvorD:flatCurrencyGain', currency.modQuery);

        if (amount <= 0) {
            return;
        }

        currency.add(amount);
    }

    dropSignetHalfB() {}

    dropEnemyBones() {}

    awardSkillLevelCapIncreaseForDungeonCompletion() {}

    selectMonster(monster: Monster, area: CombatArea) {
        // clone of combatManager.selectMonster
        let slayerLevelReq = 0;

        if (area instanceof SlayerArea) {
            slayerLevelReq = area.slayerLevelRequired;
        }

        if (!this.game.checkRequirements(area.entryRequirements, true, slayerLevelReq, area instanceof SlayerArea)) {
            return;
        }

        this.preSelection();
        this.setCombatArea(area);
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

        if (this.spawnTimer.isActive) {
            this.spawnTimer.stop();
        }

        if (this.enemy.state !== EnemyState.Dead) {
            this.enemy.processDeath();
        }

        this.player.removeAllEffects();
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

    spawnEnemy() {
        this.removeAllPassives();

        super.spawnEnemy();
    }

    tick() {
        // @ts-ignore
        if (this.game.currentGamemode.enableInstantActions) {
            const ticksToClick = this.tickCount % 20;

            if (this.enemy.monster !== undefined && ticksToClick < 7) {
                // @ts-ignore
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();

                for (let i = 0; i < actionsToPerform; i++) {
                    // @ts-ignore
                    this.player.actOnClick();
                }

                // @ts-ignore
                this.enemy.actOnClick();
            }
        }

        this.passiveTick();
        this.activeTick();
        this.checkDeath();
        this.tickCount++;
    }

    public async runTrials(
        monsterId: string,
        entityId: string,
        trials: number,
        tickLimit: number,
        verbose = false
    ): Promise<SimulationStats> {
        this.resetSimStats();

        const startTimeStamp = performance.now();
        const monster = Lookup.monsters.getObjectByID(monsterId);

        let area = this.game.getMonsterArea(monster);

        if (entityId !== undefined) {
            area = Lookup.getEntity(entityId) as CombatArea | SlayerArea;

            if (area instanceof Stronghold) {
                this.strongholdTier = area.mcsTier;
            } else {
                this.strongholdTier = undefined;
            }

            this.areaProgress = 0;

            while (area.monsters[this.areaProgress].id !== monsterId) {
                this.areaProgress++;
            }
        }

        const totalTickLimit = trials * tickLimit;
        let { success, failMessage } = this._canAccessArea(monster, area);

        if (!success) {
            Global.get.logger.log(`Did not meet requirements: ${monster._name} [${area._name}]`, failMessage);
        }

        if (success) {
            if (Global.get.game.combat.player.isSlayerTask) {
                const category = Lookup.getSlayerTaskForMonster(monsterId);

                if (category) {
                    Global.get.game.combat.slayerTask.category = Lookup.getSlayerTaskForMonster(monsterId);
                    Global.get.game.combat.slayerTask.monster = monster;
                    Global.get.game.combat.slayerTask.killsLeft = Number.MAX_SAFE_INTEGER;
                } else {
                    Global.get.game.combat.player.isSlayerTask = false;
                }
            }

            this.selectMonster(monster, area);

            Global.get.logger.log(`Fighting: ${monster._name} [${area._name}]`);

            while (this.simStats.killCount + this.simStats.deathCount < trials && this.tickCount < totalTickLimit) {
                // reset the call stack so cancel message can be processed by the worker
                if (!(this.tickCount % 100000)) {
                    await new Promise<void>(resolve => setTimeout(() => resolve()));
                }

                if (Global.get.cancelStatus) {
                    success = false;
                    failMessage = 'Simulation was cancelled';
                    break;
                }

                if (!this.isActive && !this.spawnTimer.active) {
                    this.selectMonster(monster, area);
                }

                if (this.paused) {
                    this.resumeDungeon();
                }

                this.tick();
            }
        }

        this.stopCombat();

        const processingTime = performance.now() - startTimeStamp;
        const simStats = this.getSimStats(monsterId, entityId, area.realm?.id, success, failMessage);

        if (verbose) {
            Global.get.logger.log(
                `Processed ${this.simStats.killCount} / ${this.simStats.deathCount} k/d and ${
                    this.tickCount
                } ticks in ${processingTime / 1000}s (${processingTime / this.tickCount}ms/tick).`,
                simStats
            );
        }

        return simStats;
    }

    private _canAccessArea(monster: Monster, area: CombatArea) {
        let success = true;
        let failMessage = '';

        if (
            monster.hasBarrier &&
            this.player.equipment.getItemInSlot('melvorD:Summon1')?.id === 'melvorD:Empty_Equipment' &&
            this.player.equipment.getItemInSlot('melvorD:Summon2')?.id === 'melvorD:Empty_Equipment'
        ) {
            success = false;
            failMessage = 'You have no summoning tablets equipped';
        }

        const hasRequirement = this.game.checkRequirements(
            area.entryRequirements,
            true,
            area instanceof SlayerArea ? area.slayerLevelRequired : undefined,
            area instanceof SlayerArea
        );

        if (!hasRequirement) {
            success = false;
            failMessage = 'Missing Slayer Area Requirements';
        }

        if (this.isCurrentDamageTypeDisallowed(area, false)) {
            success = false;
            failMessage = 'You cannot use your current Damage Type in this area.';
        }

        if (!this.checkDamageTypeRequirementsForMonster(monster, false)) {
            success = false;
            failMessage = 'This monster is immune to your current Damage Type';
        }

        return { success, failMessage };
    }
}

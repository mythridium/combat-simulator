import { Global } from 'src/shared/global';
import type { SimGame } from './sim-game';
import type { SimulationGains, SimManager } from './sim-manager';
import { Util } from 'src/shared/util';
import { GameStats } from 'src/shared/utils/game-stats';

/** SimPlayer class, allows creation of a functional Player object without affecting the game */
export class SimPlayer extends Player {
    declare game: SimGame;
    declare manager: SimManager;

    combinations: string[];
    cookingMastery: boolean;
    currentGamemodeID: string;
    chargesUsed: {
        Summon1: number;
        Summon2: number;
    };
    dataNames: {
        booleanArrays: string[];
        numberArrays: string[];
        booleans: string[];
        numbers: string[];
        strings: string[];
    };
    emptyAutoHeal: boolean;
    gpMelvor: number;
    gpAbyssal: number;
    hasRunes: boolean;
    highestDamageTaken: number;
    highestReflectDamageTaken: number;
    isManualEating: boolean;
    isSynergyUnlocked: boolean;
    isSlayerTask: boolean;
    isAutoCorrupt: boolean;
    lowestHitpoints: number;
    markRolls: { [index: string]: number };
    petRolls: { [index: string]: number };
    pillarID: string;
    pillarEliteID: string;
    skillLevel!: Map<string, number>;
    skillAbyssalLevel!: Map<string, number>;
    skillXP!: Map<string, number>;
    abyssalSkillXP!: Map<string, number>;
    slayerCoinsMelvor: number;
    slayerCoinsAbyssal: number;
    useCombinationRunesFlag: boolean;
    usedAmmo: number;
    usedFood: number;
    usedPotions: number;
    usedPrayerPointsMelvor: number;
    gainedPrayerPointsMelvor: number;
    usedPrayerPointsAbyssal: number;
    gainedPrayerPointsAbyssal: number;
    usedConsumables: number;
    usedRunes: { [index: string]: number };
    monsterSpawnTimer: number;
    ignoreAllSlayerRequirements: boolean;
    _isAttackingEnemy = false;

    public get potion() {
        return this.game.potions.getActivePotionForAction(this.game.combat);
    }

    constructor(simManager: SimManager, simGame: SimGame) {
        super(simManager, simGame);
        this.detachGlobals();

        // currentGamemode, numberMultiplier
        this.currentGamemodeID = '';
        // cooking MASTERY
        this.cookingMastery = false;
        // useCombinationRunes
        this.useCombinationRunesFlag = false;
        this.combinations = [];
        // other
        this.isSlayerTask = false;
        this.isAutoCorrupt = false;
        this.isManualEating = false;
        this.isSynergyUnlocked = true;
        this.ignoreAllSlayerRequirements = false;
        // runes in bank
        this.hasRunes = true;

        this.usedFood = 0;
        this.gpMelvor = 0;
        this.gpAbyssal = 0;
        this.slayerCoinsMelvor = 0;
        this.slayerCoinsAbyssal = 0;
        this.markRolls = {};
        this.petRolls = {};
        this.usedAmmo = 0;
        this.usedFood = 0;
        this.usedRunes = {};
        this.usedPotions = 0;
        this.gainedPrayerPointsMelvor = 0;
        this.usedPrayerPointsMelvor = 0;
        this.gainedPrayerPointsAbyssal = 0;
        this.usedPrayerPointsAbyssal = 0;
        this.usedConsumables = 0;
        this.chargesUsed = {
            Summon1: 0,
            Summon2: 0
        };
        this.highestDamageTaken = 0;
        this.highestReflectDamageTaken = 0;
        this.monsterSpawnTimer = this.baseSpawnInterval;
        // remove standard spell selection
        //this.spellSelection.standard = undefined;
        // overwrite food consumption
        this.food.consume = (quantity?: number) => {
            if (quantity) {
                this.usedFood += quantity;
            }
        };
        // data names for serialization
        this.dataNames = {
            booleanArrays: [],
            numberArrays: [],
            booleans: [
                'cookingMastery',
                'useCombinationRunesFlag',
                'isManualEating',
                'isSynergyUnlocked',
                'ignoreAllSlayerRequirements',
                'isSlayerTask',
                'isAutoCorrupt',
                'hasRunes'
            ],
            numbers: ['monsterSpawnTimer'],
            strings: ['currentGamemodeID']
        };
    }

    private _attackBar: ProgressBar;

    get attackBar() {
        return this._attackBar;
    }

    private _summonBar: ProgressBar;

    get summonBar() {
        return this._summonBar;
    }

    private _effectRenderer: EffectRenderer;

    get effectRenderer() {
        return this._effectRenderer;
    }

    private _splashManager: SplashManager;

    get splashManager() {
        return this._splashManager;
    }

    private _statElements: PlayerHTMLElements;

    get statElements() {
        return this._statElements;
    }

    // override getters
    get activeTriangle() {
        return this.gamemode.combatTriangle;
    }

    get useCombinationRunes() {
        return this.useCombinationRunesFlag;
    }

    set useCombinationRunes(useCombinationRunes) {
        this.useCombinationRunesFlag = useCombinationRunes;
    }

    get gamemode() {
        return this.manager.game.gamemodes.getObjectByID(this.currentGamemodeID)!;
    }

    get allowRegen() {
        return this.gamemode.hasRegen;
    }

    static newFromPlayerString(manager: SimManager, playerString: string) {
        const reader = new SaveWriter('Read', 1);
        reader.setDataFromSaveString(playerString);

        const newSimPlayer = new SimPlayer(manager, Global.get.game);

        newSimPlayer.decode(reader, currentSaveVersion);

        return newSimPlayer;
    }

    initForWebWorker() {
        numberMultiplier = this.gamemode.hitpointMultiplier;

        GameStats.compute();

        // recompute stats
        this.updateForEquipmentChange();
        this.resetGains();
    }

    // detach globals attached by parent constructor
    detachGlobals() {
        this._splashManager = {
            add: () => {}
        } as any;
        this._effectRenderer = {
            queueRemoval: () => {},
            queueRemoveAll: () => {},
            removeEffects: () => {},
            addStun: () => {},
            addSleep: () => {},
            addCurse: () => {},
            addDOT: () => {},
            addReflexive: () => {},
            addStacking: () => {},
            addModifier: () => {}
        } as any;
        this._statElements = undefined;
        this._attackBar = undefined;
        this._summonBar = undefined;

        Object.defineProperty(this.equipmentStats, 'damageReduction', {
            get: function () {
                // @ts-ignore // TODO: TYPES
                return this.getResistance(Global.get.game.normalDamage);
            }
        });
    }

    processDeath() {
        this.removeAllEffects(true);
        this.setHitpoints(Math.floor(this.stats.maxHitpoints * 0.2));

        while (
            this.hitpoints < this.stats.maxHitpoints &&
            this.food.currentSlot.quantity > 0 &&
            this.food.currentSlot.item.localID !== 'Empty_Food'
        ) {
            this.eatFood();
        }
    }

    // replace globals with properties
    initialize() {
        this.equipmentSets.forEach(e => {
            // TODO: TYPES
            e.equipment.removeQuantityFromSlot = (slot: any, quantity: number): boolean => {
                switch (slot) {
                    case 'melvorD:Summon1':
                        this.chargesUsed.Summon1 += quantity;
                        break;
                    case 'melvorD:Summon2':
                        this.chargesUsed.Summon2 += quantity;
                        break;
                    case 'melvorD:Consumable':
                        this.usedConsumables += quantity;
                        break;
                }
                return false;
            };
        });

        this.combinations = this.game.runecrafting.actions
            .filter(action => action.category.localID === 'CombinationRunes')
            .map(action => action.product.id);

        this.resetGains();
    }

    resetToBlankState() {
        this.setDefaultAttackStyles();
        this.changeEquipmentSet(0);
        this.equipment.unequipAll();
        this.unequipFoodAll();
        this.activePrayers.clear();
        this.resetActionState();
    }

    resetGains() {
        this.gpMelvor = 0;
        this.gpAbyssal = 0;
        this.slayerCoinsMelvor = 0;
        this.slayerCoinsAbyssal = 0;
        this.skillXP = new Map(this.game.skills.allObjects.map(skill => [skill.id, skill.xp]));
        this.abyssalSkillXP = new Map(
            this.game.skills.allObjects.map(skill => [
                skill.id,
                // @ts-ignore // TODO: TYPES
                skill.abyssalXP
            ])
        );
        this.markRolls = {};
        this.petRolls = {};
        this.usedAmmo = 0;
        this.usedFood = 0;
        this.usedRunes = {};
        this.usedPotions = 0;
        this.gainedPrayerPointsMelvor = 0;
        this.usedPrayerPointsMelvor = 0;
        this.gainedPrayerPointsAbyssal = 0;
        this.usedPrayerPointsAbyssal = 0;
        this.usedConsumables = 0;
        this.chargesUsed = {
            Summon1: 0,
            Summon2: 0
        };
        this.highestDamageTaken = 0;
        this.highestReflectDamageTaken = 0;
        this.lowestHitpoints = this.stats.maxHitpoints;
        // hack to avoid auto eating infinite birthday cakes
        const autoHealAmt = Math.floor(
            (this.getFoodHealing(this.food.currentSlot.item) * this.autoEatEfficiency) / 100
        );
        this.emptyAutoHeal = this.autoEatThreshold > 0 && autoHealAmt === 0;
        this.hitpoints = this.stats.maxHitpoints;
    }

    getGainsPerSecond(ticks: number): SimulationGains {
        let seconds = ticks / 20;
        const usedRunesBreakdown: { [index: string]: number } = {};
        let usedRunes = 0;
        let usedCombinationRunes = 0;

        for (const id in this.usedRunes) {
            const amt = this.usedRunes[id] / seconds;
            usedRunesBreakdown[id] = amt;

            if (this.combinations.includes(id)) {
                usedCombinationRunes += amt;
            } else {
                usedRunes += amt;
            }
        }

        const markRolls: { [index: string]: number } = {};

        for (const skillId in this.markRolls) {
            markRolls[skillId] = this.markRolls[skillId] / seconds;
        }

        const petRolls: { [index: string]: number } = {};

        for (const skillId in this.petRolls) {
            petRolls[skillId] = this.petRolls[skillId] / seconds;
        }

        let usedSummoningCharges = this.chargesUsed.Summon1 + this.chargesUsed.Summon2;

        if (this.chargesUsed.Summon1 > 0 && this.chargesUsed.Summon2 > 0) {
            usedSummoningCharges /= 2;
        }

        const skillGain = this.game.skills.allObjects.reduce((container, skill) => {
            const start = this.skillXP.get(skill.id) || 0;
            container[skill.id] = (skill.xp - start) / seconds;
            return container;
        }, {} as { [index: string]: number });

        const abyssalSkillGain = this.game.skills.allObjects.reduce((container, skill) => {
            // @ts-ignore // TODO: TYPES
            const start = this.abyssalSkillXP.get(skill.id) || 0;
            // @ts-ignore // TODO: TYPES
            container[skill.id] = (skill.abyssalXP - start) / seconds;
            return container;
        }, {} as { [index: string]: number });

        return {
            gpMelvor: this.gpMelvor / seconds,
            gpAbyssal: this.gpAbyssal / seconds,
            skillXP: skillGain,
            abyssalSkillXP: abyssalSkillGain,
            markRolls,
            petRolls,
            slayerCoinsMelvor: this.slayerCoinsMelvor / seconds,
            slayerCoinsAbyssal: this.slayerCoinsAbyssal / seconds,
            usedAmmo: this.usedAmmo / seconds,
            usedRunesBreakdown: usedRunesBreakdown,
            usedRunes: usedRunes,
            usedCombinationRunes: usedCombinationRunes,
            usedConsumables: this.usedConsumables / seconds,
            usedFood: this.usedFood / seconds,
            usedPotions: this.usedPotions / seconds,
            gainedPrayerPointsMelvor: this.gainedPrayerPointsMelvor / seconds,
            usedPrayerPointsMelvor: this.usedPrayerPointsMelvor / seconds,
            gainedPrayerPointsAbyssal: this.gainedPrayerPointsAbyssal / seconds,
            usedPrayerPointsAbyssal: this.usedPrayerPointsAbyssal / seconds,
            usedSummoningCharges: usedSummoningCharges / seconds,
            highestDamageTaken: this.highestDamageTaken,
            highestReflectDamageTaken: this.highestReflectDamageTaken,
            lowestHitpoints: this.lowestHitpoints
        };
    }

    // TODO: Is this correct? used to be tick
    activeTick() {
        super.activeTick();
        if (this.isManualEating) {
            this.manualEat();
        }
    }

    // eats at most once per tick
    manualEat() {
        // don't eat at full health
        if (this.hitpoints >= this.stats.maxHitpoints) {
            return;
        }
        // don't eat if eating heals 0 hp
        const healAmt = this.getFoodHealing(this.food.currentSlot.item);
        if (healAmt <= 0) {
            return;
        }
        // eat without repercussions when enemy is spawning
        if (this.manager.spawnTimer.active) {
            this.eatFood();
            return;
        }
        // don't eat outside combat
        if (this.manager.paused) {
            return;
        }
        // check dotDamage
        // TODO: this could be handled more efficiently, consider when the DOTs will hit
        const dotDamage = this.getMaxDotDamage();
        if (dotDamage >= this.hitpoints) {
            this.eatFood();
            return;
        }
        // check enemy damage
        const enemy = this.manager.enemy;
        // if enemy doesn't attack next turn, don't eat
        if (enemy.nextAction !== 'Attack') {
            return;
        }
        // number of ticks until the enemy attacks
        const tLeft = enemy.timers.act.ticksLeft;
        if (tLeft < 0) {
            return;
        }
        // max hit of the enemy attack + max dotDamage
        // TODO: this could be handled more efficiently, consider when the different attacks will hit
        const maxDamage = enemy.getAttackMaxDamage(enemy.nextAttack) + dotDamage;
        // number of ticks required to heal to safety
        const healsReq = Math.ceil((maxDamage + 1 - this.hitpoints) / healAmt);
        // don't eat until we have to
        if (healsReq < tLeft) {
            return;
        }
        this.eatFood();
    }

    equipFood(item: FoodItem, quantity: number): boolean | undefined {
        if (item.id === 'melvorD:Empty_Equipment') {
            this.unequipFood();
            return;
        }
        // Unequip previous food
        this.food.unequipSelected();
        // Proceed to equip the food
        this.food.equip(item, Number.MAX_SAFE_INTEGER);
    }

    unequipFood() {
        this.food.unequipSelected();
    }

    unequipFoodAll() {
        // Clear all slots
        this.food.slots.forEach((_, index) => {
            this.food.setSlot(index);
            this.food.unequipSelected();
        });
        // Select first slot
        this.food.setSlot(0);
    }

    computeDamageType() {
        // @ts-ignore // TODO: TYPES
        super.computeDamageType();

        // @ts-ignore // TODO: TYPES
        this.damageType = Global.get.game.damageTypes.getObjectByID(this.damageType.id);
    }

    autoEat() {
        if (this.emptyAutoHeal) {
            this.usedFood = Infinity;
        } else {
            super.autoEat();
        }
    }

    getMaxDotDamage() {
        // @ts-ignore // TODO: TYPES
        const effects = Array.from(this.activeEffects.values()).filter(
            // @ts-ignore // TODO: TYPES
            effect => effect.effect.damageGroups.total !== undefined
        );

        if (!effects.length) {
            return 0;
        }

        // @ts-ignore // TODO: TYPES
        return effects.map(effect => effect.getDamage('total')).reduce((a, b) => a + b, 0);
    }

    rollForSummoningMarks(skill: AnySkill, interval: number): void {
        if (this.markRolls[skill.id] === undefined) {
            this.markRolls[skill.id] = 0;
        }

        this.markRolls[skill.id] += interval;
    }

    rewardXPAndPetsForDamage(damage: number): void {
        super.rewardXPAndPetsForDamage(damage);
    }

    computeLevels() {
        this.levels.Hitpoints = this.getSkillLevel(this.game.hitpoints);
        this.levels.Attack = this.getSkillLevel(this.game.attack);
        this.levels.Strength = this.getSkillLevel(this.game.strength);
        this.levels.Defence = this.getSkillLevel(this.game.defence);
        this.levels.Ranged = this.getSkillLevel(this.game.ranged);
        this.levels.Magic = this.getSkillLevel(this.game.altMagic);
        this.levels.Prayer = this.getSkillLevel(this.game.prayer);
        // @ts-ignore // TODO: TYPES
        this.levels.Corruption = this.getSkillLevel(this.game.corruption);
    }

    computeAbyssalLevels() {
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Hitpoints = this.getSkillAbyssalLevel(this.game.hitpoints);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Attack = this.getSkillAbyssalLevel(this.game.attack);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Strength = this.getSkillAbyssalLevel(this.game.strength);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Defence = this.getSkillAbyssalLevel(this.game.defence);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Ranged = this.getSkillAbyssalLevel(this.game.ranged);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Magic = this.getSkillAbyssalLevel(this.game.altMagic);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Prayer = this.getSkillAbyssalLevel(this.game.prayer);
            // @ts-ignore // TODO: TYPES
            this.abyssalLevels.Corruption = this.getSkillAbyssalLevel(this.game.corruption);
        }
    }

    // Get skill level from property instead of game skills
    getSkillLevel(skill: CombatSkill | AltMagic) {
        if (!skill) {
            return 0;
        }

        // @ts-ignore // TODO: TYPES
        return Math.min(skill.maxLevelCap, this.skillLevel.get(skill.id)) + this.modifiers.getHiddenSkillLevels(skill);
    }

    getSkillAbyssalLevel(skill: CombatSkill | AltMagic) {
        // @ts-ignore // TODO: TYPES
        return Math.min(skill.maxAbyssalLevelCap, this.skillAbyssalLevel.get(skill.id));
    }

    // track prayer point usage instead of consuming
    consumePrayerPoints(amount: number, isUnholy: boolean) {
        if (amount > 0) {
            amount = this.applyModifiersToPrayerCost(amount, isUnholy);
            this.usedPrayerPointsMelvor += amount;

            const event = new (<any>PrayerPointConsumptionEvent)(amount, isUnholy);
            this._events.emit('prayerPointsUsed', event);
        }
    }

    consumeSoulPoints(amount: number) {
        if (amount > 0) {
            // @ts-ignore // TODO: TYPES
            amount = this.applyModifiersToSoulPointCost(amount);
            this.usedPrayerPointsAbyssal += amount;

            // @ts-ignore // TODO: TYPES
            const event = new SoulPointConsumptionEvent(amount);
            this._events.emit('soulPointsUsed', event);
        }
    }

    addPrayerPoints(amount: number): void {
        this.gainedPrayerPointsMelvor += amount;
    }

    addSoulPoints(amount: number): void {
        this.gainedPrayerPointsAbyssal += amount;
    }

    removeFromQuiver(qty: number) {
        this.usedAmmo += qty;
    }

    updateForEquipmentChange() {
        const hpPercent = this.hitpointsPercent;
        // @ts-ignore // TODO: TYPES
        this.manager.computeAllStats();
        this.assignEquipmentEventHandlers();
        this.interruptAttack();

        if (this.manager.fightInProgress) {
            this.target.combatModifierUpdate();
        }

        if (hpPercent !== this.hitpointsPercent) {
            this.setHitpoints(Math.round(this.stats.maxHitpoints * (hpPercent / 100)));
        }
    }

    equipItem(
        item: EquipmentItem,
        set: number = 0,
        slot: SlotTypes | 'Default' = item.validSlots[0],
        quantity: number = 1,
        isImporting = false
    ): boolean {
        if (this.checkIfCantEquip()) {
            return false;
        }

        // @ts-ignore // TODO: TYPES
        if (!slot.allowQuantity) {
            quantity = 1;
        }

        quantity = Math.min(this.manager.bank.getQty(item), quantity);

        if (quantity === 0) {
            throw new Error('Tried to equip item when none is owned.');
        }

        const existingSlot = this.equipment.getSlotOfItem(item);

        if (existingSlot !== undefined) {
            // @ts-ignore // TODO: TYPES
            if (slot.allowQuantity && existingSlot === slot) {
                return true;
            } else {
                notifyPlayer(
                    this.game.attack,
                    templateLangString('TOASTS_ITEM_ALREADY_EQUIPPED', {
                        itemName: item.name
                    }),
                    'danger'
                );
                return false;
            }
        }

        if (!item.isModded && !this.game.checkRequirements(item.equipRequirements, true)) {
            notifyPlayer(this.game.attack, 'Could not equip item due to requirements not being met.', 'danger');
            return false;
        }

        const itemsToAdd = this.equipment.getItemsAddedOnEquip(item, slot);
        const conflictingItems: EquipmentItem[] = [];

        // @ts-ignore // TODO: TYPES
        for (const conflictingItem of item.cantEquipWith) {
            if (
                this.equipment.checkForItem(conflictingItem) &&
                !itemsToAdd.some(removed => removed.item === conflictingItem)
            ) {
                conflictingItems.push(conflictingItem);
            }
        }

        if (conflictingItems.length > 0) {
            notifyPlayer(
                this.game.attack,
                templateLangString('TOASTS_CANNOT_EQUIP_WITH', {
                    itemName: item.name,
                    conflictingItemName: conflictingItems[0].name
                }),
                'danger'
            );
            return false;
        }

        // @ts-ignore // TODO: TYPES
        this.equipment.equipItem(item, slot, quantity);

        if (!isImporting) {
            if (set === this.selectedEquipmentSet) {
                this.updateForEquipmentChange();
            } else {
                this.updateForEquipSetChange();
            }
        }

        return true;
    }

    unequipItem(set: number, slot: SlotTypes): boolean {
        this.equipment.unequipItem(slot);
        this.updateForEquipmentChange();
        return true;
    }

    getMonsterSpawnTime() {
        if (!Util.isWebWorker) {
            return super.getMonsterSpawnTime();
        }

        return this.monsterSpawnTimer;
    }

    // don't disable selected spells
    checkMagicUsage() {
        const allowMagic = this.attackType === 'magic' || this.modifiers.allowAttackAugmentingMagic > 0;
        this.canAurora = allowMagic;
        this.canCurse =
            (allowMagic && !this.usingAncient) || this.equipment.checkForItemID('melvorTotH:Voodoo_Trinket');
    }

    attack(target: Character, attack: SpecialAttack): number {
        this._isAttackingEnemy = true;

        const damage = super.attack(target, attack);

        this._isAttackingEnemy = false;

        return damage;
    }

    damage(amount: number, source: SplashType, thieving?: boolean): void {
        super.damage(amount, source);

        if (
            (this._isAttackingEnemy && !this.target.isAttacking) ||
            (this._isAttackingEnemy && this.target.isAttacking && this.attackCount === 0)
        ) {
            this.highestReflectDamageTaken = Math.max(this.highestReflectDamageTaken, amount);
        } else {
            this.highestDamageTaken = Math.max(this.highestDamageTaken, amount);
        }

        this.lowestHitpoints = Math.min(this.lowestHitpoints, this.hitpoints);
    }

    setPotion(newPotion: PotionItem | undefined) {
        if (newPotion) {
            this.game.potions.usePotion(newPotion);
        } else if (this.potion) {
            this.game.potions.removePotion(this.potion.action);
        }
    }

    hasKey<O extends object>(obj: O, key: PropertyKey): key is keyof O {
        return key in obj;
    }

    /** Encode the SimPlayer object */
    encode(writer: SaveWriter) {
        super.encode(writer);

        this.monsterSpawnTimer = this.getMonsterSpawnTime();

        this.dataNames.booleanArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                Global.get.logger.verbose('encode boolean array', x, this[x]);
                writer.writeArray(this[x] as unknown as any[], (object: any, writer: any) =>
                    writer.writeBoolean(object)
                );
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numberArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                Global.get.logger.verbose('encode number array', x, this[x]);
                writer.writeArray(this[x] as unknown as any[], (object: any, writer: any) => writer.writeInt32(object));
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.booleans.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                Global.get.logger.verbose('encode boolean', x, this[x]);
                writer.writeBoolean(this[x] as unknown as boolean);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numbers.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                Global.get.logger.verbose('encode number', x, this[x]);
                writer.writeInt32(this[x] as unknown as number);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.strings.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                Global.get.logger.verbose('encode string', x, this[x]);
                writer.writeString(this[x] as unknown as string);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        writer.writeMap(
            this.skillLevel,
            (key, writer) => writer.writeString(key),
            (value, writer) => writer.writeUint32(value)
        );
        Global.get.logger.verbose('encode skillLevel', this.skillLevel);
        writer.writeMap(
            this.skillAbyssalLevel,
            (key, writer) => writer.writeString(key),
            (value, writer) => writer.writeUint32(value)
        );
        Global.get.logger.verbose('encode skillAbyssalLevel', this.skillAbyssalLevel);
        //writer.writeString(this.potion?.id || "");
        Global.get.logger.verbose('encode potion id', this.potion?.id);
        writer.writeArray(Array.from(Global.get.game.petManager.unlocked), (p, w) => w.writeNamespacedObject(p));
        Global.get.logger.verbose('encode petUnlocked', Array.from(Global.get.game.petManager.unlocked));
        return writer;
    }

    /** Decode the SimPlayer object */
    decode(reader: SaveWriter, version: number) {
        this.skillLevel = new Map(this.game.skills.allObjects.map(skill => [skill.id, 1]));
        this.skillLevel.set(this.game.hitpoints.id, 10);
        this.skillAbyssalLevel = new Map(this.game.skills.allObjects.map(skill => [skill.id, 1]));

        // clear all existing active potions making sure the event handlers are cleared up.
        this.game.potions['activePotions'].forEach(() => this.game.potions.removePotion(this.manager));

        super.decode(reader, version);
        // We don't have these extra values when creating the SimGame on the game side
        if (!Util.isWebWorker) {
            return;
        }
        this.dataNames.booleanArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getArray((reader: any) => reader.getBoolean());
                Global.get.logger.verbose('decode boolean array', x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numberArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getArray((reader: any) => reader.getInt32());
                Global.get.logger.verbose('decode number array', x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.booleans.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getBoolean();
                Global.get.logger.verbose('decode boolean', x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numbers.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getInt32();
                Global.get.logger.verbose('decode number', x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.strings.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getString();
                Global.get.logger.verbose('decode string', x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.skillLevel = reader.getMap(
            reader => reader.getString(),
            reader => reader.getUint32()
        );
        Global.get.logger.verbose('decode skillLevel', this.skillLevel);
        this.skillAbyssalLevel = reader.getMap(
            reader => reader.getString(),
            reader => reader.getUint32()
        );
        Global.get.logger.verbose('decode skillLevel', this.skillAbyssalLevel);
        reader.getArray(r => {
            const pet = r.getNamespacedObject(this.game.pets) as Pet;
            Global.get.game.petManager.unlocked.add(pet);
        });
        Global.get.logger.verbose('decode petUnlocked', Array.from(Global.get.game.petManager.unlocked));

        // @ts-ignore // TODO: TYPES
        Global.get.game.settings.boolData.enablePermaCorruption.currentValue = this.isAutoCorrupt;

        this.skillXP = new Map(this.game.skills.allObjects.map(skill => [skill.id, skill.xp]));

        this.abyssalSkillXP = new Map(
            this.game.skills.allObjects.map(skill => [
                skill.id,
                // @ts-ignore // TODO: TYPES
                skill.abyssalXP
            ])
        );
    }

    public setRenderAll() {}
    public render() {}
    public renderFood() {}
    public renderActiveSkillModifiers() {}
    public renderAttackBar() {}
    public renderAttackIcon() {}
    public renderAttackStyle() {}
    public renderAutoEat() {}
    public renderBarrier() {}
    public renderCombatLevel() {}
    public renderCombatTriangle() {}
    public renderDamageSplashes() {}
    public renderDamageValues() {}
    public renderEffects() {}
    public renderEquipmentSets() {}
    public renderHitchance() {}
    public renderHitpoints() {}
    public renderModifierEffect() {}
    public renderPrayerPoints() {}
    public renderPrayerSelection() {}
    public renderStats() {}
    public renderSummonBar() {}
    public renderSummonMaxHit() {}
    public addItemStat() {}
    public trackPrayerStats() {}
    public trackWeaponStat() {}
    public setCallbacks() {}
    public onMagicAttackFailure() {}
    public fireMissSplash() {}
}

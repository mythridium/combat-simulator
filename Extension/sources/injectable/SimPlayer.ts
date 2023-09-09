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

/**
 * SimPlayer class, allows creation of a functional Player object without affecting the game
 */
class SimPlayer extends Player {
    combinations: string[];
    cookingMastery: boolean;
    cookingPool: boolean;
    course: number[];
    courseMastery: boolean[];
    currentGamemodeID: string;
    dataNames: {
        booleanArrays: string[];
        numberArrays: string[];
        booleans: string[];
        numbers: string[];
        strings: string[];
    };
    emptyAutoHeal: any;
    gp: number;
    hasRunes: boolean;
    healAfterDeath: boolean;
    highestDamageTaken: any;
    isManualEating: any;
    isSolarEclipse: boolean;
    isSlayerTask: boolean;
    lowestHitpoints: any;
    petRolls: any;
    petUnlocked: Pet[];
    pillarID: string;
    pillarEliteID: string;
    skillLevel!: Map<string, number>;
    skillXP!: Map<string, number>;
    slayercoins: number;
    useCombinationRunesFlag: boolean;
    usedAmmo: number;
    usedFood: number;
    usedPotions: number;
    usedPrayerPoints: number;
    usedRunes: { [index: string]: number };
    monsterSpawnTimer: number;

    // @ts-expect-error Force SimGame type
    game!: SimGame;
    // @ts-expect-error Force SimManager type
    manager: SimManager;
    micsr: MICSR;

    public get potion() {
        return this.game.potions.getActivePotionForAction(this.game.combat);
    }

    constructor(simManager: SimManager, simGame: SimGame) {
        super(simManager as any, simGame as any);
        this.micsr = simManager.micsr;
        this.detachGlobals();

        // currentGamemode, numberMultiplier
        this.currentGamemodeID = "";
        // petUnlocked
        this.petUnlocked = [];
        // chosenAgilityObstacles, agility MASTERY, agilityPassivePillarActive
        this.course = [];
        this.courseMastery = [];
        this.pillarID = "";
        this.pillarEliteID = "";
        // cooking MASTERY
        this.cookingPool = false;
        this.cookingMastery = false;
        // useCombinationRunes
        this.useCombinationRunesFlag = false;
        this.combinations = [];
        // other
        this.healAfterDeath = true;
        this.isSlayerTask = false;
        this.isManualEating = false;
        this.isSolarEclipse = false;
        // runes in bank
        this.hasRunes = true;

        this.usedFood = 0;
        this.gp = 0;
        this.slayercoins = 0;
        this.petRolls = {};
        this.usedAmmo = 0;
        this.usedFood = 0;
        this.usedRunes = {};
        this.usedPotions = 0;
        this.usedPrayerPoints = 0;
        this.chargesUsed = {
            Summon1: 0,
            Summon2: 0,
        };
        this.highestDamageTaken = 0;
        this.monsterSpawnTimer = this.baseSpawnInterval;
        // remove standard spell selection
        this.spellSelection.standard = undefined;
        // overwrite food consumption
        this.food.consume = (quantity?: number) => {
            if (quantity) {
                this.usedFood += quantity;
            }
        };
        // data names for serialization
        this.dataNames = {
            booleanArrays: ["courseMastery"],
            numberArrays: ["course"],
            booleans: [
                "cookingPool",
                "cookingMastery",
                "useCombinationRunesFlag",
                "healAfterDeath",
                "isManualEating",
                "isSolarEclipse",
                "isSlayerTask",
                "hasRunes",
            ],
            numbers: ["monsterSpawnTimer"],
            strings: [
                "currentGamemodeID",
                "pillarID",
                "pillarEliteID",
            ],
        };
    }

    _attackBar: any;

    get attackBar() {
        return this._attackBar;
    }

    _effectRenderer: any;

    get effectRenderer() {
        return this._effectRenderer;
    }

    _splashManager: any;

    get splashManager() {
        return this._splashManager;
    }

    _statElements: any;

    get statElements() {
        return this._statElements;
    }

    _summonBar: any;

    get summonBar() {
        return this._summonBar;
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
        return this.manager.game.gamemodes.getObjectByID(
            this.currentGamemodeID
        )!;
    }

    get allowRegen() {
        return this.gamemode.hasRegen;
    }

    static newFromPlayerString(manager: SimManager, playerString: string) {
        const reader = new SaveWriter("Read", 1);
        reader.setDataFromSaveString(playerString);
        // reader.setRawData(playerString)
        const newSimPlayer = new SimPlayer(manager, manager.micsr.game);
        newSimPlayer.decode(reader, manager.micsr.currentSaveVersion);
        return newSimPlayer;
    }

    initForWebWorker() {
        numberMultiplier = this.gamemode.hitpointMultiplier;
        // recompute stats
        this.updateForEquipmentChange();
        this.resetGains();
    }

    // detach globals attached by parent constructor
    detachGlobals() {
        this._splashManager = {
            add: () => {},
        };
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
            addModifier: () => {},
        };
        this._statElements = undefined;
        this._attackBar = undefined;
        this._summonBar = undefined;
    }

    addItemStat() {}

    trackPrayerStats() {}

    trackWeaponStat() {}

    setCallbacks() {}

    processDeath() {
        this.removeAllEffects(true);
        this.setHitpoints(Math.floor(this.stats.maxHitpoints * 0.2));
        // heal after death if required
        while (
            this.healAfterDeath &&
            this.hitpoints < this.stats.maxHitpoints &&
            this.food.currentSlot.quantity > 0 &&
            this.food.currentSlot.item.localID !== "Empty_Food"
        ) {
            this.eatFood();
        }
    }

    // replace globals with properties
    initialize() {
        if(this.course.length === 0){
            this.course = Array(this.game.agility.maxObstacles).fill(-1);
            this.courseMastery = Array(this.game.agility.maxObstacles).fill(false);
        }
        this.equipmentSets.forEach((e) => {
            e.equipment.removeQuantityFromSlot = (
                slot: SlotTypes,
                quantity: number
            ): boolean => {
                switch (slot) {
                    case "Summon1":
                    case "Summon2":
                        this.chargesUsed[slot] += quantity;
                        break;
                }
                return false;
            };
        });

        this.combinations = this.game.runecrafting.actions
            .filter((x) => x.category.localID === "CombinationRunes")
            .map((x) => x.product.id);
        this.resetGains();
    }

    resetToBlankState() {
        this.changeEquipmentSet(0);
        this.equipment.unequipAll();
        this.unequipFoodAll();
        this.activePrayers.clear();
    }

    rollForSummoningMarks() {}

    resetGains() {
        this.gp = 0;
        this.slayercoins = 0;
        this.skillXP = new Map(
            this.game.skills.allObjects.map((skill) => [skill.id, skill.xp])
        );
        this.petRolls = {};
        this.usedAmmo = 0;
        this.usedFood = 0;
        this.usedRunes = {};
        this.usedPotions = 0;
        this.usedPrayerPoints = 0;
        this.chargesUsed = {
            Summon1: 0,
            Summon2: 0,
        };
        this.highestDamageTaken = 0;
        this.lowestHitpoints = this.stats.maxHitpoints;
        // hack to avoid auto eating infinite birthday cakes
        const autoHealAmt = Math.floor(
            (this.getFoodHealing(this.food.currentSlot.item) *
                this.autoEatEfficiency) /
                100
        );
        this.emptyAutoHeal = this.autoEatThreshold > 0 && autoHealAmt === 0;
        this.hitpoints = this.stats.maxHitpoints;
    }

    getGainsPerSecond(ticks: number): ISimGains {
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
        const petRolls: any = {};
        for (const interval in this.petRolls) {
            petRolls[interval] = this.petRolls[interval] / seconds;
        }
        let usedSummoningCharges =
            this.chargesUsed.Summon1 + this.chargesUsed.Summon2;
        if (this.chargesUsed.Summon1 > 0 && this.chargesUsed.Summon2 > 0) {
            usedSummoningCharges /= 2;
        }
        const skillGain = this.game.skills.allObjects.reduce(
            (container, skill) => {
                const start = this.skillXP.get(skill.id) || 0;
                container[skill.id] = (skill.xp - start) / seconds;
                return container;
            },
            {} as { [index: string]: number }
        );
        return {
            gp: this.gp / seconds,
            skillXP: skillGain,
            petRolls: petRolls,
            slayercoins: this.slayercoins / seconds,
            usedAmmo: this.usedAmmo / seconds,
            usedRunesBreakdown: usedRunesBreakdown,
            usedRunes: usedRunes,
            usedCombinationRunes: usedCombinationRunes,
            usedFood: this.usedFood / seconds,
            usedPotions: this.usedPotions / seconds,
            usedPrayerPoints: this.usedPrayerPoints / seconds,
            usedSummoningCharges: usedSummoningCharges / seconds,
            highestDamageTaken: this.highestDamageTaken,
            lowestHitpoints: this.lowestHitpoints,
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
        if (!this.manager.paused) {
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
        if (enemy.nextAction !== "Attack") {
            return;
        }
        // number of ticks until the enemy attacks
        // @ts-expect-error
        const tLeft = enemy.timers.act.ticksLeft;
        if (tLeft < 0) {
            return;
        }
        // max hit of the enemy attack + max dotDamage
        // TODO: this could be handled more efficiently, consider when the different attacks will hit
        const maxDamage =
            enemy.getAttackMaxDamage(enemy.nextAttack) + dotDamage;
        // number of ticks required to heal to safety
        const healsReq = Math.ceil((maxDamage + 1 - this.hitpoints) / healAmt);
        // don't eat until we have to
        if (healsReq < tLeft) {
            return;
        }
        this.eatFood();
    }

    equipFood(item: FoodItem, quantity: number): boolean | undefined {
        if (item.id === "melvorD:Empty_Equipment") {
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

    getFoodHealingBonus(item: FoodItem): number {
        let bonus =
            this.modifiers.increasedFoodHealingValue -
            this.modifiers.decreasedFoodHealingValue;
        if (this.cookingMastery) {
            bonus += 20;
        }
        if (this.cookingPool) {
            bonus += 10;
        }
        return bonus;
    }

    autoEat() {
        if (this.emptyAutoHeal) {
            this.usedFood = Infinity;
        } else {
            super.autoEat();
        }
    }

    getMaxDotDamage() {
        let dotDamage = 0;
        // @ts-expect-error
        this.activeDOTs.forEach((dot: any) => {
            if (dot.type === "Regen") {
                return;
            }
            dotDamage += dot.damage;
        });
        return dotDamage;
    }

    computeModifiers() {
        super.computeModifiers();

        // Custom
        this.addPetModifiers();
        this.addAgilityModifiers();
        if (this.isSolarEclipse) {
            this.modifiers.addModifiers({ decreasedMonsterRespawnTimer: 1000 });
        }
        this.game.astrology['computeProvidedStats'](false);
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            (<any>this.game).cartography.computeProvidedStats(false);
        }
    }

    addPetModifiers() {
        this.game.pets.allObjects.forEach((pet, i) => {
            if (
                this.petUnlocked.includes(pet) &&
                !pet.activeInRaid &&
                pet.modifiers !== undefined
            ) {
                this.modifiers.addModifiers(pet.modifiers);
            }
        });
    }

    addAgilityModifiers() {
        let fullCourse = true;
        for (
            let obstacleIndex = 0;
            obstacleIndex < this.course.length;
            obstacleIndex++
        ) {
            if (this.course[obstacleIndex] < 0) {
                fullCourse = false;
                break;
            }
            const obstacle = this.micsr.actualGame.agility.actions.allObjects.find(
                (_, i) => i === this.course[obstacleIndex]
            )!;

            const modifiers = this.game.agility.getObstacleModifiers(obstacle);
            this.modifiers.addMappedModifiers(modifiers);
        }
        if (fullCourse && this.pillarID) {
            this.modifiers.addModifiers(
                this.micsr.actualGame.agility.pillars.allObjects.find(
                    (p) => p.id === this.pillarID
                )!.modifiers
            );
        }
        if (fullCourse && this.pillarEliteID) {
            this.modifiers.addModifiers(
                this.micsr.actualGame.agility.elitePillars.allObjects.find(
                    (p) => p.id === this.pillarEliteID
                )!.modifiers
            );
        }
    }

    equipmentID(slotID: EquipmentSlots) {
        return this.equipment.slotArray[slotID].item.id;
    }

    equipmentOccupiedBy(slotID: EquipmentSlots) {
        return this.equipment.slotArray[slotID].occupiedBy;
    }

    getExperienceGainSkills(): AnySkill[] {
        return super.getExperienceGainSkills();
    }

    protected rewardXPAndPetsForDamage(damage: number): void {
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
    }

    // Get skill level from property instead of game skills
    getSkillLevel(skill: CombatSkill | AltMagic) {
        return (
            Math.min(skill.levelCap, this.skillLevel.get(skill.id)!) +
            this.modifiers.getHiddenSkillLevels(skill)
        );
    }

    // don't render anything
    setRenderAll() {}

    render() {}

    // track prayer point usage instead of consuming
    consumePrayerPoints(amount: any) {
        if (amount > 0) {
            amount = this.applyModifiersToPrayerCost(amount);
            this.usedPrayerPoints += amount;
        }
    }

    removeFromQuiver(qty: number) {
        this.usedAmmo += qty;
    }

    removeFromConsumable(qty: number) {
        // TODO
    }

    onMagicAttackFailure() {}

    updateForEquipmentChange() {
        this.computeAllStats();
        this.interruptAttack();
        if (this.manager.fightInProgress) {
            this.target.combatModifierUpdate();
        }
    }

    equipItem(
        item: EquipmentItem,
        set: number,
        slot?: SlotTypes | "Default",
        quantity?: number
    ): boolean {
        const itemToEquip = item === undefined ? this.micsr.emptyItem : item;
        if (!slot || slot === "Default") {
            slot = itemToEquip.validSlots[0];
        }
        // clear other slots occupied by current slot
        this.equipment.slotArray.forEach((x: any) => {
            if (x.occupiedBy === slot) {
                x.occupiedBy = "None";
            }
        });
        this.equipment.equipItem(itemToEquip, slot, quantity || 1);
        return true;
    }

    protected unequipItem(set: number, slot: SlotTypes): boolean {
        this.equipment.unequipItem(slot);
        this.updateForEquipmentChange();
        return true;
    }

    getMonsterSpawnTime() {
        if (!this.manager.game.isWebWorker) {
            return super.getMonsterSpawnTime();
        }

        return this.monsterSpawnTimer;
    }

    // don't disable selected spells
    checkMagicUsage() {
        const allowMagic =
            this.attackType === "magic" ||
            this.modifiers.allowAttackAugmentingMagic > 0;
        this.canAurora = allowMagic;
        this.canCurse = (allowMagic && !this.usingAncient) || this.equipment.checkForItemID("melvorTotH:Voodoo_Trinket");
}

    damage(amount: number, source: SplashType, thieving?: boolean): void {
        super.damage(amount, source);
        this.highestDamageTaken = Math.max(this.highestDamageTaken, amount);
        this.lowestHitpoints = Math.min(this.lowestHitpoints, this.hitpoints);
    }

    setPotion(newPotion: PotionItem | undefined) {
        if (newPotion) {
            this.game.potions.usePotion(newPotion);
        } else if (this.potion) {
            this.game.potions.removePotion(this.potion.action);
        }
    }

    getSpellFromType(spellType: CombatSpellBook) {
        switch (spellType) {
            case "standard":
                return this.spellSelection.standard;
            case "ancient":
                return this.spellSelection.ancient;
            case "aurora":
                return this.spellSelection.aurora;
            case "curse":
                return this.spellSelection.curse;
            case "archaic":
                return this.spellSelection.archaic;
            default:
                throw new Error(`Bad spell type: ${spellType}`);
        }
    }

    setSpellFromType(spellType: CombatSpellBook, spell: CombatSpell) {
        switch (spellType) {
            case "standard":
                this.spellSelection.standard = spell as any;
                break;
            case "ancient":
                this.spellSelection.ancient = spell as any;
                break;
            case "aurora":
                this.spellSelection.aurora = spell as any;
                break;
            case "curse":
                this.spellSelection.curse = spell as any;
                break;
            case "archaic":
                this.spellSelection.archaic = spell as any;
                break;
            default:
                throw new Error(`Bad spell type: ${spellType}`);
        }
    }

    disableSpellFromType(spellType: CombatSpellBook) {
        switch (spellType) {
            case "standard":
                this.spellSelection.standard = undefined;
                break;
            case "ancient":
                this.spellSelection.ancient = undefined;
                break;
            case "aurora":
                this.spellSelection.aurora = undefined;
                break;
            case "curse":
                this.spellSelection.curse = undefined;
                break;
            case "archaic":
                this.spellSelection.archaic = undefined;
                break;
            default:
                throw new Error(`Bad spell type: ${spellType}`);
        }
    }

    hasKey<O extends object>(obj: O, key: PropertyKey): key is keyof O {
        return key in obj;
    }

    /** Encode the SimPlayer object */
    encode(writer: SaveWriter) {
        // debugger;
        super.encode(writer);

        this.monsterSpawnTimer = this.getMonsterSpawnTime();

        this.dataNames.booleanArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                this.micsr.logVerbose("encode boolean array", x, this[x]);
                writer.writeArray(
                    this[x] as unknown as any[],
                    (object: any, writer: any) => writer.writeBoolean(object)
                );
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numberArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                this.micsr.logVerbose("encode number array", x, this[x]);
                writer.writeArray(
                    this[x] as unknown as any[],
                    (object: any, writer: any) => writer.writeInt32(object)
                );
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.booleans.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                this.micsr.logVerbose("encode boolean", x, this[x]);
                writer.writeBoolean(this[x] as unknown as boolean);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numbers.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                this.micsr.logVerbose("encode number", x, this[x]);
                writer.writeInt32(this[x] as unknown as number);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.strings.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                this.micsr.logVerbose("encode string", x, this[x]);
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
        this.micsr.logVerbose("encode skillLevel", this.skillLevel);
        writer.writeString(this.potion?.id || "");
        this.micsr.logVerbose("encode potion id", this.potion?.id);
        writer.writeArray(this.petUnlocked, (p, w) =>
            w.writeNamespacedObject(p)
        );
        this.micsr.logVerbose("encode petUnlocked", this.petUnlocked);
        return writer;
    }

    /** Decode the SimPlayer object */
    decode(reader: SaveWriter, version: number) {
        this.skillLevel = new Map(
            this.game.skills.allObjects.map((skill) => [skill.id, 1])
        );
        this.skillLevel.set(this.game.hitpoints.id, 10);
        this.skillXP = new Map(
            this.game.skills.allObjects.map((skill) => [skill.id, skill.xp])
        );
        // debugger;
        super.decode(reader, version);
        // We don't have these extra values when creating the SimGame on the game side
        if (!this.manager.game.isWebWorker) {
            return;
        }
        this.dataNames.booleanArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getArray((reader: any) => reader.getBoolean());
                this.micsr.logVerbose("decode boolean array", x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numberArrays.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getArray((reader: any) => reader.getInt32());
                this.micsr.logVerbose("decode number array", x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.booleans.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getBoolean();
                this.micsr.logVerbose("decode boolean", x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.numbers.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getInt32();
                this.micsr.logVerbose("decode number", x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.dataNames.strings.forEach((x: PropertyKey) => {
            if (this.hasKey(this, x)) {
                // @ts-expect-error
                this[x] = reader.getString();
                this.micsr.logVerbose("decode string", x, this[x]);
            } else {
                throw new Error(`Missing key: ${x.toString()}`);
            }
        });
        this.skillLevel = reader.getMap(
            (reader) => reader.getString(),
            (reader) => reader.getUint32()
        );
        this.micsr.logVerbose("decode skillLevel", this.skillLevel);
        const potionId = reader.getString();
        if (potionId) {
            this.setPotion(this.game.items.potions.getObjectByID(potionId));
        }
        this.micsr.logVerbose("decode potion id", potionId);
        this.petUnlocked = reader.getArray(
            (r) => r.getNamespacedObject(this.game.pets) as Pet
        );
        this.micsr.logVerbose("decode petUnlocked", this.petUnlocked);
    }
}

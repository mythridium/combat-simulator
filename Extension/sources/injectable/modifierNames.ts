/*  Melvor Idle Combat Simulator

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
 * class ShowModifiers is copied from Melvor Show Modifiers v0.2.10, latest version can be found at:
 * https://raw.githubusercontent.com/gmiclotte/melvor-scripts/master/Show-Modifiers/Show-Modifiers.js
 * TODO: instead of copying it, pull it as a required file or something? No idea how to go about that.
 */
// start of ShowModifiers copy
class ShowModifiers {
    creasedModifiers: any;
    gatheringSkills: any;
    knownModifiers: any;
    logName: any;
    name: any;
    productionSkills: any;
    relevantModifiers: any;
    singletonModifiers: any;
    micsr: MICSR;

    constructor(micsr: MICSR, name: any, logName: any, check = true) {
        this.micsr = micsr;
        this.name = name;
        this.logName = logName;
        // increased - decreased
        this.creasedModifiers = {
            // modifiers that do not directly relate to skilling
            misc: [
                'BankSpace',
                'BankSpaceShop',
            ],
            // modifiers that relate to both combat and non-combat skilling
            skilling: [
                'ChanceToPreservePotionCharge',
                'ChanceToDoubleItemsGlobal',
                'GPFromSales',
                'GPGlobal',
                'GlobalSkillXP',
                'HiddenSkillLevel',
                'PotionChargesFlat',
                'SkillXP',
                'SummoningChargePreservation',
            ],
            // modifiers that only relate to combat and are not classified in a finer group
            combat: [
                'AttackRolls',
                'ChanceToDoubleLootCombat',
                'DamageToAllMonsters',
                'DamageToBosses',
                'DamageToCombatAreaMonsters',
                'DamageToDungeonMonsters',
                'GPFromMonsters',
                'GPFromMonstersFlat',
                'GlobalAccuracy',
                'MaxHitFlat',
                'MaxHitPercent',
                'MaxHitpoints',
                'MinHitBasedOnMaxHit',
                'MonsterRespawnTimer',
                'AttackInterval',
                'AttackIntervalPercent',
                'ChanceToApplyBurn',
                'GPOnEnemyHit',
                'BleedLifesteal',
                'BurnLifesteal',
                'PoisonLifesteal',
                'FlatMinHit',
                'DamageTaken',
                'GlobalEvasion',
                'EnemyDamageReduction'
            ],
            // modifiers that relate to healing
            hitpoints: [
                'AutoEatEfficiency',
                'AutoEatHPLimit',
                'AutoEatThreshold',
                'FoodHealingValue',
                'HPRegenFlat',
                'HitpointRegeneration',
                'Lifesteal',
                'FlatMaxHitpoints',
            ],
            // modifiers that relate to defence
            defence: [
                'DamageReduction',
                'MagicEvasion',
                'MeleeEvasion',
                'RangedEvasion',
                'ReflectDamage',
                'FlatReflectDamage',
                'RolledReflectDamage',
                'DamageReductionPercent',
            ],
            // modifiers that relate to using melee attacks
            attack: [],
            strength: [],
            melee: [
                'MeleeAccuracyBonus',
                'MeleeStrengthBonus',
                'MeleeMaxHit',
                'MeleeLifesteal',
                'MeleeCritChance',
            ],
            // modifiers that relate to using ranged attacks
            ranged: [
                'AmmoPreservation',
                'RangedAccuracyBonus',
                'RangedStrengthBonus',
                'RangedMaxHit',
                'RangedLifesteal',
                'RangedCritChance',
            ],
            // modifiers that relate to using magic attacks
            magic: [
                'MagicAccuracyBonus',
                'MagicDamageBonus',
                'MinAirSpellDmg',
                'MaxAirSpellDmg',
                'MinEarthSpellDmg',
                'MaxEarthSpellDmg',
                'MinFireSpellDmg',
                'MaxFireSpellDmg',
                'MinWaterSpellDmg',
                'MaxWaterSpellDmg',
                'RunePreservation',
                'MagicMaxHit',
                'MagicLifesteal',
                'MagicCritChance',
            ],
            // modifiers that relate to slayer tasks, areas, or monsters
            slayer: [
                'DamageToSlayerAreaMonsters',
                'DamageToSlayerTasks',
                'SlayerAreaEffectNegationFlat',
                'SlayerCoins',
                'SlayerTaskLength',
            ],
            // modifiers that relate to prayer
            prayer: [
                'ChanceToPreservePrayerPoints',
                'FlatPrayerCostReduction',
                'PrayerCost',
            ],
            // modifiers that apply to general non-combat skilling
            nonCombat: [
                'ChanceToDoubleItemsSkill',
                'SkillInterval',
                'SkillIntervalPercent',
                'ChanceAdditionalSkillResource',
            ],
            production: [
                'GlobalPreservationChance',
                'SkillPreservationChance',
            ],
            mastery: [
                'GlobalMasteryXP',
                'MasteryXP',
            ],
            // specific skills
            agility: [
                'GPFromAgility',
                'AgilityObstacleCost',
            ],
            altMagic: [
                'AltMagicSkillXP',
                'AltMagicRunePreservation',
            ],
            astrology: [],
            cooking: [
                'ChanceSuccessfulCook',
                'ChancePerfectCookGlobal',
                'ChancePerfectCookFire',
                'ChancePerfectCookFurnace',
                'ChancePerfectCookPot',
            ],
            crafting: [],
            farming: [
                'ChanceDoubleHarvest',
                'FarmingYield',
                'AllotmentSeedCost',
            ],
            firemaking: [
                'ChanceForDiamondFiremaking',
                'GPFromFiremaking',
            ],
            fishing: [
                'FishingSpecialChance',
            ],
            fletching: [],
            herblore: [
                'ChanceRandomPotionHerblore',
            ],
            mining: [
                'ChanceNoDamageMining',
                'ChanceToDoubleOres',
                'MiningNodeHP',
            ],
            runecrafting: [
                'ChanceForElementalRune',
                'ElementalRuneGain',
                'AdditionalRunecraftCountRunes',
            ],
            smithing: [
                'SeeingGoldChance',
            ],
            summoning: [
                'SummoningMaxHit',
            ],
            nonCBSummoning: [
                'SummoningShardCost',
                'SummoningCreationCharges',
            ],
            thieving: [
                'ChanceToDoubleLootThieving',
                'GPFromThieving',
                'GPFromThievingFlat',
                'ThievingStealth',
                'MinThievingGP',
            ],
            township: [],
            cartography: [],
            archaeology: [],
            woodcutting: [
                'BirdNestDropRate',
            ],
            // golbin raid
            golbinRaid: [],
            // aprilFools
            aprilFools: [],
            // modifiers that are not actually implemented in the game
            unimplemented: [
                'MaxStamina',
                'StaminaCost',
                'StaminaPerObstacle',
                'StaminaPreservationChance',
            ],
        }

        // unique modifiers, i.e. not in+de creased
        this.singletonModifiers = {
            misc: [
                'autoSlayerUnlocked',
                'dungeonEquipmentSwapping',
                'increasedEquipmentSets',
            ],
            skilling: [
                'allowSignetDrops',
                'increasedMasteryPoolProgress',
            ],
            combat: [
                'meleeProtection',
                'rangedProtection',
                'magicProtection',
                'meleeImmunity',
                'rangedImmunity',
                'magicImmunity',
                'otherStyleImmunity',
                'curseImmunity',
                'stunImmunity',
                'sleepImmunity',
                'burnImmunity',
                'poisonImmunity',
                'bleedImmunity',
                'debuffImmunity',
                'slowImmunity',
                'frostBurnImmunity',
                'masteryToken',
                'autoEquipFoodUnlocked',
                'autoSwapFoodUnlocked',
                'masteryToken',
                'freeProtectItem',
                'globalEvasionHPScaling',
                'increasedRebirthChance',
                'decreasedDragonBreathDamage',
                'increasedMeleeStunThreshold',
                'increasedChanceToIncreaseStunDuration',
                'increasedRuneProvision',
                'increasedChanceToConvertSeedDrops',
                'increasedAfflictionChance',
                'increasedChanceToApplyPoison',
                'increasedChanceToApplyFrostburn',
                'increasedEndOfTurnHealing2',
                'increasedEndOfTurnHealing3',
                'increasedEndOfTurnHealing5',
                'increasedTotalBleedDamage',
                'increasedOnHitSlowMagnitude',
                'increasedNonMagicPoisonChance',
                'increasedFrostburn',
                'increasedPoisonReflectChance',
                'increasedBleedReflectChance',
                'bonusCoalOnDungeonCompletion',
                'bypassSlayerItems',
                'itemProtection',
                'autoLooting',
                'autoBurying',
                'increasedGPMultiplierPer1MGP',
                'increasedGPMultiplierCap',
                'increasedGPMultiplierMin',
                'allowAttackAugmentingMagic',
                'summoningSynergy_0_1',
                'summoningSynergy_0_6',
                'summoningSynergy_0_7',
                'summoningSynergy_0_8',
                'summoningSynergy_0_12',
                'summoningSynergy_0_13',
                'summoningSynergy_0_14',
                'summoningSynergy_0_15',
                'summoningSynergy_1_2',
                'summoningSynergy_1_8',
                'summoningSynergy_1_12',
                'summoningSynergy_1_13',
                'summoningSynergy_1_14',
                'summoningSynergy_1_15',
                'summoningSynergy_2_13',
                'summoningSynergy_2_15',
                'summoningSynergy_6_13',
                'summoningSynergy_7_13',
                'summoningSynergy_8_13',
                'summoningSynergy_12_13',
                'summoningSynergy_12_14',
                'summoningSynergy_13_14',
                'increasedChanceToPreserveFood',
                'allowLootContainerStacking',
                'infiniteLootContainer',
            ],
            hitpoints: [
                'decreasedRegenerationInterval',
            ],
            defence: [],
            attack: [],
            strength: [],
            melee: [
                'increasedMeleeStunChance',
                'summoningSynergy_6_7',
                'summoningSynergy_6_12',
                'summoningSynergy_6_14',
                'summoningSynergy_6_15',
            ],
            ranged: [
                'summoningSynergy_7_8',
                'summoningSynergy_7_12',
                'summoningSynergy_7_14',
                'summoningSynergy_7_15',
            ],
            magic: [
                'increasedConfusion',
                'increasedDecay',
                'summoningSynergy_6_8',
                'summoningSynergy_8_14',
                'increasedMinNatureSpellDamageBasedOnMaxHit',
                'increasedSurgeSpellAccuracy',
                'increasedSurgeSpellMaxHit',
                'increasedElementalEffectChance',
            ],
            slayer: [
                'summoningSynergy_2_12',
                'summoningSynergy_8_12',
            ],
            prayer: [
                'increasedRedemptionPercent',
                'increasedRedemptionThreshold',
            ],
            nonCombat: [
                'increasedOffItemChance',
                'doubleItemsSkill',
            ],
            production: [],
            mastery: [],
            // specific skills
            agility: [],
            altMagic: [],
            astrology: [
                'increasedBaseStardustDropQty',
            ],
            cooking: [
                'decreasedSecondaryFoodBurnChance',
                'summoningSynergy_3_9',
                'summoningSynergy_4_9',
                'summoningSynergy_9_17',
                'summoningSynergy_9_18',
                'summoningSynergy_9_19',
            ],
            crafting: [
                'summoningSynergy_5_16',
                'summoningSynergy_9_16',
                'summoningSynergy_10_16',
                'summoningSynergy_16_17',
                'summoningSynergy_16_18',],
            farming: [
                'freeCompost',
                'increasedCompostPreservationChance',
            ],
            firemaking: [
                'freeBonfires',
                'increasedFiremakingCoalChance',
                'summoningSynergy_3_19',
                'summoningSynergy_4_19',
                'summoningSynergy_9_19',
                'summoningSynergy_16_19',
                'summoningSynergy_18_19',
            ],
            fishing: [
                'summoningSynergy_3_5',
                'summoningSynergy_4_5',
                'summoningSynergy_5_9',
                'summoningSynergy_5_18',],
            fletching: [],
            herblore: [],
            mining: [
                'increasedMiningGemChance',
                'doubleOresMining',
                'increasedBonusCoalMining',
                'summoningSynergy_4_5',
                'summoningSynergy_4_10',
                'summoningSynergy_4_16',
                'summoningSynergy_4_17',
                'summoningSynergy_4_18',
            ],
            runecrafting: [
                'increasedRunecraftingEssencePreservation',
                'summoningSynergy_3_10',
                'summoningSynergy_5_10',
                'summoningSynergy_10_17',
                'summoningSynergy_10_18',
                'summoningSynergy_10_19',],
            smithing: [
                'decreasedSmithingCoalCost',
                'summoningSynergy_5_17',
                'summoningSynergy_9_17',
                'summoningSynergy_10_17',
                'summoningSynergy_17_18',
                'summoningSynergy_17_19',
            ],
            summoning: [],
            nonCBSummoning: [],
            thieving: [
                'increasedThievingSuccessRate',
                'increasedThievingSuccessCap',
                'summoningSynergy_3_11',
                'summoningSynergy_4_11',
                'summoningSynergy_5_11',
                'summoningSynergy_9_11',
                'summoningSynergy_10_11',
                'summoningSynergy_11_16',
                'summoningSynergy_11_17',
                'summoningSynergy_11_18',
                'summoningSynergy_11_19',
            ],
            township: [],
            cartography: [],
            archaeology: [],
            woodcutting: [
                'increasedTreeCutLimit',
                'summoningSynergy_3_4',
                'summoningSynergy_3_16',
                'summoningSynergy_3_17',
                'summoningSynergy_3_18',
                'summoningSynergy_3_19',
            ],
            // golbin raid modifiers
            golbinRaid: [
                'golbinRaidIncreasedMaximumAmmo',
                'golbinRaidIncreasedMaximumRunes',
                'golbinRaidIncreasedMinimumFood',
                'golbinRaidIncreasedPrayerLevel',
                'golbinRaidIncreasedPrayerPointsStart',
                'golbinRaidIncreasedPrayerPointsWave',
                'golbinRaidIncreasedStartingRuneCount',
                'golbinRaidPassiveSlotUnlocked',
                'golbinRaidPrayerUnlocked',
                'golbinRaidStartingWeapon',
                'golbinRaidWaveSkipCostReduction',
            ],
            // chaos mode modifiers
            aprilFools: [
                'aprilFoolsIncreasedMovementSpeed',
                'aprilFoolsDecreasedMovementSpeed',
                'aprilFoolsIncreasedTeleportCost',
                'aprilFoolsDecreasedTeleportCost',
                'aprilFoolsIncreasedUpdateDelay',
                'aprilFoolsDecreasedUpdateDelay',
                'aprilFoolsIncreasedLemonGang',
                'aprilFoolsDecreasedLemonGang',
                'aprilFoolsIncreasedCarrotGang',
                'aprilFoolsDecreasedCarrotGang',
            ],
            unimplemented: [],
        }

        if (check) {
            this.checkUnknownModifiers();
        }

        // map of relevant modifiers per tag
        this.relevantModifiers = {};

        // all
        this.relevantModifiers.all = this.getModifierNames(
            Object.getOwnPropertyNames(this.creasedModifiers),
            this.micsr.game.skills.allObjects.map((skill, x: number) => skill.id),
        );

        // misc
        this.relevantModifiers.misc = this.getModifierNames(['misc'], []);

        // golbin raid
        this.relevantModifiers.golbin = this.getModifierNames(['golbinRaid'], []);

        // all combat
        this.relevantModifiers.combat = this.getModifierNames(
            [
                'skilling',
                'combat',
            ],
            [
                this.micsr.skillIDs.Attack,
                this.micsr.skillIDs.Strength,
                this.micsr.skillIDs.Ranged,
                this.micsr.skillIDs.Magic,
                this.micsr.skillIDs.Defence,
                this.micsr.skillIDs.Hitpoints,
                this.micsr.skillIDs.Prayer,
                this.micsr.skillIDs.Slayer,
                this.micsr.skillIDs.Summoning
            ],
        );

        // melee combat
        this.relevantModifiers.melee = this.getModifierNames(
            [
                'skilling',
                'combat',
            ],
            [
                this.micsr.skillIDs.Attack,
                this.micsr.skillIDs.Strength,
                this.micsr.skillIDs.Defence,
                this.micsr.skillIDs.Hitpoints,
                this.micsr.skillIDs.Prayer,
                this.micsr.skillIDs.Slayer,
                this.micsr.skillIDs.Summoning,
            ],
        );

        // ranged combat
        this.relevantModifiers.ranged = this.getModifierNames(
            [
                'skilling',
                'combat',
            ],
            [
                this.micsr.skillIDs.Ranged,
                this.micsr.skillIDs.Defence,
                this.micsr.skillIDs.Hitpoints,
                this.micsr.skillIDs.Prayer,
                this.micsr.skillIDs.Slayer,
                this.micsr.skillIDs.Summoning,
            ],
        );

        // magic combat
        this.relevantModifiers.magic = this.getModifierNames(
            [
                'skilling',
                'combat',
                'hitpoints',
            ],
            [
                this.micsr.skillIDs.Magic,
                this.micsr.skillIDs.Defence,
                this.micsr.skillIDs.Hitpoints,
                this.micsr.skillIDs.Prayer,
                this.micsr.skillIDs.Slayer,
                this.micsr.skillIDs.Summoning,
            ],
        );

        // slayer
        this.relevantModifiers.slayer = this.getModifierNames(
            [
                'skilling',
            ],
            [
                this.micsr.skillIDs.Slayer,
            ],
        );

        // gathering skills
        this.gatheringSkills = ['Woodcutting', 'Fishing', 'Mining', 'Thieving', 'Farming', 'Agility', 'Astrology'];
        this.gatheringSkills.forEach((name: any) => {
            this.relevantModifiers[name] = this.getModifierNames(
                [
                    'skilling',
                    'nonCombat',
                    'mastery',
                ],
                [
                    this.micsr.skillIDs[name]
                ],
            );
            const lname = name.toLowerCase();
            if (this.creasedModifiers[lname] !== undefined) {
                this.relevantModifiers[name].names.push(this.creasedModifiers[lname]);
            }
            if (this.singletonModifiers[lname] !== undefined) {
                this.relevantModifiers[name].names.push(this.singletonModifiers[lname]);
            }
        });

        // production skills
        this.productionSkills = ['Firemaking', 'Cooking', 'Smithing', 'Fletching', 'Crafting', 'Runecrafting', 'Herblore', 'Summoning'];
        this.productionSkills.forEach((name: any) => {
            const setNames = [
                'skilling',
                'nonCombat',
                'production',
                'mastery',
            ];
            if (name === 'Summoning') {
                setNames.push('nonCBSummoning');
            }
            this.relevantModifiers[name] = this.getModifierNames(
                setNames,
                [
                    this.micsr.skillIDs[name]
                ],
            );
        });

        // whatever alt magic is
        this.relevantModifiers.altMagic = this.getModifierNames(
            [
                'skilling',
                'nonCombat',
                'altMagic',
            ],
            [],
        );

        // golbin raid
        this.relevantModifiers.golbinRaid = this.getModifierNames(
            ['golbinRaid'],
            [],
        );
    }

    log(...args: any[]) {
        console.log(`${this.logName}:`, ...args);
    }

    checkUnknownModifiers() {
        // list of known modifiers
        this.knownModifiers = {};
        for (const subset in this.creasedModifiers) {
            this.creasedModifiers[subset].forEach((modifier: any) => {
                this.knownModifiers[`increased${modifier}`] = true;
                this.knownModifiers[`decreased${modifier}`] = true;
            });
        }
        for (const subset in this.singletonModifiers) {
            this.singletonModifiers[subset].forEach((modifier: any) => {
                this.knownModifiers[modifier] = true;
            });
        }

        // check for unknown modifiers
        const modifierNames = [
            ...Object.getOwnPropertyNames(this.micsr.game.combat.player.modifiers),
            // @ts-expect-error TS(2304): Cannot find name 'modifierData'.
            ...Object.getOwnPropertyNames(modifierData).filter(x => modifierData[x].isSkill),
        ];
        let hasUnknownModifiers = false;
        modifierNames.forEach(modifier => {
            if (modifier === 'skillModifiers') {
                return;
            }
            if (this.knownModifiers[modifier]) {
                return;
            }
            hasUnknownModifiers = true;
            this.log(`unknown modifier ${modifier}`);
        });
        if (!hasUnknownModifiers) {
            this.log('no unknown modifiers detected!')
        }

        // check for non-existent modifiers
        let hasNonExistentModifiers = false;
        for (const modifier in this.knownModifiers) {
            if (!modifierNames.includes(modifier)) {
                hasNonExistentModifiers = true;
                this.log(`non-existent modifier ${modifier}`);
            }
        }
        if (!hasNonExistentModifiers) {
            this.log('no non-existent modifiers detected!')
        }
    }

    getModifierNames(setNames: any, skillIDs: string[]) {
        // add skill based on skillID
        skillIDs.forEach((id: any) => {
            if (!setNames.includes(this.micsr.skillNamesLC[id])) {
                setNames.push(this.micsr.skillNamesLC[id]);
            }
        });
        // add melee based on att/str skillID
        if (skillIDs.includes(this.micsr.skillIDs.Attack) || skillIDs.includes(this.micsr.skillIDs.Strength)) {
            if (!setNames.includes('melee')) {
                setNames.push('melee');
            }
        }
        // gather modifiers
        return {
            names: [...new Set([
                ...setNames.map((name: any) => this.creasedModifiers[name]).reduce((a: any, x: any) => [...a, ...x], []),
                ...setNames.map((name: any) => this.singletonModifiers[name]).reduce((a: any, x: any) => [...a, ...x], []),
            ])],
            skillIDs: skillIDs,
        };
    }

    printUniqueModifier(modifier: any, value: any, skillID: any) {
        if (!value) {
            return [];
        }
        // convert to array if required
        const valueToPrint = skillID !== undefined ? [skillID, value] : value;
        return [printPlayerModifier(modifier, valueToPrint)];
    }

    printDiffModifier(modifier: any, value: any, skillID = undefined) {
        // compute difference
        if (!value) {
            return [];
        }
        // store if value is positive or negative
        const positive = value > 0;
        // take absolute value
        let valueToPrint = positive ? value : -value;
        // convert to array if required
        valueToPrint = skillID !== undefined ? [skillID, valueToPrint] : valueToPrint;
        // print increased or decreased
        if (positive) {
            // @ts-expect-error TS(2304): Cannot find name 'printPlayerModifier'.
            return [printPlayerModifier('increased' + modifier, valueToPrint)];
        }
        // @ts-expect-error TS(2304): Cannot find name 'printPlayerModifier'.
        return [printPlayerModifier('decreased' + modifier, valueToPrint)];
    }

    getModifierValue(modifiers: any, modifier: any, skillID = undefined) {
        if (!this.isSkillModifier(modifier)) {
            return this.getSimpleModifier(modifiers, modifier);
        }
        return this.getSkillModifier(modifiers, modifier, skillID);
    }

    getSimpleModifier(modifiers: any, modifier: any) {
        // unique
        if (this.isUniqueModifier(modifier)) {
            return modifiers[modifier];
        }
        // creased
        let increased = modifiers['increased' + modifier];
        if (!increased) {
            increased = 0;
        }
        let decreased = modifiers['decreased' + modifier];
        if (!decreased) {
            decreased = 0;
        }
        return increased - decreased;
    }

    getSkillModifier(modifiers: any, modifier: any, skillID: any) {
        const skillModifiers = modifiers.skillModifiers ? modifiers.skillModifiers : modifiers;
        // unique
        if (this.isUniqueModifier(modifier)) {
            const map = this.skillModifierMapAux(skillModifiers, modifier);
            return this.skillModifierAux(map, skillID);
        }
        // creased
        const increased = this.skillModifierMapAux(skillModifiers, 'increased' + modifier);
        const decreased = this.skillModifierMapAux(skillModifiers, 'decreased' + modifier);
        return this.skillModifierAux(increased, skillID) - this.skillModifierAux(decreased, skillID);
    }

    skillModifierMapAux(map: any, skillID: any) {
        if (!map) {
            return [];
        }
        let tmp;
        if (map.constructor.name === 'Map') {
            tmp = map.get(skillID);
        } else {
            tmp = map[skillID];
        }
        return tmp ? tmp : [];
    }

    skillModifierAux(map: any, skillID: any) {
        if (!map || map.length === 0) {
            return 0;
        }
        if (map.constructor.name === 'Map') {
            const value = map.get(skillID);
            if (!value) {
                return 0
            }
            return value;
        }
        return map.filter((x: any) => x[0] === skillID)
            .map((x: any) => x[1])
            .reduce((a: any, b: any) => a + b, 0);
    }

    printModifier(modifiers: any, modifier: any, skillIDs: any) {
        if (!this.isSkillModifier(modifier)) {
            const value = this.getSimpleModifier(modifiers, modifier);
            if (this.isUniqueModifier(modifier)) {
                // unique
                // @ts-expect-error TS(2554): Expected 3 arguments, but got 2.
                return this.printUniqueModifier(modifier, value);
            }
            // creased
            return this.printDiffModifier(modifier, value);
        }
        // skillModifiers
        return skillIDs.map((skillID: any) => {
            const value = this.getSkillModifier(modifiers, modifier, skillID);
            if (this.isUniqueModifier(modifier)) {
                // unique
                return this.printUniqueModifier(modifier, value, skillID);
            }
            // creased
            return this.printDiffModifier(modifier, value, skillID);
        }).reduce((a: any, b: any) => a.concat(b), []);
    }

    isUniqueModifier(modifier: any) {
        // @ts-expect-error TS(2304): Cannot find name 'modifierData'.
        return modifierData[modifier] !== undefined;
    }

    isSkillModifier(modifier: any) {
        if (this.isUniqueModifier(modifier)) {
            // @ts-expect-error TS(2304): Cannot find name 'modifierData'.
            return modifierData[modifier].isSkill;
        }
        // @ts-expect-error TS(2304): Cannot find name 'modifierData'.
        const data = modifierData['increased' + modifier];
        if (data === undefined) {
            // this.log(`Unknown modifier ${modifier}`);
            return false;
        }
        return data.isSkill;
    }

    printRelevantModifiers(modifiers: any, tag: string) {
        const relevantNames = this.relevantModifiers[tag].names;
        const skillIDs = this.relevantModifiers[tag].skillIDs;
        const toPrint: any = [];
        relevantNames.forEach((name: any) => {
            this.printModifier(modifiers, name, skillIDs).forEach((result: any) => toPrint.push(result));
        });
        return toPrint;
    }

    makeTagButton(tag: any, text: any, icon: any) {
        return '<div class="dropdown d-inline-block ml-2">'
            + '<button type="button" '
            + 'class="btn btn-sm btn-dual text-combat-smoke" '
            + 'id="page-header-modifiers" '
            + `onclick="window.${this.name}.replaceRelevantModifiersHtml(player.modifiers, '${text}', '${tag}');" `
            + 'aria-haspopup="true" '
            + 'aria-expanded="true">'
            + `<img class="skill-icon-xxs" src="${icon}">`
            + '</button>'
            + '</div>';
    }

    replaceRelevantModifiersHtml(modifiers: any, text: any, tag: any) {
        $('#show-modifiers').replaceWith(this.printRelevantModifiersHtml(modifiers, text, tag));
    }

    printRelevantModifiersHtml(modifiers: any, text: any, tag: any, id = 'show-modifiers') {
        let passives = `<div id="${id}"><br/>`;
        passives += `<h5 class=\"font-w400 font-size-sm mb-1\">${text}</h5><br/>`;
        // @ts-expect-error TS(7006): Parameter 'toPrint' implicitly has an 'any' type.
        this.printRelevantModifiers(modifiers, tag).forEach(toPrint => {
            passives += `<h5 class=\"font-w400 font-size-sm mb-1 ${toPrint[1]}\">${toPrint[0]}</h5>`;
        });
        passives += '</div>';
        return passives;
    }

    showRelevantModifiers(modifiers: any, text: any, tag = 'all') {
        let passives = `<h5 class=\"font-w600 font-size-sm mb-1 text-combat-smoke\">${text}</h5><h5 class=\"font-w600 font-size-sm mb-3 text-warning\"></h5>`;
        passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Does not include non-modifier effects)</small></h5>`;
        passives += this.makeTagButton('all', 'All Modifiers', 'assets/media/main/completion_log.svg');
        passives += this.makeTagButton('golbinRaid', 'Golbin Raid', 'assets/media/main/raid_coins.svg');
        passives += this.makeTagButton('combat', 'Combat', 'assets/media/skills/combat/combat.svg');
        passives += this.makeTagButton('melee', 'Melee', 'assets/media/skills/attack/attack.svg');
        passives += this.makeTagButton('ranged', 'Ranged', 'assets/media/skills/ranged/ranged.svg');
        passives += this.makeTagButton('magic', 'Combat Magic', 'assets/media/skills/combat/spellbook.svg');
        passives += this.makeTagButton('slayer', 'Slayer', 'assets/media/skills/slayer/slayer.svg');
        passives += '<br/>';
        this.gatheringSkills.forEach((skill: any) => passives += this.makeTagButton(skill, skill, `assets/media/skills/${skill.toLowerCase()}/${skill.toLowerCase()}.svg`));
        passives += '<br/>';
        this.productionSkills.forEach((skill: any) => passives += this.makeTagButton(skill, skill, `assets/media/skills/${skill.toLowerCase()}/${skill.toLowerCase()}.svg`));
        passives += this.makeTagButton('altMagic', 'Alt. Magic', 'assets/media/skills/magic/magic.svg');
        passives += this.printRelevantModifiersHtml(modifiers, 'All Modifiers', tag);
        Swal.fire({
            html: passives,
        });
    }
}
// end of ShowModifiers copy


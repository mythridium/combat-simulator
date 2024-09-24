import { Global } from 'src/shared/global';

export interface ActiveModifier {
    description: { text: string; isNegative: boolean; isDisabled: boolean };
    value: number;
    sources: ActiveModifierSource[];
}

export interface ActiveModifierSource {
    name: string;
    value: number;
    media?: string;
    description: { text: string; isNegative: boolean; isDisabled: boolean };
}

export abstract class ModifierHelper {
    public static get activeModifiers() {
        const modifiers: ActiveModifier[] = [];

        for (const [_, entries] of Global.get.game.combat.player.modifiers.entriesByID) {
            if (!entries?.length || !entries.some(entry => this.isCombatModifier(entry.data.scope as ModifierValue))) {
                continue;
            }

            // remove currency related action skill modifiers.
            const modifierEntries = entries.filter(
                entry => !(entry.data.scope.skill && entry.data.scope.action && entry.data.scope.currency)
            );

            if (!modifierEntries.length) {
                continue;
            }

            // special handling for action related modifiers
            if (modifierEntries.some(entry => entry.data.scope.action !== undefined)) {
                const actionEntries = modifierEntries
                    .filter(entry => entry.data.scope.action !== undefined)
                    .map(entry => ({
                        entry,
                        modifier: new ModifierValue(entry.data.modifier, entry.data.value, entry.data.scope)
                    }));

                const entry = actionEntries[0];

                const description = this.getDescription(
                    new ModifierValue(entry.entry.data.modifier, entry.entry.data.value)
                );

                description.text += ` (For ${actionEntries.length} Actions)`;

                modifiers.push({
                    description,
                    value: actionEntries.reduce((sum, current) => (sum += current.entry.data.value), 0),
                    sources: actionEntries.map(({ entry, modifier }) => ({
                        name: entry.data.source.name,
                        media: (<any>entry.data.source).media ?? (<any>entry.data.scope.action).media,
                        value: entry.data.value,
                        description: this.getDescription(modifier)
                    }))
                });
            }

            const grouped = new Map<string | number, ModifierTableEntry[]>();

            for (const entry of modifierEntries) {
                if (entry.data.scope.action !== undefined) {
                    continue;
                }

                if (!entry.scopeUIDs?.length) {
                    const current = grouped.get('') ?? [];
                    current.push(entry);
                    grouped.set('', current);
                    continue;
                }

                for (const scope of entry.scopeUIDs) {
                    const current = grouped.get(scope) ?? [];
                    current.push(entry);
                    grouped.set(scope, current);
                }
            }

            const groupedEntries = Array.from(grouped.values());

            for (const group of groupedEntries) {
                const sources = [];
                let modifier;

                for (const entry of group) {
                    if (!this.isCombatModifier(entry.data.scope as ModifierValue)) {
                        continue;
                    }

                    if (modifier === undefined) {
                        modifier = new ModifierValue(entry.data.modifier, entry.data.value, entry.data.scope);
                    } else {
                        modifier.value += entry.data.value;
                    }

                    sources.push({
                        entry,
                        modifier: new ModifierValue(entry.data.modifier, entry.data.value, entry.data.scope)
                    });
                }

                if (!modifier) {
                    continue;
                }

                modifiers.push({
                    description: this.getDescription(modifier),
                    value: sources.reduce((sum, current) => (sum += current.entry.data.value), 0),
                    sources: sources.map(source => this.toSource(source))
                });
            }
        }

        return modifiers;
    }

    public static hasCombatModifiers(stats: StatObject): boolean {
        if (!stats?.hasStats) {
            return false;
        }

        const modifiers = stats.modifiers?.some(modifier => this.isCombatModifier(modifier));
        const enemyModifiers = stats.enemyModifiers?.some(modifier => this.isCombatModifier(modifier));
        const conditionalModifiers = stats.conditionalModifiers?.some(
            cond =>
                cond.modifiers?.some(modifier => this.isCombatModifier(modifier)) ||
                cond.enemyModifiers?.some(modifier => this.isCombatModifier(modifier))
        );

        return modifiers || enemyModifiers || conditionalModifiers || stats.combatEffects?.length > 0;
    }

    public static isCombatModifier(entry: ModifierValue): boolean {
        if (entry.modifier.isCombat) {
            return true;
        }

        return this.theBigListOfModifiersThatAreNotCombatButActuallyCombat.some(
            id => this.withKey(entry.modifier, id) && this.isCombatSkillScope(entry)
        );
    }

    private static getDescription(value: ModifierValue) {
        let description = value.print();

        if (description?.text.includes('Error:')) {
            description = new ModifierValue(value.modifier, 1, {}).print(0, 0);
        }

        return description;
    }

    private static toSource({ entry, modifier }: { entry: ModifierTableEntry; modifier: any }): ActiveModifierSource {
        const source: ActiveModifierSource = {
            name: entry.data.source.name,
            media:
                (<any>entry.data.source).media ??
                entry.data.scope?.skill?.media ??
                (<any>entry.data.source)?.skill?.media,
            value: entry.data.value,
            description: this.getDescription(modifier)
        };

        if ((<any>entry.data.source).originalSource) {
            source.name = (<any>entry.data.source).originalSource.name;
            source.media = (<any>entry.data.source).originalSource.media;
        }

        if (entry.data.source instanceof SkillTree) {
            source.name = `${entry.data.source.name} ${entry.data.source.skill.name} Skill Tree`;
            source.media = entry.data.source.skill.media;
        }

        if (entry.data.source instanceof WorldMap) {
            source.media = Global.get.game.cartography?.media;
        }

        if (entry.data.source instanceof SummoningSynergy) {
            source.media = 'assets/media/skills/summoning/synergy.svg';
        }

        return source;
    }

    private static withKey(modifier: Modifier, key: string) {
        return modifier.id === key;
    }

    private static isCombatSkillScope(modifier: ModifierValue) {
        // asume a modifier without a skill is global
        if (!modifier.skill) {
            return true;
        }

        // combat has no action currency modifiers, ignore these.
        if (modifier.skill && modifier.action && modifier.currency) {
            return false;
        }

        return (
            Global.get.combatSkillLocalIds.includes(modifier.skill.localID) ||
            Global.get.combatAbyssalSkillLocalIds.includes(modifier.skill.localID)
        );
    }

    private static theBigListOfModifiersThatAreNotCombatButActuallyCombat: string[] = [
        'melvorD:potionChargePreservationChance',
        'melvorD:skillXP',
        'melvorD:globalItemDoublingChance',
        'melvorD:flatPotionCharges',
        'melvorD:potionCharges',
        'melvorD:magicMinHitBasedOnMaxHitSlayerTask',
        'melvorD:allowSignetDrops',
        'melvorD:summoningChargePreservationChance',
        'melvorD:autoEquipFoodUnlocked',
        'melvorD:autoSwapFoodUnlocked',
        'melvorD:consumablePreservationChance',
        'melvorD:ancientRelicLocationChance',
        'melvorD:skillPetLocationChance',
        'melvorD:halveSkillXP',
        'melvorD:enableSolarEclipseSeason',
        'melvorD:unlockAllSummoningSynergies',
        'melvorD:removeDebuffsFromAgility',
        'melvorD:doubleModifiersInAstrologyForMaxedConstellations',
        'melvorD:hPRegenBasedOnMaxHP',
        'melvorD:abyssalSkillXP',
        'melvorD:damageDealtToAbyssalSlayerAreaMonsters',
        'melvorD:skillPreservationCap',
        'melvorD:flatSoulPointsWhenHit',
        'melvorD:maxHitWith2AbyssalPrayers',
        'melvorD:abyssalPrayerCost',
        'melvorD:flatCombatAXPAgainstCorruptedMonsters',
        'melvorD:meleeStrengthBonusWith2HWeapon',
        'melvorD:evasionWith2HWeapon',
        'melvorD:flatMeleeDefenceBonusPerAbyssalLevel',
        'melvorD:flatRangedDefenceBonusPerAbyssalLevel',
        'melvorD:flatMagicDefenceBonusPerAbyssalLevel',
        'melvorD:abyssalCombatSkillXP',
        'melvorD:rangedStrengthBonusWith2HWeapon',
        'melvorD:magicDamageBonusWith2HWeapon',
        'melvorD:flatSoulPointsFromReleasing',
        'melvorD:slayerTaskExtensionCost',
        'melvorD:permanentCorruptionCost',
        'melvorD:slashAttackBonus',
        'melvorD:meleeAccuracyRatingWith2H',
        'melvorD:flatHiddenSkillLevel',
        'melvorD:skillItemDoublingChance',
        'melvorD:flatHiddenSkillLevelPer2Levels',
        'melvorD:flatHiddenSkillLevelBasedOnLevels',
        'melvorD:flatMeleeStrengthBonusBasedOnSkillLevel',
        'melvorD:flatHiddenSkillLevelPer3Levels',
        'melvorD:flatResistance',
        'melvorD:flatResistanceAgainstMelee',
        'melvorD:flatResistanceAgainstRanged',
        'melvorD:flatResistanceAgainstMagic',
        'melvorD:resistance',
        'melvorD:halveResistance',
        'melvorD:flatResistanceAgainstBosses',
        'melvorD:flatResistanceAgainstSlayerTasks',
        'melvorD:flatResistanceWithMagic2HWeapon',
        'melvorD:flatResistancePer30Defence',
        'melvorD:flatResistanceWithActivePrayer',
        'melvorD:maxHitBasedOnResistance',
        'melvorD:maxHitBasedOnTargetResistance',
        'melvorD:evasionBasedOnResistance',
        'melvorD:meleeStrengthBonusPer10EnemyResistance',
        'melvorD:flatMeleeDefenceBonusBasedOnResistance',
        'melvorD:flatRangedDefenceBonusBasedOnResistance',
        'melvorD:flatMagicDefenceBonusBasedOnResistance',
        'melvorD:ignoreResistanceWhenAttackingChance',
        'melvorD:healingOnHitBasedOnTargetResistance',
        'melvorD:healingOnAttackBasedOnResistance',
        'melvorD:maxHitAgainstDamageType',
        'melvorD:accuracyRatingAgainstDamageType',
        'melvorD:doubleItemsChanceAgainstDamageType',
        'melvorD:damageDealtToDamageTypeSlayerTasks',
        'melvorD:evasionAgainstDamageType',
        'melvorD:maxHitpointsAgainstDamageType',
        'melvorD:currencyGain',
        'melvorD:currencyGainFromCombat',
        'melvorD:flatCurrencyGainFromMonsterDrops',
        'melvorD:flatCurrencyGainOnEnemyHit',
        'melvorD:flatCurrencyGainOnHitOnSlayerTask',
        'melvorD:flatCurrencyGainWhenHitBasedOnResistance',
        'melvorD:currencyGainOnMonsterKillBasedOnEvasion',
        'melvorD:currencyGainPerDamageDealt',
        'melvorD:currencyGainPerMeleeDamageDealt',
        'melvorD:currencyGainPerRangedDamageDealt',
        'melvorD:currencyGainPerMagicDamageDealt',
        'melvorD:currencyGainPerMagicDamageDealtOnSlayerTask',
        'melvorD:currencyGainFromMonsterDrops',
        'melvorD:currencyGainFromSlayerTaskMonsterDrops',
        'melvorD:currencyGainOnRegenBasedOnHPGained',
        'melvorD:currencyGainFromLifesteal',
        'melvorD:flatCurrencyGain',
        'melvorD:currencyGainPerDamageDealtBasedOnCurrencyAmount',
        'melvorD:minCurrencyMultiplierPerDamage',
        'melvorD:maxCurrencyMultiplierPerDamage',
        'melvorD:flatCurrencyGainOnMonsterKillBasedOnCombatLevel',
        'melvorD:currencyGainFromSlayerTasks',
        'melvorD:currencyGainFromMonsterDropsBasedOnDebuffs',
        'melvorD:flatCurrencyGainFromMeleeSlayerTasksBasedOnCombatLevel',
        'melvorD:flatCurrencyGainFromRangedSlayerTasksBasedOnCombatLevel',
        'melvorD:flatCurrencyGainFromMagicSlayerTasksBasedOnCombatLevel',
        'melvorD:currencyGainBasedOnSummonDamage',
        'melvorD:currencyGainBasedOnBarrierDamage',
        'melvorD:flatCurrencyGainOnEnemyHitBasedOnCombatLevel',
        'melvorD:currencyGainPerPoisonDamage',
        'melvorD:accuracyRating',
        'melvorD:meleeAccuracyRating',
        'melvorD:rangedAccuracyRating',
        'melvorD:magicAccuracyRating',
        'melvorD:meleeMaxHit',
        'melvorD:rangedMaxHit',
        'melvorD:magicMaxHit',
        'melvorD:evasion',
        'melvorD:meleeEvasion',
        'melvorD:rangedEvasion',
        'melvorD:magicEvasion',
        'melvorD:flatMaxHit',
        'melvorD:maxHit',
        'melvorD:flatHPRegen',
        'melvorD:flatAttackInterval',
        'melvorD:attackInterval',
        'melvorD:maxHitpoints',
        'melvorD:flatMaxHitpoints',
        'melvorD:reflectDamage',
        'melvorD:hitpointRegeneration',
        'melvorD:minHitBasedOnMaxHit',
        'melvorD:attackRolls',
        'melvorD:dragonBreathDamage',
        'melvorD:flatReflectDamage',
        'melvorD:rolledReflectDamage',
        'melvorD:flatMinHit',
        'melvorD:flatMagicMinHit',
        'melvorD:currentHPDamageTakenOnAttack',
        'melvorD:maxHPDamageTakenOnAttack',
        'melvorD:damageTaken',
        'melvorD:lifesteal',
        'melvorD:meleeLifesteal',
        'melvorD:rangedLifesteal',
        'melvorD:magicLifesteal',
        'melvorD:bleedLifesteal',
        'melvorD:burnLifesteal',
        'melvorD:poisonLifesteal',
        'melvorD:meleeCritChance',
        'melvorD:rangedCritChance',
        'melvorD:magicCritChance',
        'melvorD:meleeProtection',
        'melvorD:rangedProtection',
        'melvorD:magicProtection',
        'melvorD:effectImmunity',
        'melvorD:effectIgnoreChance',
        'melvorD:sleepImmunity',
        'melvorD:rebirthChance',
        'melvorD:summoningMaxHit',
        'melvorD:otherStyleImmunity',
        'melvorD:meleeImmunity',
        'melvorD:rangedImmunity',
        'melvorD:magicImmunity',
        'melvorD:flatTotalBleedDamage',
        'melvorD:stunDurationIncreaseChance',
        'melvorD:flatRegenerationInterval',
        'melvorD:onHitSlowMagnitude',
        'melvorD:globalEvasionHPScaling',
        'melvorD:flatPrayerPointsWhenHit',
        'melvorD:flatMeleeAccuracyBonusPerAttackInterval',
        'melvorD:flatMeleeStrengthBonusPerAttackInterval',
        'melvorD:flatRangedAccuracyBonusPerAttackInterval',
        'melvorD:flatRangedStrengthBonusPerAttackInterval',
        'melvorD:flatMagicAccuracyBonusPerAttackInterval',
        'melvorD:meleeMaxHitAgainstRanged',
        'melvorD:rangedMaxHitAgainstMagic',
        'melvorD:magicMaxHitAgainstMelee',
        'melvorD:doubleSlayerTaskKillChance',
        'melvorD:damageTakenAddedAsPrayerPoints',
        'melvorD:accuracyRatingHPScaling',
        'melvorD:sleepDurationIncreaseChance',
        'melvorD:stunAvoidChance',
        'melvorD:healWhenStunned',
        'melvorD:healWhenSlept',
        'melvorD:damageTakenPerAttack',
        'melvorD:flatMeleeMaxHit',
        'melvorD:flatRangedMaxHit',
        'melvorD:flatMagicMaxHit',
        'melvorD:curseLifesteal',
        'melvorD:lifestealBasedOnHPRegenEffectiveness',
        'melvorD:disableHPRegeneration',
        'melvorD:flatMinMeteorShowerSpellDamage',
        'melvorD:endOfTurnEvasion2',
        'melvorD:decreaseEnemyEvasionOnStun',
        'melvorD:decreaseEnemyEvasionOnSleep',
        'melvorD:doubleLifesteal',
        'melvorD:maxHPBurnDamage',
        'melvorD:disableLifesteal',
        'melvorD:burnDOTDamageTaken',
        'melvorD:bleedDOTDamageTaken',
        'melvorD:poisonDOTDamageTaken',
        'melvorD:deadlyPoisonDOTDamageTaken',
        'melvorD:evasionAgainstMelee',
        'melvorD:evasionAgainstRanged',
        'melvorD:evasionAgainstMagic',
        'melvorD:meleeAccuracyMaxHitPer8Strength',
        'melvorD:magicMaxHitWithActivePrayer',
        'melvorD:rangedStrengthBonusPer8Ranged',
        'melvorD:flatBarrierSummonDamage',
        'melvorD:barrierSummonDamage',
        'melvorD:flatBarrierSummonDamageMelee',
        'melvorD:flatBarrierSummonDamageRanged',
        'melvorD:flatBarrierSummonDamageMagic',
        'melvorD:barrierSummonDamageIfSlayerTask',
        'melvorD:disableAttackDamage',
        'melvorD:cleansed',
        'melvorD:maxHitBasedOnTargetCurrentHitpoints',
        'melvorD:prayerPointPreservationChancePerPoint',
        'melvorD:maxHitBasedOnPrayerCost',
        'melvorD:flatPrayerPointsPerMonsterKill',
        'melvorD:selfDamageOnHitBasedOnCurrentHitpoints',
        'melvorD:noCombatDropChance',
        'melvorD:meleeAttackInterval',
        'melvorD:dodgeChance',
        'melvorD:enemyMaximumHitpoints',
        'melvorD:bypassAmmoPreservationChance',
        'melvorD:bypassRunePreservationChance',
        'melvorD:halveAttackInterval',
        'melvorD:lifestealDamageBasedOnCurrentHitpoints',
        'melvorD:damageBasedOnCurrentHitpoints',
        'melvorD:damageBasedOnMaxHitpoints',
        'melvorD:healingWhenHit',
        'melvorD:damageDealtWith2Effects',
        'melvorD:unholyMarkOnHit',
        'melvorD:damageTakenBasedOnHP',
        'melvorD:curseOnHitWithUnholyMark',
        'melvorD:flatBarrierDamage',
        'melvorD:damageDealtPerEffect',
        'melvorD:regenPerDamageTaken',
        'melvorD:convertBoneDropsIntoCake',
        'melvorD:summoningAttackInterval',
        'melvorD:cantAttack',
        'melvorD:cantEvade',
        'melvorD:cantRegenBarrier',
        'melvorD:critChance',
        'melvorD:cantSpecialAttack',
        'melvorD:lacerationLifesteal',
        'melvorD:damageTakenPerMissedAttack',
        'melvorD:flatAbyssalSlayerAreaEffectNegation',
        'melvorD:cantMiss',
        'melvorD:rawReflectDamage',
        'melvorD:evasionBasedOnCorruptionLevel',
        'melvorD:ablazeDOTDamageTakenIfCorrupted',
        'melvorD:dotDamageTaken',
        'melvorD:bonusCorruptionChance',
        'melvorD:corruptionCounterRate',
        'melvorD:critMultiplier',
        'melvorD:damageBasedOnMaxHitpointsSelf',
        'melvorD:toxinDOTDamageTaken',
        'melvorD:ablazeDOTDamageTaken',
        'melvorD:ablazeLifesteal',
        'melvorD:toxinLifesteal',
        'melvorD:meleeMinHitBasedOnMaxHit',
        'melvorD:rangedMinHitBasedOnMaxHit',
        'melvorD:magicMinHitBasedOnMaxHit',
        'melvorD:lacerationDOTDamageTaken',
        'melvorD:voidburstDOTDamageTaken',
        'melvorD:instantCorruptionChance',
        'melvorD:extraLacerationStackChance',
        'melvorD:combatLootDoublingChance',
        'melvorD:damageDealtToBosses',
        'melvorD:damageDealtToSlayerTasks',
        'melvorD:damageDealtToSlayerAreaMonsters',
        'melvorD:damageDealtToCombatAreaMonsters',
        'melvorD:damageDealtToDungeonMonsters',
        'melvorD:damageDealtToAllMonsters',
        'melvorD:autoEatEfficiency',
        'melvorD:autoEatThreshold',
        'melvorD:autoEatHPLimit',
        'melvorD:foodHealingValue',
        'melvorD:prayerPointPreservationChance',
        'melvorD:flatPrayerPointCost',
        'melvorD:ammoPreservationChance',
        'melvorD:runePreservationChance',
        'melvorD:flatMonsterRespawnInterval',
        'melvorD:dungeonEquipmentSwapping',
        'melvorD:equipmentSets',
        'melvorD:autoSlayerUnlocked',
        'melvorD:slayerTaskLength',
        'melvorD:golbinRaidWaveSkipCost',
        'melvorD:golbinRaidMaximumAmmo',
        'melvorD:golbinRaidMaximumRunes',
        'melvorD:golbinRaidMinimumFood',
        'melvorD:golbinRaidPrayerLevel',
        'melvorD:golbinRaidStartingPrayerPoints',
        'melvorD:golbinRaidPrayerPointsPerWave',
        'melvorD:golbinRaidStartingRuneCount',
        'melvorD:golbinRaidPassiveSlotUnlocked',
        'melvorD:golbinRaidPrayerUnlocked',
        'melvorD:golbinRaidStartingWeapon',
        'melvorD:randomHerblorePotionChance',
        'melvorD:seedDropConversionChance',
        'melvorD:flatMagicDefenceBonus',
        'melvorD:slayerTaskMonsterAccuracy',
        'melvorD:hpRegenWhenEnemyHasMoreEvasion',
        'melvorD:summoningAttackLifesteal',
        'melvorD:meleeMinHitBasedOnMaxHitSlayerTask',
        'melvorD:flatHPRegenBasedOnMeleeMaxHit',
        'melvorD:rangedMinHitBasedOnMaxHitSlayerTask',
        'melvorD:flatHPRegenBasedOnRangedMaxHit',
        'melvorD:slayerCoinsPerMagicDamageSlayerTask',
        'melvorD:flatHPRegenBasedOnMagicMaxHit',
        'melvorD:hitpointRegenerationAgainstSlayerTasks',
        'melvorD:meleeStrengthBonus',
        'melvorD:rangedStrengthBonus',
        'melvorD:magicDamageBonus',
        'melvorD:bonusCoalOnDungeonCompletion',
        'melvorD:doubleRuneProvision',
        'melvorD:bypassSlayerItems',
        'melvorD:itemProtection',
        'melvorD:redemptionThreshold',
        'melvorD:redemptionHealing',
        'melvorD:autoLooting',
        'melvorD:autoBurying',
        'melvorD:freeProtectItem',
        'melvorD:prayerPointCost',
        'melvorD:allowAttackAugmentingMagic',
        'melvorD:foodPreservationChance',
        'melvorD:allowLootContainerStacking',
        'melvorD:doubleBoneDrops',
        'melvorD:flatMeleeDefenceBonus',
        'melvorD:flatRangedDefenceBonus',
        'melvorD:flatStabAttackBonus',
        'melvorD:flatSlashAttackBonus',
        'melvorD:flatBlockAttackBonus',
        'melvorD:flatRangedAttackBonus',
        'melvorD:flatMagicAttackBonus',
        'melvorD:flatMeleeStrengthBonus',
        'melvorD:flatRangedStrengthBonus',
        'melvorD:bypassAllSlayerItems',
        'melvorD:allowNonMagicCurses',
        'melvorD:flatAdditionalHolyDustFromBlessedOffering',
        'melvorD:flatPrayerPointsFromBurying',
        'melvorD:prayerPointsFromBurying',
        'melvorD:allowUnholyPrayerUse',
        'melvorD:unholyPrayerPointPreservationChance',
        'melvorD:disabledSpecialAttacks',
        'melvorD:meleeStrengthBonusPer10EnemyDR',
        'melvorD:soulPointPreservationChance',
        'melvorD:flatSoulPointsPerMonsterKill',
        'melvorD:flatSoulPointCost',
        'melvorD:enemyDamageReduction',
        'melvorD:playerDamageReduction',
        'melvorD:flatSlayerAreaEffectNegation',
        'melvorD:doubleSoulDropChance',
        'melvorD:reducedTargetDamageRedcutionIfBleeding',
        'melvorD:doubleActiveModifiersCartography',
        'melvorD:damageDealtToMonstersInArea'
    ];
}

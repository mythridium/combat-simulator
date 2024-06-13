import type { SimManager } from './sim-manager';
import { SimClasses } from './sim';
import { Util } from 'src/shared/util';
import { Global } from 'src/shared/global';
import { GameStats } from 'src/shared/utils/game-stats';
import { clone } from 'lodash-es';
import { emptyActionEventMatcherFactory } from 'src/shared/empty-skill';

export class SimGame extends Game {
    declare combat: SimManager;

    autoEatTiers: string[];
    itemFoundFromSlayer = new Set<AnyItem>();

    constructor() {
        super();
        this.autoEatTiers = ['melvorD:Auto_Eat_Tier_I', 'melvorD:Auto_Eat_Tier_II', 'melvorD:Auto_Eat_Tier_III'];

        this.combat = new SimClasses.SimManager(this, this.registeredNamespaces.getNamespace('melvorD'));

        this.actions.registeredObjects.set(this.combat.id, this.combat);
        this.activeActions.registeredObjects.set(this.combat.id, this.combat);
        this.passiveActions.registeredObjects.set(this.combat.id, this.combat);

        // @ts-ignore // TODO: TYPES
        this.combat.registerStatProvider(this.tokenItemStats);
        // @ts-ignore // TODO: TYPES
        this.combat.registerStatProvider(this.petManager);
        // @ts-ignore // TODO: TYPES
        this.combat.registerStatProvider(this.shop);
        // @ts-ignore // TODO: TYPES
        this.combat.registerStatProvider(this.potions.providedStats);

        this.detachGlobals();
    }

    detachGlobals() {
        // @ts-ignore
        this.telemetry.ENABLE_TELEMETRY = false;
        this.tutorial.complete = true;
        this.settings.boolData.enableOfflineCombat.currentValue = true;

        // @ts-ignore // TODO: TYPES
        for (const course of Array.from(this.agility.courses.values())) {
            // @ts-ignore // TODO: TYPES
            course.maxObstacles = course.numObstaclesUnlocked = course.obstacleSlots.length;
        }

        if (this.cartography) {
            // @ts-ignore // TODO: TYPES
            this.cartography.getUpgradeCharges = () => 0;
            // @ts-ignore // TODO: TYPES
            this.cartography.modifyInitialArtefactValue = () => 0;
        }
        this.township.confirmTownCreation = () => {};
        this.township.startTickTimer = () => {};
        this.township.onTickTimer = () => {};
        this.township.passiveTick = () => {};
        this.township.tick = () => true;
        this.township.tickSeason = () => {};
        // @ts-ignore // TODO: TYPES
        this.township.tickAbyssalWave = () => {};
        this.township.tasks.updateAllTaskProgress = () => {};
        this.township.tasks.updateTaskProgress = () => {};
        // @ts-ignore // TODO: TYPES
        this.slayer.addKill = () => {};
        // @ts-ignore // TODO: TYPES
        this.slayer.setTask = () => {};
        this.petManager.unlockPet = () => {};
        this.bank.addItem = () => true;
        this.bank.hasItem = () => true;
        this.bank.getQty = () => 1e6;
        this.bank.checkForItems = () => true;
        this.completion.render = () => {};
        this.gp.render = () => {};
        this.slayerCoins.render = () => {};
        this.bank.render = () => {};
        this.combat.render = () => {};
        this.combat.enemy.render = () => {};
        this.combat.player.render = () => {};
        this.combat.loot.render = () => {};
        this.shop.render = () => {};
        this.golbinRaid.render = () => {};
        this.golbinRaid.player.render = () => {};
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            // @ts-ignore // TODO: TYPES
            this.corruption.corruptionEffects.unlockRow = () => {};
        }
        this.notifications.createErrorNotification = () => {};
        this.notifications.createGPNotification = () => {};
        this.notifications.createInfoNotification = () => {};
        this.notifications.createItemNotification = () => {};
        this.notifications.createMasteryLevelNotification = () => {};
        this.notifications.createSkillXPNotification = () => {};
        this.notifications.createSlayerCoinsNotification = () => {};
        this.notifications.createSuccessNotification = () => {};
        this.notifications.createSummoningMarkNotification = () => {};

        this.combat.player.prayerPoints = Number.MAX_SAFE_INTEGER;
        // @ts-ignore // TODO: TYPES
        this.combat.player.soulPoints = Number.MAX_SAFE_INTEGER;

        this.bank.removeItemQuantity = (item: AnyItem, quantity: number, _: boolean): void => {
            switch (item.type) {
                case 'Potion':
                    this.combat.player.usedPotions += quantity;
                    break;
                case 'Rune':
                    if (this.combat.player.usedRunes[item.id] === undefined) {
                        this.combat.player.usedRunes[item.id] = 0;
                    }
                    this.combat.player.usedRunes[item.id] += quantity;
                    break;
            }
        };

        this.bank.checkForItems = (costs: AnyItemQuantity[]): boolean => {
            if (costs.find(x => x.item.type === 'Rune') !== undefined) {
                return this.combat.player.hasRunes;
            }
            return true;
        };

        const original = this.stats.itemFindCount.bind(this.stats);
        this.stats.itemFindCount = item => {
            if (this.itemFoundFromSlayer.has(item)) {
                return original(item);
            } else {
                return 1;
            }
        };

        this.gp.add = amount => {
            this.combat.player.gpMelvor += amount;
        };

        this.slayerCoins.add = amount => {
            this.combat.player.slayerCoinsMelvor += amount;
        };

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            // @ts-ignore // TODO: TYPES
            this.abyssalPieces.add = amount => {
                this.combat.player.gpAbyssal += amount;
            };

            // @ts-ignore // TODO: TYPES
            this.abyssalSlayerCoins.add = amount => {
                this.combat.player.slayerCoinsAbyssal += amount;
            };
        }

        for (const skill of this.skills.allObjects) {
            // Make sure nothing gets called on skill level ups, it tends to try rendering
            skill.levelUp = () => {};
            // @ts-ignore // TODO: TYPES
            skill.abyssalLevelUp = () => {};
            skill.render = () => {};
            skill.onAncientRelicUnlock = () => {};
            // @ts-ignore // TODO: TYPES
            skill.onUnlock = () => {};
            skill.setUnlock(true);
            // @ts-ignore // TODO: TYPES
            skill._currentLevelCap = skill.maxLevelCap;
            // @ts-ignore // TODO: TYPES
            skill._currentAbyssalLevelCap = skill.maxAbyssalLevelCap;

            skill.rollForPets = (interval: number) => {
                if (this.combat.player.petRolls[skill.id] === undefined) {
                    this.combat.player.petRolls[skill.id] = 0;
                }

                this.combat.player.petRolls[skill.id] += interval;
            };
        }

        this.summoning.isSynergyUnlocked = () => {
            return this.combat.player.isSynergyUnlocked;
        };

        if (this.cartography) {
            Object.defineProperty(this.cartography, 'hasCarthuluPet', {
                get: () => {
                    const pet = this.pets.getObjectByID('melvorAoD:MapMasteryPet');
                    return pet !== undefined ? this.petManager.isPetUnlocked(pet) : false;
                }
            });
        }

        const constructMatcher = this.events.constructMatcher;

        this.events.constructMatcher = (data: GameEventMatcherData) => {
            let matcher = constructMatcher.call(this.events, data);

            if (matcher === undefined) {
                matcher = emptyActionEventMatcherFactory(data.type, data as any, this) as any;
            }

            return matcher;
        };
    }

    public scheduleSave() {}
    public autoSave() {}
    public updateRichPresence() {}
    public cloudUpdate() {}
    public gameInteractionUpdate() {}
    public onGameInteraction() {}
    public rollForAncientRelics() {}
    public unlockAncientRelicOnLevelUp() {}
    public queueNextRandomLevelCapModal() {}
    public selectRandomLevelCapIncrease() {}
    public fireLevelCapIncreaseModal() {}
    public fireAbyssalLevelCapIncreaseModal() {}
    public purchaseSkillLevelCaps() {}
    public purchaseAbyssalSkillLevelCaps() {}
    public checkSteamAchievements() {}
    public isAchievementMet() {
        return false;
    }

    public postDataRegistration(): void {
        if (this.cartography) {
            // don't bother with map post data registration, leads to computing ui
            this.cartography.worldMaps.forEach(
                map =>
                    (map.postDataRegistration = () => {
                        map.sortedMasteryBonuses = map.masteryBonuses.allObjects;
                        map.sortedMasteryBonuses.sort((a, b) => a.masteredHexes - b.masteredHexes);
                    })
            );
        }

        super.postDataRegistration();

        for (const area of this.slayerAreas.allObjects) {
            for (const requirement of area.entryRequirements) {
                if (requirement.type === 'ItemFound') {
                    this.itemFoundFromSlayer.add(requirement.item);
                }
            }
        }
    }

    // @ts-ignore // TODO: TYPES
    registerEquipmentSlotData(namespace: DataNamespace, data: any) {
        if (Util.isWebWorker) {
            // @ts-ignore // TODO: TYPES
            super.registerEquipmentSlotData(namespace, data);
            return;
        }

        // cache the current positions
        // @ts-ignore // TODO: TYPES
        const positions = clone(EquipmentSlot.gridPositions);
        // @ts-ignore // TODO: TYPES
        const gridColRange = clone(EquipmentSlot.gridColRange);
        // @ts-ignore // TODO: TYPES
        const gridRowRange = clone(EquipmentSlot.gridRowRange);

        // @ts-ignore // TODO: TYPES
        data.forEach(slotData => {
            // @ts-ignore // TODO: TYPES
            const slot = new EquipmentSlot(namespace, slotData, this);

            // @ts-ignore // TODO: TYPES
            this.equipmentSlots.registerObject(slot);

            // @ts-ignore // TODO: TYPES
            const melvorSlot = Global.client.melvor.equipmentSlots.getObjectByID(slot.id);

            if (melvorSlot) {
                slot.gridPosition = clone(melvorSlot.gridPosition);
            }
        });

        // reset the positions
        // @ts-ignore // TODO: TYPES
        EquipmentSlot.gridPositions = positions;
        // @ts-ignore // TODO: TYPES
        EquipmentSlot.gridColRange = gridColRange;
        // @ts-ignore // TODO: TYPES
        EquipmentSlot.gridRowRange = gridRowRange;
    }

    // @ts-ignore // TODO: TYPES
    registerModifiers(namespace, data) {
        // @ts-ignore // TODO: TYPES
        const newModifiers = [];
        // @ts-ignore // TODO: TYPES
        data.forEach(modifierData => {
            // @ts-ignore // TODO: TYPES
            const modifier = new Modifier(namespace, modifierData, this);
            newModifiers.push(modifier);
            // @ts-ignore // TODO: TYPES
            this.modifierRegistry.registerObject(modifier);
        });

        if (Util.isWebWorker) {
            // @ts-ignore // TODO: TYPES
            expressions.updateModifiers(newModifiers);
        }
    }

    // Override to prevent saving
    clearActiveAction(save?: boolean): void {
        if (!this.disableClearOffline) {
            this.activeAction = undefined;
        }
    }

    onLoad() {
        try {
            // @ts-ignore // TODO: TYPES
            this.setUpGamemodeOnLoad();
        } catch {}

        for (const skill of this.skills.allObjects) {
            // @ts-ignore // TODO: TYPES
            for (const skillTree of skill.skillTrees.allObjects) {
                skillTree.unlockedNodes = [];
                skillTree.onLoad();
            }
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            // @ts-ignore // TODO: TYPES
            this.corruption.corruptionEffects.unlockedRows = [];
            // @ts-ignore // TODO: TYPES
            this.corruption.corruptionEffects.lockedRows = [];
            // @ts-ignore // TODO: TYPES
            this.corruption.onLoad();
        }

        GameStats.compute();
        this.combat.initialize();

        const potion = this.combat.player.potion;

        if (potion && !this.potions.autoReusePotionsForAction(potion.action)) {
            this.potions.toggleAutoReusePotion(potion.action);
        }
    }

    setAutoEatTier(tier: number) {
        this.clearShop();

        for (let t = 0; t <= tier; t++) {
            this.shop.upgradesPurchased.set(this.shop.purchases.getObjectByID(this.autoEatTiers[t])!, 1);
        }

        this.shop.computeProvidedStats(false);
    }

    clearShop() {
        const equipmentSets = Array.from(this.shop.upgradesPurchased.keys()).filter(upgrade =>
            upgrade.localID.includes('Extra_Equipment_Set')
        );

        this.shop.upgradesPurchased.clear();
        // @ts-ignore // TODO: TYPES
        this.shop.modifiers.empty();
        // @ts-ignore // TODO: TYPES
        this.shop.enemyModifiers.empty();
        // @ts-ignore // TODO: TYPES
        this.shop.conditionalModifiers = [];
        // @ts-ignore // TODO: TYPES
        this.shop.combatEffects = [];

        for (const set of equipmentSets) {
            this.shop.upgradesPurchased.set(set, 1);
        }
    }

    resetToBlankState() {
        this.combat.player.prayerPoints = Number.MAX_SAFE_INTEGER;
        // @ts-ignore // TODO: TYPES
        this.combat.player.soulPoints = Number.MAX_SAFE_INTEGER;

        this.combat.resetEventState();
        this.combat.player.resetToBlankState();
        this.combat.player.setPotion(undefined);
        this.clearShop();

        this.petManager.unlocked.clear();

        this.astrology.actions.allObjects.forEach(constellation => {
            for (const modifier of constellation.standardModifiers) {
                // @ts-ignore // TODO: TYPES
                modifier.timesBought = 0;
            }

            for (const modifier of constellation.uniqueModifiers) {
                // @ts-ignore // TODO: TYPES
                modifier.timesBought = 0;
            }

            // @ts-ignore // TODO: TYPES
            for (const modifier of constellation.abyssalModifiers) {
                // @ts-ignore // TODO: TYPES
                modifier.timesBought = 0;
            }
        });

        // @ts-ignore // TODO: TYPES
        for (const course of Array.from(this.agility.courses.values())) {
            // @ts-ignore // TODO: TYPES
            course.builtObstacles.clear();
            // @ts-ignore // TODO: TYPES
            course.builtPillars.clear();
        }

        this.skills.forEach(skill => {
            skill._level = skill.startingLevel;
            skill._xp = 0;

            // @ts-ignore // TODO: TYPES
            for (const relicSet of Array.from(skill.ancientRelicSets.values())) {
                // @ts-ignore // TODO: TYPES
                relicSet.foundCount = 0;
                // @ts-ignore // TODO: TYPES
                relicSet.foundRelics.clear();
            }

            // @ts-ignore // TODO: TYPES
            skill.actionMastery?.clear();
            // @ts-ignore // TODO: TYPES
            skill._masteryPoolXP?.data.clear();

            // @ts-ignore // TODO: TYPES
            for (const tree of skill.skillTrees.allObjects) {
                tree.unlockedNodes = [];

                for (const node of tree.nodes.allObjects) {
                    node.isUnlocked = false;
                }
            }
        });

        // @ts-ignore // TODO: TYPES
        this.agility._level = this.agility.maxLevelCap;
        // @ts-ignore // TODO: TYPES
        this.agility._xp = exp.levelToXP(this.agility._level + 1) - 1;
        // @ts-ignore // TODO: TYPES
        this.agility._abyssalLevel = this.agility.maxAbyssalLevelCap;
        // @ts-ignore // TODO: TYPES
        this.agility._abyssalXP = abyssalExp.levelToXP(this.agility._abyssalLevel + 1) - 1;
        // @ts-ignore // TODO: TYPES
        this.agility.courses.forEach(course => (course.numObstaclesUnlocked = course.obstacleSlots.length));

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            // @ts-ignore // TODO: TYPES
            this.corruption.corruptionEffects.lockedRows.length = 0;
            // @ts-ignore // TODO: TYPES
            this.corruption.corruptionEffects.unlockedRows.length = 0;

            // @ts-ignore // TODO: TYPES
            for (const row of this.corruption.corruptionEffects.allRows) {
                row.isUnlocked = false;
                // @ts-ignore // TODO: TYPES
                this.corruption.corruptionEffects.lockedRows.push(row);
            }
        }

        this.township.townData.townCreated = true;
        this.township.townData.season = this.township.defaultSeason ?? this.township.townData.season;
        this.township.biomes.forEach(biome => {
            biome.buildingEfficiency.clear();
            biome.buildingsBuilt.clear();
        });

        this.cartography?.worldMaps.forEach(map => {
            map._playerPosition = map.startingLocation;
        });

        GameStats.compute();
    }

    checkRequirements(
        requirements: AnyRequirement[],
        notifyOnFailure?: boolean,
        slayerLevelReq?: number,
        checkSlayer?: boolean
    ): boolean {
        if (this.combat.player.ignoreAllSlayerRequirements) {
            return true;
        }

        return requirements.every((req: any) =>
            this.checkRequirement(req, notifyOnFailure, slayerLevelReq, checkSlayer)
        );
    }

    checkRequirement(
        requirement: AnyRequirement,
        notifyOnFailure?: boolean,
        slayerLevelReq?: number,
        checkSlayer?: boolean
    ): boolean {
        switch (requirement.type) {
            case 'SkillLevel':
                if (Global.get.combatSkillLocalIds.includes(requirement.skill.localID)) {
                    return this.combat.player.skillLevel.get(requirement.skill.id) >= requirement.level;
                } else {
                    return true;
                }
            // @ts-ignore // TODO: TYPES
            case 'AbyssalLevel':
                // @ts-ignore // TODO: TYPES
                if (Global.get.combatAbyssalSkillLocalIds.includes(requirement.skill.localID)) {
                    // @ts-ignore // TODO: TYPES
                    return this.combat.player.skillAbyssalLevel.get(requirement.skill.id) >= requirement.level;
                } else {
                    return true;
                }
            case 'SlayerItem':
                return super.checkRequirement(requirement, false, slayerLevelReq);
            case 'ItemFound':
            case 'ShopPurchase':
            case 'DungeonCompletion':
            // @ts-ignore // TODO: TYPES
            case 'AbyssDepthCompletion':
                return checkSlayer ? super.checkRequirement(requirement, false, slayerLevelReq) : true;
            case 'Completion':
            case 'CartographyHexDiscovery':
            case 'CartographyPOIDiscovery':
            case 'ArchaeologyItemsDonated':
                return true;
        }
        return false;
    }

    generateSaveStringSimple(): string {
        const header = this.getSaveHeader();
        const writer = new SaveWriter('Write', 512);
        this.encodeSimple(writer);
        return writer.getSaveString(header);
    }

    encodeSimple(writer: SaveWriter): SaveWriter {
        // writer.writeFloat64(this.tickTimestamp);
        // writer.writeFloat64(this.saveTimestamp);
        // writer.writeBoolean(this.activeAction !== undefined);
        // if (this.activeAction !== undefined)
        //     writer.writeNamespacedObject(this.activeAction);
        // writer.writeBoolean(this.pausedAction !== undefined);
        // if (this.pausedAction !== undefined)
        //     writer.writeNamespacedObject(this.pausedAction);
        // writer.writeBoolean(this._isPaused);
        writer.writeBoolean(this.merchantsPermitRead);
        writer.writeNamespacedObject(this.currentGamemode);
        // writer.writeString(this.characterName);
        // this.bank.encode(writer);
        this.combat.encode(writer);
        // this.golbinRaid.encode(writer);
        // this.minibar.encode(writer);
        this.petManager.encode(writer);
        this.shop.encode(writer);
        // this.itemCharges.encode(writer);
        this.tutorial.encode(writer);
        this.potions.encode(writer);
        this.stats.encode(writer);
        // this.settings.encode(writer);
        // this.gp.encode(writer);
        // this.slayerCoins.encode(writer);
        // this.raidCoins.encode(writer);
        // writer.writeArray(this.readNewsIDs, (newsID, writer) => {
        //     writer.writeString(newsID);
        // });
        // writer.writeString(this.lastLoadedGameVersion);
        // nativeManager.encode(writer);

        writer.writeUint32(this.skills.size);
        this.skills.forEach(skill => {
            writer.writeNamespacedObject(skill);
            writer.startMarkingWriteRegion();
            skill.encode(writer);
            writer.stopMarkingWriteRegion();
        });

        const masteredHexes = (<any>this).cartography?.activeMap?.masteredHexes ?? 0;

        writer.writeUint32(masteredHexes);

        // @ts-ignore // TODO: TYPES
        writer.writeArray(this.abyssDepths.allObjects, (depth, writer) => {
            // @ts-ignore // TODO: TYPES
            writer.writeNamespacedObject(depth);
            // @ts-ignore // TODO: TYPES
            writer.writeUint32(depth.timesCompleted);
        });

        // @ts-ignore // TODO: TYPES
        writer.writeArray(this.strongholds.allObjects, (stronghold, writer) => {
            // @ts-ignore // TODO: TYPES
            writer.writeNamespacedObject(stronghold);
            // @ts-ignore // TODO: TYPES
            writer.writeUint32(stronghold.timesCompleted);
        });
        // mod.encode(writer);
        // this.completion.encode(writer);
        return writer;
    }

    decodeSimple(reader: SaveWriter, version: number): void {
        // let resetPaused = false;
        // this.tickTimestamp = reader.getFloat64();
        // this.saveTimestamp = reader.getFloat64();
        // if (reader.getBoolean()) {
        //     const activeAction = reader.getNamespacedObject(this.activeActions);
        //     if (typeof activeAction !== "string")
        //         this.activeAction = activeAction;
        // }
        // if (reader.getBoolean()) {
        //     const pausedAction = reader.getNamespacedObject(this.activeActions);
        //     if (typeof pausedAction === "string") resetPaused = true;
        //     else this.pausedAction = pausedAction;
        // }
        // this._isPaused = reader.getBoolean();
        this.merchantsPermitRead = reader.getBoolean();
        const gamemode = reader.getNamespacedObject(this.gamemodes);
        if (typeof gamemode === 'string') {
            throw new Error('Error loading save. Gamemode is not registered.');
        }

        this.currentGamemode = gamemode;

        if (this.cartography?.activeMap) {
            this.cartography.activeMap.masteredHexes = 0;
        }

        // this.characterName = reader.getString();
        // this.bank.decode(reader, version);
        this.combat.decode(reader, version);
        // this.golbinRaid.decode(reader, version);
        // this.minibar.decode(reader, version);
        this.petManager.decode(reader, version);
        this.shop.decode(reader, version);
        // this.itemCharges.decode(reader, version);
        this.tutorial.decode(reader, version);
        this.potions.decode(reader, version);
        this.stats.decode(reader, version);
        // this.settings.decode(reader, version);
        // this.gp.decode(reader, version);
        // this.slayerCoins.decode(reader, version);
        // this.raidCoins.decode(reader, version);
        // this.readNewsIDs = reader.getArray((reader) => reader.getString());
        // this.lastLoadedGameVersion = reader.getString();
        // nativeManager.decode(reader, version);
        const numSkills = reader.getUint32();
        for (let i = 0; i < numSkills; i++) {
            const skill = reader.getNamespacedObject(this.skills);
            const skillDataSize = reader.getUint32();
            if (typeof skill === 'string') reader.getFixedLengthBuffer(skillDataSize);
            else {
                skill.decode(reader, version);
            }
            (<any>skill)._unlocked = true;
        }

        const masteredHexes = reader.getUint32();
        if ((<any>this).cartography?.activeMap) {
            (<any>this).cartography.activeMap.masteredHexes = masteredHexes;
        }

        reader.getArray(reader => {
            // @ts-ignore // TODO: TYPES
            const depth = reader.getNamespacedObject(this.abyssDepths);
            const timesCompleted = reader.getUint32();

            if (typeof depth !== 'string') {
                // @ts-ignore // TODO: TYPES
                depth.timesCompleted = timesCompleted;
            }
        });

        reader.getArray(reader => {
            // @ts-ignore // TODO: TYPES
            const stronghold = reader.getNamespacedObject(this.strongholds);
            const timesCompleted = reader.getUint32();

            if (typeof stronghold !== 'string') {
                // @ts-ignore // TODO: TYPES
                stronghold.timesCompleted = timesCompleted;
            }
        });
        // mod.decode(reader, version);
        // if (version >= 26) this.completion.decode(reader, version);
        // if (resetPaused) {
        //     if (!this.isGolbinRaid) this._isPaused = false;
        // }
    }

    // Don't render
    render() {}
    renderEventAreas() {}
    renderEventMenu() {}
    renderDungeonRelicCount() {}
    renderSlayerAreaEffects() {}
    renderAreaRequirements() {}
    renderPause() {}
    queueRequirementRenders() {}
}

export class CustomEventMatcher extends GameEventMatcher<GameEvent> {
    type: any = '';

    doesEventMatch(event: GameEvent): boolean {
        return false;
    }

    _assignHandler(handler: Handler<Event>, golbinRaid: boolean) {}

    _unassignHandler(handler: Handler<Event>, golbinRaid: boolean) {}
}

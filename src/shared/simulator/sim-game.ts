/*  Melvor Idle Combat Simulator

    Copyright (C) <2022, 2023> <Broderick Hyman>

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

import type { SimManager } from './sim-manager';
import { MICSR } from 'src/shared/micsr';
import { SimClasses } from './sim';

export class SimGame extends Game {
    micsr: MICSR;
    declare combat: SimManager;

    autoEatTiers: string[];
    agilityObstacles: [string, AgilityObstacle][] = [];
    agilityPillars: [string, AgilityPillar][] = [];
    agilityElitePillars: [string, AgilityPillar][] = [];
    itemFoundFromSlayer = new Set<AnyItem>();

    constructor(micsr: MICSR) {
        super();
        this.micsr = micsr;

        this.autoEatTiers = ['melvorD:Auto_Eat_Tier_I', 'melvorD:Auto_Eat_Tier_II', 'melvorD:Auto_Eat_Tier_III'];

        this.combat = new SimClasses.SimManager(this, this.registeredNamespaces.getNamespace('melvorD'));

        this.actions.registeredObjects.set(this.combat.namespace, this.combat);
        this.activeActions.registeredObjects.set(this.combat.namespace, this.combat);
        this.passiveActions.registeredObjects.set(this.combat.namespace, this.combat);

        this.combat.player.registerStatProvider(this.petManager);
        this.combat.player.registerStatProvider(this.shop);
        this.combat.player.registerStatProvider(this.potions);

        this.agilityObstacles = Array.from(this.agility.actions['registeredObjects']);
        this.agilityPillars = Array.from(this.agility.pillars['registeredObjects']);
        this.agilityElitePillars = Array.from(this.agility.elitePillars['registeredObjects']);

        this.detachGlobals();
    }

    detachGlobals() {
        // @ts-ignore
        this.telemetry.ENABLE_TELEMETRY = false;
        this.tutorial.complete = true;
        this.settings.boolData.enableOfflineCombat.currentValue = true;

        this.township.confirmTownCreation = () => {};
        this.township.startTickTimer = () => {};
        this.township.onTickTimer = () => {};
        this.township.tick = () => true;
        this.township.tickSeason = () => {};
        this.township.tasks.updateAllTaskProgress = () => {};
        this.township.tasks.updateTaskProgress = () => {};
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
        this.combat.player.equipment.render = () => {};
        this.combat.loot.render = () => {};
        this.shop.render = () => {};
        this.golbinRaid.render = () => {};
        this.golbinRaid.player.render = () => {};
        this.notifications.createErrorNotification = () => {};
        this.notifications.createGPNotification = () => {};
        this.notifications.createInfoNotification = () => {};
        this.notifications.createItemNotification = () => {};
        this.notifications.createMasteryLevelNotification = () => {};
        this.notifications.createSkillXPNotification = () => {};
        this.notifications.createSlayerCoinsNotification = () => {};
        this.notifications.createSuccessNotification = () => {};
        this.notifications.createSummoningMarkNotification = () => {};

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
            // Store gp on the SimPlayer
            this.combat.player.gp += amount;
        };

        this.slayerCoins.add = amount => {
            const modifier =
                this.combat.player.modifiers.increasedSlayerCoins - this.combat.player.modifiers.decreasedSlayerCoins;
            amount = applyModifier(amount, modifier, 0);
            // Store sc on the SimPlayer
            this.combat.player.slayercoins += amount;
        };

        for (const skill of this.skills.allObjects) {
            // Make sure nothing gets called on skill level ups, it tends to try rendering
            skill.levelUp = () => {};
            skill.render = () => {};
            skill.onAncientRelicUnlock = () => {};
            skill.setUnlock(true);
            skill.increasedLevelCap += 120 - skill.overrideLevelCap;
        }

        this.summoning.isSynergyUnlocked = () => {
            return this.combat.player.isSynergyUnlocked;
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

    public postDataRegistration(): void {
        if (this.cartography) {
            // don't bother with map post data registration, leads to computing ui
            this.cartography.worldMaps.forEach(map => (map.postDataRegistration = () => {}));
        }

        super.postDataRegistration();

        game.registeredNamespaces.forEach((ns: DataNamespace) => {
            if (ns.isModded && this.registeredNamespaces.getNamespace(ns.name) === undefined) {
                // Only register modded namespaces that aren't already registered
                this.registeredNamespaces.registerNamespace(ns.name, ns.displayName, ns.isModded);
            }
        });

        game.gamemodes.forEach(gm => {
            if (gm.isModded) {
                this.gamemodes.registerObject(
                    new Gamemode(
                        { name: gm.namespace, displayName: gm.name, isModded: gm.isModded },
                        this.micsr.gamemodeToData(gm),
                        game
                    )
                );
            }
        });

        this.agilityObstacles
            .map(action => action[1])
            .forEach(action => {
                if (action.isModded) {
                    this.agility.actions.registerObject(
                        new AgilityObstacle(
                            { name: action.namespace, displayName: action.name, isModded: true },
                            this.micsr.obstacleToData(action),
                            game
                        )
                    );
                }
            });

        this.agilityPillars
            .map(action => action[1])
            .forEach(action => {
                if (action.isModded) {
                    this.agility.pillars.registerObject(
                        new AgilityPillar(
                            { name: action.namespace, displayName: action.name, isModded: true },
                            this.micsr.pillarToData(action),
                            game
                        )
                    );
                }
            });

        this.agilityElitePillars
            .map(action => action[1])
            .forEach(action => {
                if (action.isModded) {
                    this.agility.elitePillars.registerObject(
                        new AgilityPillar(
                            { name: action.namespace, displayName: action.name, isModded: true },
                            this.micsr.pillarToData(action),
                            game
                        )
                    );
                }
            });

        for (const area of this.slayerAreas.allObjects) {
            for (const requirement of area.entryRequirements) {
                if (requirement.type === 'ItemFound') {
                    this.itemFoundFromSlayer.add(requirement.item);
                }
            }
        }
    }

    // Override to prevent saving
    clearActiveAction(save?: boolean): void {
        if (!this.disableClearOffline) {
            this.activeAction = undefined;
        }
    }

    onLoad() {
        this.astrology.computeProvidedStats(false);

        if (cloudManager.hasAoDEntitlement) {
            this.cartography.computeProvidedStats(false);
        }

        this.potions.computeProvidedStats(false);
        this.petManager.onLoad();
        this.shop.computeProvidedStats(false);
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

        for (const set of equipmentSets) {
            this.shop.upgradesPurchased.set(set, 1);
        }
    }

    resetToBlankState() {
        this.combat.player.resetToBlankState();
        this.combat.player.setPotion(undefined);
        this.clearShop();

        this.astrology.actions.allObjects.forEach(constellation => {
            constellation.standardModsBought.fill(0);
            constellation.uniqueModsBought.fill(0);
        });

        this.skills.forEach(skill => {
            skill._level = skill.startingLevel;
            skill._xp = 0;

            if (this.micsr.ancientRelicSkillKeys.includes(skill.localID)) {
                skill.ancientRelicsFound.clear();
                skill.numberOfRelicsFound = 0;
            }
        });

        this.cartography?.worldMaps.forEach(map => {
            map._playerPosition = map.startingLocation;
        });

        this.astrology.computeProvidedStats(false);
        this.potions.computeProvidedStats(false);
        this.shop.computeProvidedStats(false);
        this.combat.player.computeAllStats();
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
                return this.combat.player.skillLevel.get(requirement.skill.id)! >= requirement.level;
            case 'SlayerItem':
                return super.checkRequirement(requirement, false, slayerLevelReq);
            case 'ItemFound':
            case 'ShopPurchase':
            case 'DungeonCompletion':
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

        const goodSkills = this.skills.filter(
            x => !this.micsr.bannedSkills.map((bannedSkill: string) => `melvorD:${bannedSkill}`).includes(x.id)
        );

        writer.writeUint32(goodSkills.length);
        goodSkills.forEach(skill => {
            writer.writeNamespacedObject(skill);
            writer.startMarkingWriteRegion();
            skill.encode(writer);
            writer.stopMarkingWriteRegion();
        });

        const masteredHexes = (<any>this).cartography?.activeMap?.masteredHexes ?? 0;

        writer.writeUint32(masteredHexes);
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

        // mod.decode(reader, version);
        // if (version >= 26) this.completion.decode(reader, version);
        // if (resetPaused) {
        //     if (!this.isGolbinRaid) this._isPaused = false;
        // }
    }

    // Don't render
    render() {}
}

export class CustomEventMatcher extends GameEventMatcher<GameEvent> {
    type: any = '';

    doesEventMatch(event: GameEvent): boolean {
        return false;
    }

    _assignHandler(handler: Handler<Event>, golbinRaid: boolean) {}

    _unassignHandler(handler: Handler<Event>, golbinRaid: boolean) {}
}

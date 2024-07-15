import { Lookup } from 'src/shared/utils/lookup';
import { Global } from './global';
import { StatsController } from './user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { Notify } from './utils/notify';
import { ModifierHelper } from 'src/shared/utils/modifiers';
import { Bugs } from './user-interface/bugs/bugs';
import { clone } from 'lodash-es';

export interface SpellSettings {
    [index: string]: string;
    aurora: string;
    curse: string;
    attack: string;
}

export interface AstrologySettings {
    standardModsBought: number[];
    uniqueModsBought: number[];
    abyssalModsBought: number[];
}

export interface SlayerSettings {
    dungeonCompletion: string[];
    abyssDepthCompletion: string[];
    shopPurchase: string[];
    foundItem: string[];
}

export type AgilitySettings = {
    realmId: string;
    obstacles: [string, number, boolean][];
    pillars: [string, number][];
};

export interface Settings {
    version: string;
    astrologyModifiers: Map<string, AstrologySettings>;
    agility: AgilitySettings[];
    equipment: Map<string, string>;
    levels: Map<string, number>;
    abyssalLevels: Map<string, number>;
    petUnlocked: string[];
    styles: {
        magic: string;
        melee: string;
        ranged: string;
    };
    spells: SpellSettings;
    slayer: SlayerSettings;
    autoEatTier: number;
    cookingMastery: boolean;
    cookingPool: boolean;
    abyssal25CookingPool: boolean;
    abyssal95CookingPool: boolean;
    currentGamemodeID: string;
    foodSelected: string;
    isManualEating: boolean;
    isSolarEclipse: boolean;
    isEternalDarkness: boolean;
    isSynergyUnlocked: boolean;
    ignoreAllSlayerRequirements: boolean;
    isSlayerTask: boolean;
    isAutoCorrupt: boolean;
    potionID?: string;
    prayerSelected: string[];
    ancientRelicsSelected: [string, string[]][];
    useCombinationRunes: boolean;
    cartographyWorldMap: string;
    cartographyPointOfInterest: string;
    cartographyMasteredHexes: [string, number][] | number;
    corruptionEffectIds: string[];
    skillTreeIds: Map<string, Map<string, string[]>>;
    townshipBuildings: Map<string, [number, number]>;
    purchaseIds: string[];
}

export interface SettingsSelection {
    pets: boolean;
    astrology: boolean;
    corruption: boolean;
    skillTrees: boolean;
    ancientRelics: boolean;
}

export abstract class SettingsController {
    public static get isImporting() {
        return this._isImporting;
    }

    private static _isImporting = false;

    public static importFromEquipmentSet(index: number) {
        // get cooking mastery for foodSelected
        let cookingMastery = false;

        const recipe = Global.melvor.cooking.productRecipeMap.get(Global.melvor.combat.player.food.currentSlot.item);

        if (recipe && recipe.hasMastery) {
            cookingMastery = Global.melvor.cooking.getMasteryLevel(recipe) >= 99;
        }

        // get the player's auto eat tier
        const autoEatTier =
            -1 +
            Global.game.autoEatTiers.filter(tier =>
                Global.melvor.shop.isUpgradePurchased(Global.melvor.shop.purchases.getObjectByID(tier))
            ).length;

        let isSynergyUnlocked = false;

        if (
            !Global.melvor.combat.player.equipment.equippedItems['melvorD:Summon1'].isEmpty &&
            !Global.melvor.combat.player.equipment.equippedItems['melvorD:Summon1'].isEmpty
        ) {
            const summon1 = Global.melvor.combat.player.equipment.equippedItems['melvorD:Summon1'].item;
            const summon2 = Global.melvor.combat.player.equipment.equippedItems['melvorD:Summon2'].item;

            if (summon1 && summon2) {
                const synergyData = Global.melvor.summoning.getSynergy(summon1, summon2);

                isSynergyUnlocked = synergyData
                    ? Global.melvor.summoning.isSynergyUnlocked.call(Global.melvor.summoning, synergyData)
                    : false;
            }
        }

        let currentGamemodeID = Global.melvor.currentGamemode.id;

        if (!Global.game.gamemodes.find(gamemode => gamemode.id === Global.melvor.currentGamemode.id)) {
            currentGamemodeID = 'melvorD:Standard';
        }

        const settings: Settings = {
            version: Global.context.version,
            agility: this.getAgility(Global.melvor),
            astrologyModifiers: this.getAstrology(Global.melvor),
            equipment: this.getEquipment(Global.melvor, Global.melvor.combat.player.equipmentSets[index].equipment),
            levels: new Map(Global.melvor.skills.allObjects.map(skill => [skill.id, skill.level])),
            abyssalLevels: new Map(Global.melvor.skills.allObjects.map(skill => [skill.id, skill.abyssalLevel])),
            petUnlocked: Array.from(Global.melvor.petManager.unlocked).map(pet => pet.id),
            styles: {
                magic: Global.melvor.combat.player.attackStyles.magic.id,
                melee: Global.melvor.combat.player.attackStyles.melee.id,
                ranged: Global.melvor.combat.player.attackStyles.ranged.id
            },
            prayerSelected: Array.from(Global.melvor.combat.player.equipmentSets[index].prayerSelection).map(
                prayer => prayer.id
            ),
            ancientRelicsSelected: this.getSelectedAncientRelics(Global.melvor),
            spells: {
                aurora: Global.melvor.combat.player.equipmentSets[index].spellSelection.aurora?.id ?? '',
                curse: Global.melvor.combat.player.equipmentSets[index].spellSelection.curse?.id ?? '',
                attack: Global.melvor.combat.player.equipmentSets[index].spellSelection.attack?.id ?? ''
            },
            slayer: this.getSlayerData(Global.melvor),
            autoEatTier: autoEatTier,
            cookingMastery: cookingMastery,
            cookingPool:
                Lookup.getMasteryPoolBonus(
                    Global.melvor.cooking,
                    Global.melvor.realms.getObjectByID('melvorD:Melvor')
                ) >= 3,
            abyssal25CookingPool: cloudManager.hasItAEntitlementAndIsEnabled
                ? Lookup.getMasteryPoolBonus(
                      Global.melvor.cooking,
                      Global.melvor.realms.getObjectByID('melvorItA:Abyssal')
                  ) >= 1
                : false,
            abyssal95CookingPool: cloudManager.hasItAEntitlementAndIsEnabled
                ? Lookup.getMasteryPoolBonus(
                      Global.melvor.cooking,
                      Global.melvor.realms.getObjectByID('melvorItA:Abyssal')
                  ) >= 3
                : false,
            currentGamemodeID,
            foodSelected: Global.melvor.combat.player.food.currentSlot.item.id,
            isManualEating: Global.game.combat.player.isManualEating,
            isSolarEclipse: Global.melvor.township.townData.season === Lookup.getSolarEclipse(Global.melvor.township),
            isEternalDarkness: cloudManager.hasItAEntitlementAndIsEnabled
                ? Global.melvor.township.townData.season === Lookup.getEternalDarkness(Global.melvor.township)
                : false,
            isSynergyUnlocked: isSynergyUnlocked,
            ignoreAllSlayerRequirements: Global.game.combat.player.ignoreAllSlayerRequirements,
            isSlayerTask: Global.game.combat.player.isSlayerTask,
            isAutoCorrupt: Global.melvor.settings.enablePermaCorruption,
            potionID: Global.melvor.items.potions.find(
                potion => potion.action.localID === 'Combat' && Global.melvor.potions.isPotionActive(potion)
            )?.id,
            useCombinationRunes: Global.melvor.settings.useCombinationRunes,
            cartographyWorldMap: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.melvor.cartography.activeMap?.id
                : '',
            cartographyPointOfInterest: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.melvor.cartography.activeMap?.playerPosition?.pointOfInterest?.id
                : '',
            cartographyMasteredHexes: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.melvor.cartography.worldMaps.allObjects.map(map => [map.id, map.masteredHexes])
                : [],
            corruptionEffectIds:
                cloudManager.hasItAEntitlementAndIsEnabled && Global.melvor.corruption.isUnlocked
                    ? Global.melvor.corruption.corruptionEffects.unlockedRows.map(row => row.effect.id)
                    : [],
            skillTreeIds: cloudManager.hasItAEntitlementAndIsEnabled ? this.getSkillTrees(Global.melvor) : new Map(),
            townshipBuildings: this.getTownshipCombatBuildings(Global.melvor),
            purchaseIds: Array.from(Global.melvor.shop.upgradesPurchased.keys()).map(purchase => purchase.id)
        };

        this.importFromString(this.toBase64(settings));
    }

    public static importFromString(value: string) {
        const settings = this.toJson(value);

        this.import(settings);
    }

    public static importFromStringWithSelection(value: string, selection: SettingsSelection) {
        const settings = this.toJson(value);
        const current = this.export();

        if (selection.pets) {
            settings.petUnlocked = current.petUnlocked;
        }

        if (selection.astrology) {
            settings.astrologyModifiers = current.astrologyModifiers;
        }

        if (selection.corruption && cloudManager.hasItAEntitlementAndIsEnabled) {
            settings.corruptionEffectIds = current.corruptionEffectIds;
            settings.isAutoCorrupt = current.isAutoCorrupt;
        }

        if (selection.skillTrees && cloudManager.hasItAEntitlementAndIsEnabled) {
            settings.skillTreeIds = current.skillTreeIds;
        }

        if (selection.ancientRelics && Global.game.currentGamemode.allowAncientRelicDrops) {
            settings.ancientRelicsSelected = current.ancientRelicsSelected;
        }

        this.import(settings);
    }

    public static import(settings: Settings) {
        try {
            if (settings.version !== Global.context.version) {
                Global.logger.warn(`Importing ${settings.version} settings against ${Global.context.version}.`);
            }

            this._isImporting = true;

            Global.userInterface.main.querySelector('mcs-settings')._import(settings.currentGamemodeID);
            Global.userInterface.main
                .querySelector('mcs-levels')
                ._import(settings.levels ?? new Map(), settings.abyssalLevels ?? new Map());

            const equipment = Global.userInterface.main.querySelector('mcs-equipment-page');

            if (Array.isArray(settings.equipment)) {
                const equipmentSettings = clone(settings.equipment);

                settings.equipment = new Map<string, string>();

                for (const [index, slot] of Global.game.combat.player.equipment.equippedArray.entries()) {
                    const itemId = equipmentSettings[index];

                    if (!itemId || itemId === 'melvorD:Empty_Equipment') {
                        continue;
                    }

                    settings.equipment.set(slot.slot.id, itemId);
                }
            }

            equipment._import(
                settings.equipment,
                settings.isSynergyUnlocked,
                settings.isManualEating,
                settings.cookingPool,
                settings.abyssal25CookingPool,
                settings.abyssal95CookingPool,
                settings.cookingMastery,
                settings.foodSelected,
                settings.autoEatTier,
                settings.styles
            );

            Global.userInterface.main
                .querySelector('mcs-township')
                ._import(settings.isSolarEclipse, settings.isEternalDarkness, settings.townshipBuildings ?? new Map());

            Global.userInterface.main
                .querySelector('mcs-slayer')
                ._import(settings.slayer, settings.ignoreAllSlayerRequirements);

            Global.userInterface.main.querySelector('mcs-pets')._import(settings.petUnlocked);

            if (cloudManager.hasAoDEntitlementAndIsEnabled) {
                Global.userInterface.main
                    .querySelector('mcs-cartography')
                    ._import(
                        settings.cartographyWorldMap,
                        settings.cartographyPointOfInterest,
                        settings.cartographyMasteredHexes
                    );
            }

            if (Global.game.currentGamemode.allowAncientRelicDrops) {
                Global.userInterface.main.querySelector('mcs-ancient-relics')._import(settings.ancientRelicsSelected);
            }

            Global.userInterface.main.querySelector('mcs-shop')._import(settings.purchaseIds ?? []);

            Global.userInterface.main.querySelector('mcs-astrology')._import(settings.astrologyModifiers);
            Global.userInterface.main.querySelector('mcs-potions')._import(settings.potionID);

            for (const course of settings.agility ?? []) {
                const realm = Global.game.realms.getObjectByID(course.realmId);

                Global.userInterface.main.querySelector('mcs-agility')._import(realm, course.obstacles, course.pillars);
            }

            if (cloudManager.hasItAEntitlementAndIsEnabled) {
                Global.userInterface.main
                    .querySelector('mcs-corruption')
                    ._import(settings.corruptionEffectIds ?? [], settings.isAutoCorrupt ?? false);
            }

            if (cloudManager.hasItAEntitlementAndIsEnabled) {
                Global.userInterface.main.querySelector('mcs-skill-trees')._import(settings.skillTreeIds ?? new Map());
            }

            this._isImporting = false;
            StatsController.update();
            this._isImporting = true;

            equipment._setAttackStyleDropdown();

            Global.userInterface.main.querySelector('mcs-prayers')._import(settings.prayerSelected);
            Global.userInterface.main
                .querySelector('mcs-spells')
                ._import(settings.spells, settings.useCombinationRunes);

            this._isImporting = false;
            StatsController.update();

            Global.userInterface.main.querySelector('mcs-agility')._updateTooltips();
            Global.userInterface.main.querySelectorAll('mcs-food-slot').forEach(element => element._update());

            Notify.message('Successfully imported settings.');
        } catch (error) {
            Bugs.report(true, error);
        }
    }

    public static exportAsString() {
        const settings = this.export();

        return this.toBase64(settings);
    }

    public static export() {
        const predicate = (tier: string) =>
            Global.game.shop.isUpgradePurchased(Global.game.shop.purchases.getObjectByID(tier));
        const tier = Global.game.autoEatTiers.filter(tier => predicate(tier)).length;
        const autoEatTier = -1 + tier;

        const settings: Settings = {
            version: Global.context.version,
            astrologyModifiers: this.getAstrology(Global.game),
            agility: this.getAgility(Global.game),
            equipment: this.getEquipment(Global.game, Global.game.combat.player.equipment),
            levels: Global.game.combat.player.skillLevel,
            abyssalLevels: Global.game.combat.player.skillAbyssalLevel,
            petUnlocked: Array.from(Global.game.petManager.unlocked).map(pet => pet.id),
            styles: {
                magic: Global.game.combat.player.attackStyles.magic.id,
                melee: Global.game.combat.player.attackStyles.melee.id,
                ranged: Global.game.combat.player.attackStyles.ranged.id
            },
            prayerSelected: Array.from(Global.game.combat.player.activePrayers).map(p => p.id),
            ancientRelicsSelected: this.getSelectedAncientRelics(Global.game),
            spells: {
                aurora: Global.game.combat.player.spellSelection.aurora?.id ?? '',
                curse: Global.game.combat.player.spellSelection.curse?.id ?? '',
                attack: Global.game.combat.player.spellSelection.attack?.id ?? ''
            },
            slayer: this.getSlayerData(Global.game),
            autoEatTier: autoEatTier,
            cookingMastery: Global.game.combat.player.cookingMastery,
            cookingPool: Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.melvor) >= 3,
            abyssal25CookingPool: cloudManager.hasItAEntitlementAndIsEnabled
                ? Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.abyssal) >= 1
                : false,
            abyssal95CookingPool: cloudManager.hasItAEntitlementAndIsEnabled
                ? Lookup.getMasteryPoolBonus(Global.game.cooking, Lookup.abyssal) >= 3
                : false,
            currentGamemodeID: Global.game.combat.player.currentGamemodeID,
            foodSelected: Global.game.combat.player.food.currentSlot.item.id,
            isManualEating: Global.game.combat.player.isManualEating,
            isSolarEclipse: Global.game.township.townData.season === Lookup.getSolarEclipse(Global.game.township),
            isEternalDarkness: cloudManager.hasItAEntitlementAndIsEnabled
                ? Global.game.township.townData.season === Lookup.getEternalDarkness(Global.game.township)
                : false,
            isSynergyUnlocked: Global.game.combat.player.isSynergyUnlocked,
            ignoreAllSlayerRequirements: Global.game.combat.player.ignoreAllSlayerRequirements,
            isSlayerTask: Global.game.combat.player.isSlayerTask,
            isAutoCorrupt: Global.game.combat.player.isAutoCorrupt,
            potionID: Global.game.combat.player.potion?.id,
            useCombinationRunes: Global.game.combat.player.useCombinationRunes,
            cartographyWorldMap: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.game.cartography.activeMap?.id
                : '',
            cartographyPointOfInterest: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.game.cartography.activeMap?.playerPosition?.pointOfInterest?.id
                : '',
            cartographyMasteredHexes: cloudManager.hasAoDEntitlementAndIsEnabled
                ? Global.game.cartography.worldMaps.allObjects.map(map => [map.id, map.masteredHexes])
                : [],
            corruptionEffectIds: cloudManager.hasItAEntitlementAndIsEnabled
                ? Global.game.corruption.corruptionEffects.unlockedRows.map(row => row.effect.id)
                : [],
            skillTreeIds: cloudManager.hasItAEntitlementAndIsEnabled ? this.getSkillTrees(Global.game) : new Map(),
            townshipBuildings: this.getTownshipCombatBuildings(Global.game),
            purchaseIds: Array.from(Global.game.shop.upgradesPurchased.keys()).map(purchase => purchase.id)
        };

        return settings;
    }

    private static getEquipment(game: Game, equipmentSet: Equipment) {
        const equipment = new Map<string, string>();

        for (const slot of game.equipmentSlots.allObjects) {
            const item = equipmentSet.equippedItems[slot.id]?.item;

            if (item?.id !== 'melvorD:Empty_Equipment') {
                equipment.set(slot.id, item.id);
            }
        }

        return equipment;
    }

    private static getSkillTrees(game: Game) {
        const skillTrees = new Map<string, Map<string, string[]>>();

        for (const skill of game.skills.allObjects) {
            const trees = new Map<string, string[]>();

            for (const tree of skill.skillTrees.allObjects) {
                trees.set(
                    tree.id,
                    tree.nodes.allObjects.filter(node => node.isUnlocked).map(node => node.id)
                );
            }

            skillTrees.set(skill.id, trees);
        }

        return skillTrees;
    }

    private static getAstrology(game: Game) {
        // get the active astrology modifiers
        const astrologyModifiers: Map<string, AstrologySettings> = new Map();

        for (const constellation of game.astrology.actions.allObjects) {
            astrologyModifiers.set(constellation.id, {
                standardModsBought: constellation.standardModifiers.map(modifier => modifier.timesBought),
                uniqueModsBought: constellation.uniqueModifiers.map(modifier => modifier.timesBought),
                abyssalModsBought: constellation.abyssalModifiers.map(modifier => modifier.timesBought)
            });
        }

        return astrologyModifiers;
    }

    private static getAgility(game: Game) {
        const agility: AgilitySettings[] = Array.from(game.agility.courses.entries()).map(([realm, course]) => {
            const obstacles: [string, number, boolean][] = Array.from(course.builtObstacles.entries()).map(
                ([category, obstacle]) => {
                    const mastery = game.agility.actionMastery.get(obstacle);
                    return [obstacle.id, category, (mastery?.level ?? 0) >= 99];
                }
            );

            const pillars: [string, number][] = Array.from(course.builtPillars.entries()).map(([category, pillar]) => [
                pillar.id,
                category
            ]);

            return { realmId: realm.id, obstacles, pillars };
        });

        return agility;
    }

    private static getTownshipCombatBuildings(game: Game) {
        const buildings = game.township.buildings.filter(building => ModifierHelper.hasCombatModifiers(building.stats));

        const townshipBuildings = new Map<string, [number, number]>();

        for (const building of buildings) {
            const biome = game.township.biomes.find(
                biome => biome.availableBuildings.find(available => available.id === building.id) !== undefined
            );

            if (!biome) {
                continue;
            }

            townshipBuildings.set(building.id, [
                biome.buildingsBuilt.get(building),
                biome.buildingEfficiency.get(building)
            ]);
        }

        return townshipBuildings;
    }

    private static getSelectedAncientRelics(game: Game) {
        const ancientRelicsSelected: [string, string[]][] = [];

        if (game.currentGamemode.allowAncientRelicDrops) {
            for (const skill of game.skills.allObjects) {
                if (!skill.hasAncientRelics) {
                    continue;
                }

                for (const [realm, set] of Array.from(skill.ancientRelicSets.entries())) {
                    if (realm.id === Lookup.melvor.id && !Global.ancientRelicMelvorSkillKeys.includes(skill.localID)) {
                        continue;
                    }

                    if (
                        cloudManager.hasItAEntitlementAndIsEnabled &&
                        realm.id === Lookup.abyssal.id &&
                        !Global.ancientRelicAbyssalSkillKeys.includes(skill.localID)
                    ) {
                        continue;
                    }

                    ancientRelicsSelected.push([
                        `${realm.id}-${skill.id}`,
                        Array.from(set.foundRelics.keys()).map(relic => relic.id)
                    ]);
                }
            }
        }

        return ancientRelicsSelected;
    }

    public static getSlayerRequirementData(game: Game) {
        const dungeonSet = new Set<Dungeon>();
        const abyssDepthSet = new Set<AbyssDepth>();
        const purchaseSet = new Set<ShopPurchase>();
        const itemsFoundSet = new Set<AnyItem>();

        for (const area of game.slayerAreas.allObjects) {
            area.entryRequirements
                ?.filter(requirement => requirement.type === 'DungeonCompletion')
                .forEach((requirement: DungeonRequirement) => {
                    dungeonSet.add(requirement.dungeon);
                });

            area.entryRequirements
                ?.filter(requirement => requirement.type === 'AbyssDepthCompletion')
                .forEach((requirement: AbyssDepthRequirement) => {
                    abyssDepthSet.add(requirement.depth);
                });

            area.entryRequirements
                ?.filter(requirement => requirement.type === 'ShopPurchase')
                .forEach((requirement: ShopPurchaseRequirement) => {
                    purchaseSet.add(requirement.purchase);
                });

            area.entryRequirements
                ?.filter(requirement => requirement.type === 'ItemFound')
                .forEach((requirement: ItemFoundRequirement) => {
                    itemsFoundSet.add(requirement.item);
                });
        }

        return { dungeonSet, abyssDepthSet, purchaseSet, itemsFoundSet };
    }

    public static getSlayerData(game: Game) {
        const { dungeonSet, abyssDepthSet, purchaseSet, itemsFoundSet } = this.getSlayerRequirementData(game);

        const slayer: SlayerSettings = {
            dungeonCompletion: [],
            abyssDepthCompletion: [],
            shopPurchase: [],
            foundItem: []
        };

        for (const dungeon of dungeonSet.values()) {
            const count = game.combat.dungeonCompletion.get(dungeon);

            if (count) {
                slayer.dungeonCompletion.push(dungeon.id);
            }
        }

        for (const abyssDepth of abyssDepthSet.values()) {
            if (abyssDepth.timesCompleted) {
                slayer.abyssDepthCompletion.push(abyssDepth.id);
            }
        }

        for (const purchase of purchaseSet.values()) {
            const count = game.shop.upgradesPurchased.get(purchase);

            if (count) {
                slayer.shopPurchase.push(purchase.id);
            }
        }

        for (const item of itemsFoundSet.values()) {
            const found = game.stats.itemFindCount(item);

            if (found) {
                slayer.foundItem.push(item.id);
            }
        }

        return slayer;
    }

    private static toBase64(settings: Settings) {
        const json = JSON.stringify(
            settings,
            (_key, value) => {
                if (value instanceof Map) {
                    return {
                        dataType: 'Map',
                        value: Array.from(value.entries())
                    };
                } else {
                    return value;
                }
            },
            1
        );

        const bytes = new TextEncoder().encode(json);
        const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');

        return btoa(binString);
    }

    private static toJson(settings: string) {
        let json: string;

        if (this.isLegacy(settings)) {
            json = settings;
        } else {
            const binString = atob(settings);
            const bytes = Uint8Array.from(binString, m => m.codePointAt(0));
            json = new TextDecoder().decode(bytes);
        }

        return JSON.parse(json, (_key, value) => {
            if (typeof value === 'object' && value !== null && value.dataType === 'Map') {
                return new Map(value.value);
            }

            return value;
        }) as Settings;
    }

    private static isLegacy(settings: string) {
        const potentialKeys = ['{', '}', '"', "'"];
        const lowerCaseSettings = settings.toLowerCase();

        // surely if the settings contain these characters its json and not base64...
        return potentialKeys.some(key => lowerCaseSettings.includes(key));
    }
}

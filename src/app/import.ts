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

import type { SimGame } from './sim-game';
import type { SimPlayer } from './sim-player';
import { App } from './app';
import { MICSR } from './micsr';

// this.micsr.defaultSettings = {
//     // version: this.micsr.version,
//     astrologyModifiers: [],
//     course: Array(10).fill(-1),
//     courseMastery: { "-1": false },
//     equipment: Array(Object.getOwnPropertyNames(equipmentSlotData).length).fill(-1),
//     levels: Array(this.micsr.game.skills.allObjects.length).fill(1),
//     petUnlocked: Array(this.micsr.pets.length).fill(false),
//     styles: {
//         melee: 'Stab',
//         ranged: 'Accurate',
//         magic: 'Magic',
//     },
//     prayerSelected: [],
//     ancient: undefined,
//     archaic: undefined,
//     aurora: undefined,
//     autoEatTier: -1,
//     cookingMastery: false,
//     cookingPool: false,
//     currentGamemode: 0,
//     curse: undefined,
//     foodSelected: undefined,
//     healAfterDeath: true,
//     isManualEating: false,
//     isSlayerTask: false,
//     pillar: undefined,
//     potionID: undefined,
//     standard: 0,
//     summoningSynergy: true,
//     useCombinationRunes: false,
// }
// this.micsr.defaultSettings.levels[this.micsr.skillIDs.Hitpoints] = 10;

export interface IImportSpells {
    [index: string]: string;
    ancient: string;
    aurora: string;
    archaic: string;
    curse: string;
    standard: string;
}

export interface IImportAstrology {
    standardModsBought: number[];
    uniqueModsBought: number[];
}

export interface IImportSlayer {
    dungeonCompletion: string[];
    shopPurchase: string[];
    foundItem: string[];
}

export interface IImportSettings {
    version: string;
    // lists
    astrologyModifiers: Map<string, IImportAstrology>;
    course: number[];
    courseMastery: boolean[];
    equipment: string[];
    levels: Map<string, number>;
    petUnlocked: string[];
    // objects
    styles: {
        magic: string;
        melee: string;
        ranged: string;
    };
    spells: IImportSpells;
    slayer: IImportSlayer;
    // simple values
    autoEatTier: number;
    cookingMastery: boolean;
    cookingPool: boolean;
    currentGamemodeID: string;
    foodSelected: string;
    healAfterDeath: boolean;
    isManualEating: boolean;
    isSolarEclipse: boolean;
    isSynergyUnlocked: boolean;
    isSlayerTask: boolean;
    pillarID: string;
    pillarEliteID: string;
    potionID?: string;
    prayerSelected: string[];
    ancientRelicsSelected: [string, string[]][];
    useCombinationRunes: boolean;
    cartographyWorldMap: string;
    cartographyPointOfInterest: string;
    cartographyMasteredHexes: number;
}

/**
 * Class to handle importing
 */
export class Import {
    app: App;
    document: any;
    actualPlayer: Player;
    simPlayer: SimPlayer;
    micsr: MICSR;

    constructor(app: App) {
        this.app = app;
        this.micsr = app.micsr;
        this.actualPlayer = app.actualGame.combat.player;
        this.simPlayer = app.player;
        this.document = document;
    }

    /**
     * Callback for when the import button is clicked
     * @param {number} setID Index of equipmentSets from 0-2 to import
     */
    importButtonOnClick(setID: number) {
        let actualGame = this.micsr.actualGame;
        // get potion
        let potionID: string | undefined = undefined;
        let potion = actualGame.items.potions.find(potion => {
            return potion.action.localID === 'Combat' && actualGame.potions.isPotionActive(potion);
        });
        if (potion) {
            potionID = potion.id;
        }

        // get foodSelected
        const foodSelected = this.actualPlayer.food.currentSlot.item;
        // get cooking mastery for foodSelected
        let cookingMastery = false;
        const recipe = actualGame.cooking.productRecipeMap.get(foodSelected);
        if (recipe && recipe.hasMastery) {
            cookingMastery = actualGame.cooking.getMasteryLevel(recipe) >= 99;
        }
        const cookingPool = actualGame.cooking.isPoolTierActive(3);

        // get the player's auto eat tier
        const autoEatTier =
            -1 +
            this.app.game.autoEatTiers.filter(x =>
                actualGame.shop.isUpgradePurchased(actualGame.shop.purchases.getObjectByID(x)!)
            ).length;

        // get the active astrology modifiers
        const astrologyModifiers: Map<string, IImportAstrology> = this.getAstrologyFromGame(actualGame);

        // get the chosen agility obstacles
        const chosenAgilityObstacles = new Array(this.app.agilityCourse.agilityCategories).fill(-1);
        const courseMastery = new Array(this.app.agilityCourse.agilityCategories).fill(false);
        this.app.actualGame.agility.actions.allObjects.forEach((obstacle, i) => {
            if (this.app.actualGame.agility.isObstacleBuilt(obstacle)) {
                chosenAgilityObstacles[obstacle.category] = i;
                if (this.app.actualGame.agility.getMasteryLevel(obstacle) >= 99) {
                    courseMastery[obstacle.category] = true;
                }
            }
        });
        this.app.agilityCourse.updateBlueprints(this.app.actualGame.agility.blueprints);

        const equipmentSet = this.actualPlayer.equipmentSets[setID];
        const equipment = equipmentSet.equipment;

        // create settings object
        const settings: IImportSettings = {
            version: this.micsr.version,
            // lists
            astrologyModifiers: astrologyModifiers,
            course: chosenAgilityObstacles,
            courseMastery: courseMastery,
            equipment: equipment.slotArray.map(x => x.item.id),
            levels: new Map(actualGame.skills.allObjects.map(skill => [skill.id, skill.level])),
            petUnlocked: actualGame.pets.allObjects
                .filter(pet => actualGame.petManager.isPetUnlocked(pet))
                .map(pet => pet.id),
            // objects
            styles: {
                magic: this.actualPlayer['attackStyles'].magic.id,
                melee: this.actualPlayer['attackStyles'].melee.id,
                ranged: this.actualPlayer['attackStyles'].ranged.id
            },
            spells: {
                ancient: equipmentSet.spellSelection.ancient?.id || '',
                archaic: equipmentSet.spellSelection.archaic?.id || '',
                aurora: equipmentSet.spellSelection.aurora?.id || '',
                curse: equipmentSet.spellSelection.curse?.id || '',
                standard: equipmentSet.spellSelection.standard?.id || ''
            },
            // simple values
            autoEatTier: autoEatTier,
            cookingMastery: cookingMastery,
            cookingPool: cookingPool,
            currentGamemodeID: actualGame.currentGamemode.id,
            foodSelected: foodSelected.id,
            healAfterDeath: this.simPlayer.healAfterDeath,
            isManualEating: this.simPlayer.isManualEating,
            isSolarEclipse: (<any>this.app.actualGame.township.townData).season.id === 'melvorF:SolarEclipse',
            isSynergyUnlocked: this.simPlayer.isSynergyUnlocked,
            isSlayerTask: this.simPlayer.isSlayerTask,
            slayer: this.app.getSlayerData(this.app.actualGame),
            pillarID: actualGame.agility['builtPassivePillar']?.id || '',
            pillarEliteID: actualGame.agility['builtElitePassivePillar']?.id || '',
            potionID: potionID,
            prayerSelected: Array.from(equipmentSet.prayerSelection).map(p => p.id),
            ancientRelicsSelected: actualGame.skills
                .filter(skill => this.micsr.ancientRelicSkillKeys.includes(skill.localID))
                .map(skill => {
                    return [
                        skill.localID,
                        Array.from((<any>skill).ancientRelicsFound).map((relic: any) => relic[0].localID)
                    ];
                }),
            useCombinationRunes: actualGame.settings.useCombinationRunes,
            // @ts-ignore
            cartographyWorldMap: cloudManager.hasAoDEntitlement ? (<any>actualGame).cartography.activeMap?.id : '',
            // @ts-ignore
            cartographyPointOfInterest: cloudManager.hasAoDEntitlement
                ? (<any>actualGame).cartography.activeMap?.playerPosition?.pointOfInterest?.id
                : '',
            // @ts-ignore
            cartographyMasteredHexes: cloudManager.hasAoDEntitlement
                ? (<any>actualGame).cartography.activeMap?.masteredHexes
                : 0
        };

        // import settings
        this.importSettings(settings);
    }

    exportSettings(): IImportSettings {
        const simGame = this.simPlayer.game;
        const courseMastery = this.simPlayer.courseMastery;
        const autoEatTier =
            -1 +
            this.app.game.autoEatTiers.filter(x =>
                simGame.shop.isUpgradePurchased(simGame.shop.purchases.getObjectByID(x)!)
            ).length;
        return {
            version: this.micsr.version,
            // lists
            astrologyModifiers: this.getAstrologyFromGame(simGame),
            course: this.simPlayer.course,
            courseMastery: courseMastery,
            equipment: this.simPlayer.equipment.slotArray.map((x: any) => x.item.id),
            levels: this.simPlayer.skillLevel,
            petUnlocked: this.simPlayer.petUnlocked.map(pet => pet.id),
            // objects
            styles: {
                magic: this.simPlayer['attackStyles'].magic.id,
                melee: this.simPlayer['attackStyles'].melee.id,
                ranged: this.simPlayer['attackStyles'].ranged.id
            },
            prayerSelected: Array.from(this.simPlayer.activePrayers).map(p => p.id),
            ancientRelicsSelected: this.app.game.skills
                .filter(skill => this.micsr.ancientRelicSkillKeys.includes(skill.localID))
                .map(skill => {
                    return [
                        skill.localID,
                        Array.from((<any>skill).ancientRelicsFound).map((relic: any) => relic[0].localID)
                    ];
                }),
            spells: {
                ancient: this.simPlayer.spellSelection.ancient?.id || '',
                archaic: this.simPlayer.spellSelection.archaic?.id || '',
                aurora: this.simPlayer.spellSelection.aurora?.id || '',
                curse: this.simPlayer.spellSelection.curse?.id || '',
                standard: this.simPlayer.spellSelection.standard?.id || ''
            },
            slayer: this.app.getSlayerData(this.app.game),
            // simple values
            autoEatTier: autoEatTier,
            cookingMastery: this.simPlayer.cookingMastery,
            cookingPool: this.simPlayer.cookingPool,
            currentGamemodeID: this.simPlayer.currentGamemodeID,
            foodSelected: this.simPlayer.food.currentSlot.item.id,
            healAfterDeath: this.simPlayer.healAfterDeath,
            isManualEating: this.simPlayer.isManualEating,
            isSolarEclipse: this.simPlayer.isSolarEclipse,
            isSynergyUnlocked: this.simPlayer.isSynergyUnlocked,
            isSlayerTask: this.simPlayer.isSlayerTask,
            pillarID: this.simPlayer.pillarID,
            pillarEliteID: this.simPlayer.pillarEliteID,
            potionID: this.simPlayer.potion?.id,
            useCombinationRunes: this.simPlayer.useCombinationRunes,
            // @ts-ignore
            cartographyWorldMap: cloudManager.hasAoDEntitlement
                ? (<any>this.simPlayer.game).cartography.activeMap?.id
                : '',
            // @ts-ignore
            cartographyPointOfInterest: cloudManager.hasAoDEntitlement
                ? (<any>this.simPlayer.game).cartography.activeMap?.playerPosition?.pointOfInterest?.id
                : '',
            // @ts-ignore
            cartographyMasteredHexes: cloudManager.hasAoDEntitlement
                ? (<any>this.simPlayer.game).cartography.activeMap?.masteredHexes
                : 0
        };
    }

    importSettings(settings: IImportSettings) {
        if (settings.version !== this.micsr.version) {
            this.micsr.logger.warn(`Importing MICSR ${settings.version} settings in MICSR ${this.micsr.version}.`);
        }
        // validate
        // for (const prop in this.micsr.defaultSettings) {
        //     if (settings[prop] === undefined) {
        //         this.micsr.log(
        //             `No valid ${prop} data imported, using default ${this.micsr.defaultSettings[prop]}.`
        //         );
        //         settings[prop] = this.micsr.defaultSettings[prop];
        //     }
        // }
        // import settings
        this.simPlayer.isSynergyUnlocked = true;
        this.importLevels(settings.levels);
        this.importEquipment(settings.equipment);
        this.importStyle(settings.styles);
        this.importSpells(settings.spells);
        this.importAncientRelics(settings.ancientRelicsSelected);
        this.importPrayers(settings.prayerSelected);
        this.importPotion(settings.potionID);
        this.importPets(settings.petUnlocked);
        this.importAutoEat(settings.autoEatTier, settings.foodSelected, settings.cookingPool, settings.cookingMastery);
        this.importManualEating(settings.isManualEating);
        this.importHealAfterDeath(settings.healAfterDeath);
        this.importSlayerTask(settings.isSlayerTask);
        this.importGameMode(settings.currentGamemodeID);
        this.importUseCombinationRunes(settings.useCombinationRunes);
        this.importAgilityCourse(settings.course, settings.courseMastery, settings.pillarID, settings.pillarEliteID);
        this.importSlayer(settings.slayer);
        this.importAstrology(settings.astrologyModifiers);
        this.importTownship(settings.isSolarEclipse);
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            this.importCartography(
                settings.cartographyWorldMap,
                settings.cartographyPointOfInterest,
                settings.cartographyMasteredHexes
            );
        }

        // update and compute values
        this.app.updateUi();

        // notify completion
        this.app.notify('Import completed.');
    }

    importEquipment(equipment: any) {
        // clear previous items
        this.simPlayer.equipment.unequipAll();
        for (const slot in this.micsr.equipmentSlotData) {
            const slotID = (<any>this.micsr.equipmentSlotData)[slot].id;
            this.app.setEquipmentImage(slotID);
        }
        // load new items
        for (const slot in this.micsr.equipmentSlotData) {
            const slotID = (<any>this.micsr.equipmentSlotData)[slot].id;
            const itemID = equipment[slotID];
            if (itemID === 'melvorD:Empty_Equipment') {
                continue;
            }
            this.app.equipItem(slotID, this.micsr.game.items.getObjectByID(itemID), false, true);
        }

        if (!this.simPlayer.equipment.slots.Summon1.isEmpty && !this.simPlayer.equipment.slots.Summon2.isEmpty) {
            const summon1 = this.micsr.actualGame.items.equipment.getObjectByID(
                this.simPlayer.equipment.slots.Summon1.item.id
            );
            const summon2 = this.micsr.actualGame.items.equipment.getObjectByID(
                this.simPlayer.equipment.slots.Summon2.item.id
            );

            if (summon1 && summon2) {
                const synergyData = this.micsr.actualGame.summoning.getSynergyData(summon1, summon2);

                this.simPlayer.isSynergyUnlocked = synergyData
                    ? this.micsr.actualGame.summoning.isSynergyUnlocked.call(
                          this.micsr.actualGame.summoning,
                          synergyData
                      )
                    : true;
            }
        }

        this.app.updateEquipmentStats();
    }

    importLevels(levels: Map<string, number>) {
        this.app.skillKeys.forEach(key => {
            this.document.getElementById(`MCS ${key} Input`).value = levels.get(this.micsr.skillIDs[key]);
        });
        this.simPlayer.skillLevel = levels;
    }

    importStyle(styles: any) {
        ['melee', 'ranged', 'magic'].forEach((cbStyle: AttackType) => {
            let attackStyle = this.micsr.game.attackStyles.getObjectByID(styles[cbStyle])!;

            if (!attackStyle) {
                attackStyle = this.micsr.game.attackStyles.filter(style => style.attackType === cbStyle)[0];
            }

            const index = this.micsr.attackStylesIdx[attackStyle.id];
            this.simPlayer.attackStyles[cbStyle] = attackStyle;
            this.document.getElementById(`MCS ${cbStyle} Style Dropdown`).selectOption(index % 3);
        });
        this.app.updateCombatStats();
    }

    importSpells(spellSelection: IImportSpells) {
        // Set all active spell UI to be disabled
        this.importSpell(this.app.combatData.spells.ancient, spellSelection, 'ancient');
        this.importSpell(this.app.combatData.spells.archaic, spellSelection, 'archaic');
        this.importSpell(this.app.combatData.spells.aurora, spellSelection, 'aurora');
        this.importSpell(this.app.combatData.spells.curse, spellSelection, 'curse');
        this.importSpell(this.app.combatData.spells.standard, spellSelection, 'standard');
        this.app.spellSanityCheck();
    }

    private importSpell(
        spells: NamespaceRegistry<CombatSpell>,
        spellSelection: IImportSpells,
        spellType: CombatSpellBook
    ) {
        const selected = this.simPlayer.getSpellFromType(spellType);
        this.app.disableSpell(spellType, selected);
        const newSpell = spells.getObjectByID(spellSelection[spellType]);
        if (newSpell) {
            this.app.enableSpell(spellType, newSpell);
        }
    }

    importSlayer(slayer: IImportSlayer) {
        this.app.game.combat['dungeonCompletion'].clear();

        const { itemsFoundSet } = this.app.getSlayerRequirementData(this.app.game);

        for (const item of itemsFoundSet.values()) {
            this.app.game.stats.Items.getTracker(item).remove(ItemStats.TimesFound);
        }

        for (const dungeonId of slayer.dungeonCompletion) {
            const dungeon = this.app.game.dungeons.getObjectByID(dungeonId);
            this.app.game.combat['dungeonCompletion'].set(dungeon, 1);
        }

        for (const purchaseId of slayer.shopPurchase) {
            const purchase = this.app.game.shop.purchases.getObjectByID(purchaseId)!;
            this.app.game.shop.upgradesPurchased.set(purchase, 1);
        }

        for (const itemId of slayer.foundItem) {
            const item = this.app.game.items.getObjectByID(itemId)!;
            this.app.game.stats.Items.add(item, ItemStats.TimesFound, 1);
        }
    }

    importAncientRelics(ancientRelicsSelected: [string, string[]][]) {
        const skills = this.micsr.game.skills.filter(skill => this.micsr.ancientRelicSkillKeys.includes(skill.localID));

        skills.forEach((skill: any) => {
            skill.ancientRelicsFound.clear();
            skill.numberOfRelicsFound = 0;
        });

        skills.forEach((skill: any) => {
            skill.ancientRelics.forEach((relic: any) => {
                const button = this.document.getElementById(`MCS ${relic.relic.localID} Button`);
                const skillData = ancientRelicsSelected.find(data => data[0] === skill.localID);

                if (button) {
                    if (skillData && skillData[1].includes(relic.relic.localID)) {
                        this.app.selectButton(button);
                        skill.ancientRelicsFound.set(relic.relic, 1);
                        skill.numberOfRelicsFound++;
                    } else {
                        this.app.unselectButton(button);
                    }
                }
            });

            if (skill.completedAncientRelic) {
                const masterButton = this.document.getElementById(`MCS ${skill.completedAncientRelic.localID} Button`);

                if (masterButton) {
                    if (skill.ancientRelicsFound.size === skill.ancientRelics.length) {
                        this.app.selectButton(masterButton);
                    } else {
                        this.app.unselectButton(masterButton);
                    }
                }
            }
        });
    }

    importPrayers(prayerSelected: string[]) {
        // Toggle old prayers off
        this.simPlayer.activePrayers.clear();
        // Update prayers
        this.micsr.prayers.forEach(prayer => {
            const prayButton = this.document.getElementById(`MCS ${this.app.getPrayerName(prayer)} Button`);
            if (prayerSelected.includes(prayer.id)) {
                this.app.selectButton(prayButton);
                this.simPlayer.activePrayers.add(prayer);
            } else {
                this.app.unselectButton(prayButton);
            }
        });
    }

    importPotion(potionID?: string) {
        // Deselect potion if selected
        if (this.simPlayer.potion) {
            const recipe = this.app.game.herblore['potionToRecipeMap'].get(this.simPlayer.potion);

            if (recipe) {
                this.app.unselectButton(this.document.getElementById(`MCS ${this.app.getPotionHtmlId(recipe)} Button`));
                this.simPlayer.setPotion(undefined);
            }
        }

        // Select new potion if applicable
        if (potionID) {
            const potion = this.simPlayer.game.items.potions.getObjectByID(potionID);
            this.simPlayer.setPotion(potion);

            const recipe = this.app.game.herblore['potionToRecipeMap'].get(this.simPlayer.potion);

            if (this.simPlayer.potion && recipe) {
                this.app.selectButton(this.document.getElementById(`MCS ${this.app.getPotionHtmlId(recipe)} Button`));
                this.app.updatePotionTier(this.simPlayer.potion.tier);
            }
        }
    }

    importPets(petUnlocked: string[]) {
        this.simPlayer.petUnlocked = [];
        this.app.game.petManager['unlocked'].clear();
        this.app.game.pets.forEach(pet => {
            this.app.unselectButton(this.document.getElementById(`MCS ${pet.name} Button`));
        });
        // Import pets
        petUnlocked.forEach(petID => {
            const pet = this.app.game.pets.getObjectByID(petID)!;
            const realPet = this.app.actualGame.pets.getObjectByID(petID)!;

            if (!pet) {
                return;
            }

            this.app.game.petManager['unlocked'].add(pet);
            this.app.game.petManager['unlocked'].add(realPet);
            this.app.player.petUnlocked.push(pet);
            this.app.player.petUnlocked.push(realPet);
            this.app.selectButton(this.document.getElementById(`MCS ${pet.name} Button`));
            // if (petID === 4 && owned)
            //     this.document.getElementById("MCS Rock").style.display = "";
        });
    }

    importAutoEat(autoEatTier: number, foodSelected: string, cookingPool: boolean, cookingMastery: boolean) {
        // Import Food Settings
        this.simPlayer.game.setAutoEatTier(autoEatTier);
        this.document.getElementById('MCS Auto Eat Tier Dropdown').selectOption(autoEatTier + 1);
        this.app.equipFood(foodSelected);
        this.checkRadio('MCS 95% Cooking Pool', cookingPool);
        this.simPlayer.cookingPool = cookingPool;
        this.checkRadio('MCS 99 Cooking Mastery', cookingMastery);
        this.simPlayer.cookingMastery = cookingMastery;
    }

    importManualEating(isManualEating: boolean) {
        this.checkRadio('MCS Manual Eating', isManualEating);
        this.simPlayer.isManualEating = isManualEating;
    }

    importHealAfterDeath(healAfterDeath: boolean) {
        this.checkRadio('MCS Heal After Death', healAfterDeath);
        this.simPlayer.healAfterDeath = healAfterDeath;
    }

    importSlayerTask(isSlayerTask: boolean) {
        // Update slayer task mode
        this.checkRadio('MCS Slayer Task', isSlayerTask);
        this.simPlayer.isSlayerTask = isSlayerTask;
        this.app.slayerTaskSimsToggle();
    }

    importGameMode(gamemodeID: string) {
        this.simPlayer.currentGamemodeID = gamemodeID;
        const index = this.micsr.gamemodes.findIndex(x => x.id === gamemodeID);
        this.document.getElementById('MCS Game Mode Dropdown').selectOption(index);
    }

    importUseCombinationRunes(useCombinationRunes: boolean) {
        // Update hardcore mode
        this.checkRadio('MCS Use Combination Runes', useCombinationRunes);
        this.simPlayer.useCombinationRunes = useCombinationRunes;
    }

    importAgilityCourse(course: number[], masteries: boolean[], pillarID: string, elitePillarID: string) {
        this.app.agilityCourse.importAgilityCourse(course, masteries, pillarID, elitePillarID);
    }

    importAstrology(astrologyModifiers: Map<string, IImportAstrology>) {
        astrologyModifiers.forEach((value, key) => {
            const constellation = this.app.game.astrology.actions.getObjectByID(key)!;
            constellation.standardModsBought = value.standardModsBought;
            constellation.uniqueModsBought = value.uniqueModsBought;
        });

        this.app.game.astrology.computeProvidedStats(false);
        this.app.updateAstrologyMods();
        setTimeout(() => this.app.updateAstrologyTooltips(), 10);
    }

    importTownship(isSolarEclipse: boolean) {
        this.app.player.isSolarEclipse = isSolarEclipse;
        this.app.player.computeModifiers();
        this.checkRadio('MCS Solar Eclipse', this.app.player.isSolarEclipse);
    }

    importCartography(worldMapId: string, pointOfInterestId: string, masteredHexes: number) {
        const cartography = (<any>this.app.game).cartography;
        const worldMap = cartography.worldMaps.getObjectByID(worldMapId);
        const pointOfInterest = worldMap.pointsOfInterest.find((poi: any) => poi.id === pointOfInterestId);

        cartography.worldMaps.forEach((map: any) => {
            const button = this.document.getElementById(`MCS ${map.playerPosition?.pointOfInterest?.localID} Button`);

            if (button) {
                this.app.unselectButton(button);
            }
        });

        let didUpdate = false;

        if (worldMap) {
            worldMap.masteredHexes = masteredHexes;
            didUpdate = true;

            worldMap.sortedMasteryBonuses.forEach((masteryBonus: any) => {
                const button = document.getElementById(`MCS ${masteryBonus?.localID} Hexes Button`);

                if (button) {
                    if (masteryBonus.masteredHexes <= worldMap.masteredHexes) {
                        masteryBonus.awarded = true;
                        this.app.selectButton(button);
                    } else {
                        masteryBonus.awarded = false;
                        this.app.unselectButton(button);
                    }
                }
            });
        }

        if (worldMap && pointOfInterest) {
            worldMap.setPlayerPosition(pointOfInterest.hex);
            cartography.activeMap = worldMap;

            didUpdate = true;

            const button = this.document.getElementById(`MCS ${pointOfInterest.localID} Button`);

            if (button) {
                this.app.selectButton(button);
            }
        } else {
            const firstNonActive = cartography.activeMap.pointsOfInterest.find((poi: any) => !poi.activeModifiers);

            if (firstNonActive) {
                cartography.activeMap.setPlayerPosition(firstNonActive.hex);
                didUpdate = true;
            }
        }

        if (didUpdate) {
            setTimeout(() => this.app.updateCartographyTooltips(), 10);
            cartography.computeProvidedStats(false);
        }
    }

    getAstrologyFromGame(game: Game | SimGame) {
        const astrologyModifiers: Map<string, IImportAstrology> = new Map();
        for (const constellation of game.astrology.actions.allObjects) {
            // Make sure to not copy the array reference or the real game will be updated
            astrologyModifiers.set(constellation.id, {
                standardModsBought: JSON.parse(JSON.stringify(constellation.standardModsBought)),
                uniqueModsBought: JSON.parse(JSON.stringify(constellation.uniqueModsBought))
            });
        }
        return astrologyModifiers;
    }

    convertObjectToJson(settings: IImportSettings): string {
        return JSON.stringify(
            settings,
            (k, v) => {
                if (v instanceof Map) {
                    return {
                        dataType: 'Map',
                        value: Array.from(v.entries())
                    };
                } else {
                    return v;
                }
            },
            1
        );
    }

    convertStringToObject(value: string): IImportSettings {
        return JSON.parse(value, (k, v) => {
            if (typeof v === 'object' && v !== null) {
                if (v.dataType === 'Map') {
                    return new Map(v.value);
                }
            }
            return v;
        });
    }

    checkRadio(baseID: string, check: boolean) {
        const yesOrNo = check ? 'Yes' : 'No';
        this.document.getElementById(`${baseID} Radio ${yesOrNo}`).checked = true;
    }
}

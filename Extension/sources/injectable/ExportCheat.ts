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
 * Class to handle exporting to the game, this cheats the current character in a destructive irreversible manner!
 */
class ExportCheat extends Import {
    actualApp: App;

    constructor(app: App) {
        super(app);
        this.actualApp = app;
        this.micsr = app.micsr;
        this.document = {
            getElementById: () => {
                return {};
            },
        };
        /*
        this.app = {
            setEquipmentImage: () => {
            },
            equipItem: (slotID: any, itemID: any) => {
                const qty = [EquipmentSlots.Quiver, EquipmentSlots.Summon1, EquipmentSlots.Summon2].includes(slotID) ? Number.MAX_SAFE_INTEGER : 1;
                // @ts-expect-error TS(2304): Cannot find name 'addItemToBank'.
                addItemToBank(itemID, qty, true, false, true);
                this.player.equipItem(itemID, 0, EquipmentSlots[slotID], qty)
            },
            updateStyleDropdowns: () => {
            },
            selectButton: () => {
            },
            unselectButton: () => {
            },
            getPrayerName: () => {
            },
            notify: (...args: any[]) => this.actualApp.notify(...args),
        };
        */
    }

    cheat() {
        // add some bank space
        //// @ts-expect-error TS(2304): Cannot find name 'addShopPurchase'.
        // addShopPurchase('General', 0, 1e3);
        this.simPlayer.computeAllStats();
        // add some runes, in case we need them
        //// @ts-expect-error TS(2304): Cannot find name 'items'.
        // items.filter((x: any) => x.type === 'Rune').forEach((x: any) => addItemToBank(x.id, Number.MAX_SAFE_INTEGER, true, false, true));
        // export settings
        const settings = this.actualApp.import.exportSettings();
        // cheat settings to game
        this.importSettings(settings);
        // update stats
        this.simPlayer.computeAllStats();
    }

    update() {
        // do nothing
    }

    importLevels(levels: Map<string, number>) {
        levels.forEach((v, k) => {
            const skill = this.actualApp.actualGame.skills.getObjectByID(k);
            skill?.setXP(exp.level_to_xp(v) + 1);
        });
    }

    importSpells(spellSelection: any) {
        // this.player.spellSelection = spellSelection;
    }

    importPotion(potionID?: string) {
        /*
        // @ts-expect-error TS(2304): Cannot find name 'Herblore'.
        if (Herblore.potions[potionID] === undefined) {
            // @ts-expect-error TS(2304): Cannot find name 'herbloreBonuses'.
            herbloreBonuses[13] = {
                bonus: [null, null],
                charges: 0,
                itemID: 0,
            };
            return;
        }
        // @ts-expect-error TS(2304): Cannot find name 'Herblore'.
        const id = (Herblore.potions[potionID].potionIDs[potionTier]);
        // @ts-expect-error TS(2304): Cannot find name 'addItemToBank'.
        addItemToBank(id, 1000000, true, false, true)
        // @ts-expect-error TS(2304): Cannot find name 'usePotion'.
        usePotion(id, false, true);
        */
    }

    importPets(petUnlocked: Pet[]) {}

    importStyle(styles: any): void {}

    importPrayers(prayerSelected: string[]): void {}

    importAutoEat(
        autoEatTier: any,
        foodSelected: any,
        cookingPool: any,
        cookingMastery: any
    ) {
        /*
        // clear AE purchases
        // @ts-expect-error TS(2304): Cannot find name 'shopItemsPurchased'.
        this.autoEatTiers.forEach((aet: any) => shopItemsPurchased.delete(`General:${aet}`));
        // add AE purchases
        for (let i = 0; i < autoEatTier; i++) {
            // @ts-expect-error TS(2304): Cannot find name 'addShopPurchase'.
            addShopPurchase('General', this.autoEatTiers[i]);
        }
        // equip food
        this.player.food.selectedIndex = 0;
        this.player.food.unequipSelected();
        // @ts-expect-error TS(2304): Cannot find name 'items'.
        if (items[foodSelected] !== undefined) {
            // @ts-expect-error TS(2304): Cannot find name 'addItemToBank'.
            addItemToBank(foodSelected, Number.MAX_SAFE_INTEGER);
            this.player.equipFood(foodSelected, Number.MAX_SAFE_INTEGER);
        }
        // set cooking pool
        // @ts-expect-error TS(2304): Cannot find name 'MASTERY'.
        MASTERY[Skills.Cooking].pool = cookingPool * 95 * getMasteryPoolTotalXP(Skills.Cooking) / 100 + 1;
        // set cooking mastery
        // @ts-expect-error TS(2304): Cannot find name 'MASTERY'.
        MASTERY[Skills.Cooking].xp.fill(cookingMastery * 14e6)
        */
    }

    importManualEating(isManualEating: any) {
        // TODO?
    }

    importHealAfterDeath(healAfterDeath: any) {
        // TODO?
    }

    importSlayerTask(isSlayerTask: any) {
        /*
        if (isSlayerTask && !this.actualApp.barSelected || !this.actualApp.barIsMonster(this.actualApp.selectedBar)) {
            this.actualApp.notify('No monster selected, not setting slayer task !', 'danger');
            isSlayerTask = false;
        }
        // set slayer task to currently selected monster
        this.micsr.actualGame.combat.slayerTask.active = isSlayerTask;
        if (isSlayerTask) {
            this.micsr.actualGame.combat.slayerTask.monster = this.micsr.monsters.getObjectByID(this.actualApp.barMonsterIDs[this.actualApp.selectedBar]);
        }
        this.micsr.actualGame.combat.slayerTask.killsLeft = isSlayerTask * Number.MAX_SAFE_INTEGER;
        */
    }

    importGameMode(currentGamemode: any) {
        /*
        if ((window as any).currentGamemode !== currentGamemode) {
            this.actualApp.notify('Game mode changed, SAVE AND RELOAD !', 'danger');
            (window as any).currentGamemode = currentGamemode;
        }
        */
    }

    importSummoningSynergy(summoningSynergy: any) {
        /*
        // @ts-expect-error TS(2304): Cannot find name 'summoningData'.
        summoningData.MarksDiscovered[this.player.equipment.slots.Summon1.item.summoningID] = 3 * summoningSynergy;
        // @ts-expect-error TS(2304): Cannot find name 'summoningData'.
        summoningData.MarksDiscovered[this.player.equipment.slots.Summon2.item.summoningID] = 3 * summoningSynergy;
        */
    }

    importUseCombinationRunes(useCombinationRunes: any) {
        /*
        (window as any).useCombinationRunes = useCombinationRunes;
        */
    }

    importAgilityCourse(course: any, masteries: any, pillar: any) {
        /*
        // @ts-expect-error TS(2304): Cannot find name 'chosenAgilityObstacles'.
        chosenAgilityObstacles = course;
        // @ts-expect-error TS(2304): Cannot find name 'MASTERY'.
        MASTERY[this.micsr.skillIDs.Agility].xp = MASTERY[this.micsr.skillIDs.Agility].xp.map((_: any, i: any) => masteries[i] * 14e6);
        // @ts-expect-error TS(2304): Cannot find name 'agilityPassivePillarActive'.
        agilityPassivePillarActive = pillar;
        */
    }

    importAstrology(astrologyModifiers: any) {
        /*
        // @ts-expect-error TS(2304): Cannot find name 'activeAstrologyModifiers'.
        activeAstrologyModifiers = astrologyModifiers.map((x: any) => {
            return Object.getOwnPropertyNames(x).map(m => {
                return { [m]: x[m] }
            });
        });
        */
    }

    checkRadio(baseID: any, check: any) {
        // do nothing
    }
}

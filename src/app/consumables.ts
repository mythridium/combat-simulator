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

import type { SimPlayer } from './sim-player';
import { App } from './app';
import { Card } from './card';
import { MICSR } from './micsr';
import { ISimData, Simulator } from './simulator';
import { TabCard } from './tab-card';

/**
 * Class to handle consumables
 */
export class Consumables {
    app: App;
    applyRates: any;
    card: TabCard;
    consumables: {
        [index: string]: {
            check: any;
            name: string;
            override: string;
            seconds?: number;
            children: any[];
        };
    };
    player: SimPlayer;
    runesInUse: any;
    showAll: any;
    simulator: Simulator;
    micsr: MICSR;

    constructor(app: App) {
        this.app = app;
        this.micsr = app.micsr;
        this.card = this.app.consumablesCard;
        this.player = this.app.player;
        this.simulator = this.app.simulator;
        this.consumables = {};
        // add export and import
        this.card.addButton('Export Rates', () => this.exportConsumableData());
        this.card.addTextInput('Import Rates:', '', (event: any) => this.importConsumableData(event));
        // toggles
        this.applyRates = false;
        this.card.addToggleRadio('Apply Rates', `ApplyRates`, this, 'applyRates', this.applyRates, 25, () =>
            this.updateData()
        );
        this.showAll = false;
        this.card.addToggleRadio('Show All Consumables', `ShowAllConsumables`, this, 'showAll', this.showAll, 25, () =>
            this.updateView()
        );
        // add consumables
        this.initConsumables();
    }

    initConsumables() {
        // global costs
        this.card.addSectionTitle('Seconds per Consumable');
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'ppg', 'Prayer Points Gained', () => false);
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'pp', 'Prayer Points', () => false);
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'potion', 'Potion', () => false);
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'food', 'Food', () => false);
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'rune', 'Runes', () => false);
        this.addConsumableInput(this.card, 'combination', 'Combination Runes', () => false, 'rune');
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'ammo', 'Ammo', () => false);
        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        this.addConsumableInput(this.card, 'summon', 'Familiar Tablets', () => false);
        // tab
        this.card.addTabMenu();
        // potions
        const potionCard = new Card(this.micsr, this.card.container, '', '100px');
        // food
        const foodCard = new Card(this.micsr, this.card.container, '', '100px');
        // add the tab cards
        [
            { name: 'Potions', media: this.app.media.herblore, card: potionCard },
            { name: 'Food', media: this.app.media.cooking, card: foodCard }
        ].forEach(cardInfo => this.card.addPremadeTab(cardInfo.name, cardInfo.media, cardInfo.card));
    }

    addItemInput(card: any, itemID: string, check: any, override: string) {
        // @ts-expect-error TS(2304): Cannot find name 'items'.
        const item = items[itemID];
        this.addConsumableInput(card, itemID, item.name, check, override);
    }

    addConsumableInput(card: any, id: string, name: any, check: any, override: string) {
        this.consumables[id] = {
            check: check,
            name: name,
            override: override,
            seconds: undefined,
            children: []
        };
        card.addNumberInput(name, '', 0, Number.MAX_SAFE_INTEGER, (event: any) =>
            this.setConsumableSecondsFromEvent(event, id)
        );
        if (override !== undefined) {
            this.consumables[override].children.push(id);
        }
    }

    genericCheck(id: string) {
        const consumable = this.consumables[id];
        for (const childID of consumable.children) {
            if (this.genericCheck(childID)) {
                return true;
            }
        }
        return consumable.check();
    }

    updateView() {
        this.setRunesInUse();
        for (const id in this.consumables) {
            const consumable = this.consumables[id];
            const element = document.getElementById(`MCS ${consumable.name} Input`).parentElement;
            element.style.display = this.showAll || this.genericCheck(id) ? '' : 'none';
        }
    }

    setConsumableSecondsFromEvent(event: any, id: string) {
        let seconds = parseFloat(event.currentTarget.value);
        if (isNaN(seconds)) {
            seconds = undefined;
        }
        this.setConsumableSeconds(id, seconds);
        this.saveRates();
    }

    setConsumableSeconds(id: string, seconds: any) {
        if (this.consumables[id] === undefined) {
            // this.micsr.warn(`Unknown consumable id ${id} in Consumables.setConsumableSeconds`);
            return;
        }
        if (this.consumables[id].seconds === seconds) {
            // exit so we don't force an unnecessary update
            return;
        }
        this.consumables[id].seconds = seconds;
        // update
        if (this.applyRates) {
            this.updateData();
        }
    }

    updateData() {
        this.simulator.performPostSimAnalysis();
        this.app.updatePlotData();
        this.app.updateZoneInfoCard();
    }

    getExportData() {
        const settings = {};
        for (const id in this.consumables) {
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            settings[id] = this.consumables[id].seconds;
        }
        return JSON.stringify(settings, null, 1);
    }

    exportConsumableData() {
        this.app.popExport(this.getExportData());
    }

    importConsumableData(event: any) {
        this.importFromJSON(event.currentTarget.value);
        this.saveRates();
    }

    saveRates() {
        localStorage.setItem('MICSR-Consumables', this.getExportData());
    }

    loadRates() {
        const json = localStorage.getItem('MICSR-Consumables');
        if (json === null) {
            return;
        }
        this.importFromJSON(json);
    }

    importFromJSON(json: any) {
        let settings;
        try {
            settings = JSON.parse(json);
        } catch {
            this.app.notify('Ignored invalid JSON consumable settings!', 'danger');
            settings = {};
        }
        // wipes everything by setting unimported values to undefined
        for (const id in this.consumables) {
            this.consumables[id].seconds = settings[id];
            (document.getElementById(`MCS ${this.consumables[id].name} Input`) as any).value = settings[id] ?? '';
        }
    }

    getConsumableCostInSeconds(id: string): number {
        if (!id) {
            return 0;
        }
        const consumable = this.consumables[id];
        if (consumable === undefined) {
            // this.micsr.warn(`Unknown consumable id ${id} in Consumables.getConsumableCostInSeconds`);
            return 0;
        }
        if (consumable.seconds !== undefined) {
            return consumable.seconds as number;
        }
        if (consumable.override !== undefined) {
            return this.getConsumableCostInSeconds(consumable.override);
        }
        return 0;
    }

    setRunesInUse() {
        this.runesInUse = {};
        for (const spellType in this.app.combatData.spells) {
            const spell = this.player.getSpellFromType(spellType as CombatSpellBook);
            if (spell === undefined) {
                continue;
            }
            const costs = this.player.getRuneCosts(spell).map((x: any) => x.itemID);
            for (const runeID of costs) {
                this.runesInUse[runeID] = true;
            }
        }
    }

    update() {
        for (const simID in this.simulator.monsterSimData) {
            const simResult = this.simulator.monsterSimData[simID];
            this.updateSingleResult(simResult);
        }
        for (const dungeonID in this.simulator.dungeonSimData) {
            const simResult = this.simulator.dungeonSimData[dungeonID];
            this.updateSingleResult(simResult);
        }
        for (const taskID in this.simulator.slayerSimData) {
            const simResult = this.simulator.slayerSimData[taskID];
            this.updateSingleResult(simResult);
            // correct average kill time for auto slayer
            simResult.adjustedRates.killTimeS /= this.simulator.slayerTaskMonsters[taskID].length;
        }
    }

    updateSingleResult(data: ISimData) {
        if (!data.simSuccess) {
            return;
        }
        const factor = this.computeFactor(data);
        [
            // xp rates
            'xpPerSecond',
            'hpXpPerSecond',
            'slayerXpPerSecond',
            'prayerXpPerSecond',
            'summoningXpPerSecond',
            // loot gains
            'gpPerSecond',
            'dropChance',
            'slayerCoinsPerSecond'
        ].forEach(tag => (data.adjustedRates[tag] = (data[tag] as number) / factor));
        // gp per second
        const gpFactor = (data.killTimeS + data.alchTimeS) / (data.killTimeS * factor + data.alchTimeS);
        data.adjustedRates.gpPerSecond = data.gpPerSecond * gpFactor;
        // kills per second
        data.adjustedRates.killTimeS = data.killTimeS * factor;
        data.adjustedRates.killsPerSecond = 1 / data.adjustedRates.killTimeS;
    }

    computeFactor(data: any) {
        // compute factor
        let factor = 1;
        // pp
        if (data.ppGainedPerSecond && data.ppGainedPerSecond > 0) {
            factor += data.ppGainedPerSecond * this.getConsumableCostInSeconds('ppg');
        }
        if (data.ppConsumedPerSecond && data.ppConsumedPerSecond > 0) {
            factor += data.ppConsumedPerSecond * this.getConsumableCostInSeconds('pp');
        }
        // potion
        if (data.potionsUsedPerSecond && data.potionsUsedPerSecond > 0) {
            factor += data.potionsUsedPerSecond * this.getConsumableCostInSeconds(this.player.potion!.id);
        }
        // food
        if (data.atePerSecond && data.atePerSecond > 0) {
            const foodID = this.player.food.currentSlot.item.id;
            factor += data.atePerSecond * this.getConsumableCostInSeconds(foodID);
        }
        // runes
        for (const runeID in data.usedRunesBreakdown) {
            if (data.usedRunesBreakdown[runeID] > 0) {
                factor += data.usedRunesBreakdown[runeID] * this.getConsumableCostInSeconds(runeID);
            }
        }
        // ammo
        if (data.ammoUsedPerSecond && data.ammoUsedPerSecond > 0) {
            const ammoID = this.player.equipmentID(equipmentSlotData.Quiver.id);
            factor += data.ammoUsedPerSecond * this.getConsumableCostInSeconds(ammoID);
        }
        // familiars
        if (data.tabletsUsedPerSecond && data.tabletsUsedPerSecond > 0) {
            [
                this.app.player.equipmentID(EquipmentSlots.Summon1),
                this.app.player.equipmentID(EquipmentSlots.Summon2)
            ].forEach(summonID => {
                if (this.consumables[summonID]) {
                    factor += data.tabletsUsedPerSecond * this.getConsumableCostInSeconds(summonID);
                }
            });
        }
        return factor;
    }
}

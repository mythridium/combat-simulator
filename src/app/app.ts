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
import type { SimManager } from './sim-manager';
import type { SimPlayer } from './sim-player';
import { AgilityCourse } from './agility-course';
import { Card } from './card';
import { CombatData } from './combat-data';
import { Consumables } from './consumables';
import { DataExport } from './data-export';
import { IImportSettings, IImportSlayer, Import } from './import';
import { Loot } from './loot';
import { MICSR } from './micsr';
import { Plotter } from './plotter';
import { ISimData, ISimSave, Simulator } from './simulator';
import { TabCard } from './tab-card';
import { Util } from './util';
import { Summary } from './summary';

interface SaveSlot {
    index: number;
    name: string;
    data: string;
}

/**
 * Container Class for the Combat Simulator.
 * A single instance of this is initiated on load.
 */
export class App {
    agilityCourse!: AgilityCourse;
    agilitySelectCard!: Card;
    astrologySelectCard!: TabCard;
    astrologySelected: any;
    barMonsterIDs!: string[];
    barSelected: any;
    barType: any;
    barTypes: any;
    botContent: any;
    combatData: CombatData;
    combatPotionRecipes!: HerbloreRecipe[];
    combatStatCard!: Card;
    combatStatKeys: any;
    compareCard!: Card;
    consumables: any;
    consumablesCard!: TabCard;
    dataExport: any;
    defaultSpell: any;
    dropListFilters: any;
    dungeonBarIDs: any;
    dungeonToggleState: any;
    equipmentSelectCard!: Card;
    equipmentSubsets: any;
    failureLabel: any;
    foodCCContainer: any;
    force: any;
    import!: Import;
    importedSettings?: IImportSettings;
    infoPlaceholder: any;
    initialTimeUnitIndex: any;
    isViewingDungeon: any;
    levelSelectCard!: Card;
    loot!: Loot;
    lootSelectCard!: Card;
    mainTabCard!: TabCard;
    media: any;
    monsterToggleState: any;
    petSelectCard!: Card;
    cartographySelectCard!: TabCard;
    plotTypes: any;
    plotter!: Plotter;
    potionTier: number;
    potionSelectCard!: Card;
    prayerSelectCard!: TabCard;
    ancientRelicSelectCard!: Card;
    slayerSelectCard!: Card;
    savedSimulations: { save: ISimSave; name: string }[];
    simulationCount = 0;
    selectedBar: any;
    selectedTime: any;
    selectedTimeShorthand: any;
    simOptionsCard!: Card;
    simulator!: Simulator;
    skillKeys: string[];
    skipConstellations: string[];
    slayerToggleState: any;
    spellSelectCard!: TabCard;
    subInfoCard!: Card;
    timeMultiplier: any;
    timeMultipliers: any;
    timeOptions: any;
    timeShorthand: any;
    tippyInstances: any;
    tippyNoSingletonInstances: any;
    tippyOptions: any;
    tippySingleton: any;
    topContent: any;
    modalContent: any;
    plotHeaderContent: any;
    trackHistory: any;
    viewedDungeonID?: string;
    zoneInfoCard!: Card;
    disableOverwrite: boolean;

    micsr: MICSR;
    manager: SimManager;
    player: SimPlayer;
    game: SimGame;
    actualGame: Game;
    initializing: boolean;

    private readonly saveSlotsCount = 5;
    private readonly saveSlotsKey = 'save-slots';
    private saveSlots: SaveSlot[] = [];

    /**
     * Constructs an instance of mcsApp
     */
    constructor(actualGame: Game, game: SimGame) {
        this.actualGame = actualGame;
        this.game = game;
        this.micsr = game.micsr;
        this.manager = game.combat;
        this.player = this.manager.player;
        this.savedSimulations = [];
        this.initializing = true;
        // Combat Data Object
        this.combatData = new CombatData(this.manager);
        // prepare tooltips
        this.tippyOptions = {
            allowHTML: true,
            animation: false,
            hideOnClick: true,
            delay: 1,
            duration: 1,
            onCreate(instance: TippyTooltip) {
                instance.popper.addEventListener(
                    'touchstart',
                    (event: Event) => {
                        event.preventDefault();
                    },
                    { passive: true }
                );
            },
            onTrigger(instance: TippyTooltip, event: MouseEvent) {
                const element = <HTMLElement>event.target;

                if (element.id.includes('Image') && !element.classList.contains('micsr')) {
                    instance.popper.classList.add('micsr');
                }
            }
        };
        this.tippyNoSingletonInstances = [];
        // Plot Type Options
        this.plotTypes = [];
        const addPlotOption = (option: any, isTime: any, value: any, info: any, scale = true) => {
            this.plotTypes.push({
                option: option,
                isTime: isTime,
                value: value,
                info: info,
                scale: scale && isTime
            });
        };
        this.disableOverwrite = false;
        this.potionTier = 0;
        this.astrologySelected = undefined;
        this.skipConstellations = [
            'melvorF:Deedree',
            'melvorF:Ameria',
            'melvorF:Ko',
            'melvorTotH:Variel',
            'melvorTotH:Haemir',
            'melvorAoD:Nysa'
        ];
        // xp gains
        addPlotOption('XP per ', true, 'xpPerSecond', 'XP/');
        addPlotOption('HP XP per ', true, 'hpXpPerSecond', 'HP XP/');
        addPlotOption('Prayer XP per ', true, 'prayerXpPerSecond', 'Prayer XP/');
        addPlotOption('Slayer XP per ', true, 'slayerXpPerSecond', 'Slayer XP/');
        addPlotOption('Summoning XP per ', true, 'summoningXpPerSecond', 'Summoning XP/');
        addPlotOption('Prayer P. Gained per ', true, 'ppGainedPerSecond', 'Prayer P. Gained/');
        // resource loss
        addPlotOption('Prayer P. Used per ', true, 'ppConsumedPerSecond', 'Prayer P. Used/');
        addPlotOption('Ammo per ', true, 'ammoUsedPerSecond', 'Ammo/');
        addPlotOption('Runes per ', true, 'runesUsedPerSecond', 'Runes/');
        addPlotOption('Combination Runes per ', true, 'combinationRunesUsedPerSecond', 'Comb. Runes/');
        addPlotOption('Potions per ', true, 'potionsUsedPerSecond', 'Potions/');
        addPlotOption('Consumables per ', true, 'usedConsumablesPerSecond', 'Consumables/');
        addPlotOption('Tablets per type per ', true, 'tabletsUsedPerSecond', 'Tablets per type/');
        addPlotOption('Food per', true, 'atePerSecond', 'Food/');
        // survivability
        addPlotOption('Estimated Death Rate', false, 'deathRate', 'Est. Death Rate');
        addPlotOption('Highest Hit Taken', false, 'highestDamageTaken', 'Highest Hit Taken');
        addPlotOption('Highest Reflect Taken', false, 'highestReflectDamageTaken', 'Highest Reflect Taken');
        addPlotOption('Lowest Hitpoints', false, 'lowestHitpoints', 'Lowest Hitpoints');
        // kill time
        addPlotOption('Average Kill Time (s)', false, 'killTimeS', 'Kill Time(s)');
        addPlotOption('Kills per ', true, 'killsPerSecond', 'Kills/');
        // loot gains
        addPlotOption('GP per ', true, 'gpPerSecond', 'GP/');
        addPlotOption('Raw GP per ', true, 'baseGpPerSecond', 'Raw GP/');
        addPlotOption('Drops per', true, 'dropChance', 'Drops/');
        addPlotOption('Percent Chance for Signet Part B per', true, 'signetChance', 'Signet (%)/', false);
        addPlotOption('Pet (%) per ', true, 'petChance', ' Pet (%)/');
        addPlotOption('Slayer Coins per ', true, 'slayerCoinsPerSecond', 'Slayer Coins/');
        // addPlotOption('Simulation Time', false, 'simulationTime', 'Sim Time');
        // Time unit options
        this.timeOptions = ['Kill', 'Second', 'Minute', 'Hour', 'Day'];
        this.timeShorthand = ['kill', 's', 'm', 'h', 'd'];
        this.timeMultipliers = [-1, 1, 60, 3600, 3600 * 24];
        this.initialTimeUnitIndex = 3;
        this.selectedTime = this.timeOptions[this.initialTimeUnitIndex];
        this.selectedTimeShorthand = this.timeShorthand[this.initialTimeUnitIndex];
        this.timeMultiplier = this.timeMultipliers[this.initialTimeUnitIndex];

        // Useful assets
        this.media = {
            combat: 'assets/media/skills/combat/combat.png',
            slayer: 'assets/media/skills/slayer/slayer.svg',
            prayer: 'assets/media/skills/prayer/prayer.svg',
            unholy: 'assets/media/skills/prayer/unholy_prayer.svg',
            spellbook: 'assets/media/skills/combat/spellbook.svg',
            curse: 'assets/media/skills/combat/curses.svg',
            aurora: 'assets/media/skills/combat/auroras.svg',
            ancient: 'assets/media/skills/combat/ancient.svg',
            archaic: 'assets/media/skills/magic/archaic_book.svg',
            emptyPotion: 'assets/media/skills/herblore/potion_empty.svg',
            pet: 'assets/media/pets/hitpoints.png',
            settings: 'assets/media/main/settings_header.svg',
            gp: 'assets/media/main/coins.png',
            attack: 'assets/media/skills/combat/attack.svg',
            strength: 'assets/media/skills/combat/strength.svg',
            ranged: 'assets/media/skills/ranged/ranged.svg',
            magic: 'assets/media/skills/magic/magic.svg',
            defence: 'assets/media/skills/defence/defence.svg',
            hitpoints: 'assets/media/skills/hitpoints/hitpoints.svg',
            emptyFood: 'assets/media/skills/combat/food_empty.svg',
            agility: 'assets/media/skills/agility/agility.svg',
            cartography: 'assets/media/skills/cartography/cartography.svg',
            mastery: 'assets/media/main/mastery_header.svg',
            statistics: 'assets/media/main/statistics_header.svg',
            loot: 'assets/media/bank/chapeau_noir.png',
            summoning: 'assets/media/skills/summoning/summoning.svg',
            synergy: 'assets/media/skills/summoning/synergy.svg',
            synergyLock: 'assets/media/skills/summoning/synergy_locked.svg',
            stamina: 'assets/media/main/stamina.png',
            question: 'assets/media/main/question.svg',
            ancientRelics: 'assets/media/main/gamemode_ancient_relic.png',
            airRune: this.micsr.game.items.getObjectByID('melvorD:Air_Rune')!.media,
            mistRune: this.micsr.game.items.getObjectByID('melvorD:Mist_Rune')!.media,
            bank: 'assets/media/main/bank_header.svg',
            herblore: 'assets/media/skills/herblore/herblore.svg',
            cooking: 'assets/media/skills/cooking/cooking.svg',
            fletching: 'assets/media/skills/fletching/fletching.svg',
            astrology: 'assets/media/skills/astrology/astrology.svg',
            standardStar: 'assets/media/skills/astrology/star_standard.svg',
            uniqueStar: 'assets/media/skills/astrology/star_unique.svg',
            solarEclipse: 'assets/media/skills/township/eclipse.png',
            autoEat: 'assets/media/shop/autoeat.svg',
            barrier: 'assets/media/skills/combat/barrier.svg'
        };

        // default spell is wind strike
        this.defaultSpell = this.micsr.standardSpells.getObjectByID('melvorD:WindStrike');

        // Forced equipment sorting
        this.force = {
            [this.micsr.skillIDs.Defence]: ['melvorF:Slayer_Helmet_Basic', 'melvorF:Slayer_Platebody_Basic'],
            [this.micsr.skillIDs.Ranged]: ['melvorF:Slayer_Cowl_Basic', 'melvorF:Slayer_Leather_Body_Basic'],
            [this.micsr.skillIDs.Magic]: [
                'melvorF:Slayer_Wizard_Hat_Basic',
                'melvorF:Slayer_Wizard_Robes_Basic',
                'melvorF:Enchanted_Shield',
                'melvorTotH:Freezing_Touch_Body'
            ],
            ['Other']: ['melvorF:Sand_Treaders', 'melvorAoD:Elusive_Boots']
        };

        // Generate equipment subsets
        this.equipmentSubsets = [];
        /** @type {number[]} */
        for (const slot in this.micsr.equipmentSlotData) {
            const slotId = (<any>this.micsr.equipmentSlotData)[slot].id;
            this.equipmentSubsets.push([this.micsr.emptyItem]);
            this.micsr.items
                .filter((item: any) => item.validSlots)
                .forEach((item: any) => {
                    if (
                        item.validSlots.includes(slot) ||
                        (item.validSlots.includes('Summon') && slotId === this.micsr.equipmentSlotData.Summon2.id)
                    ) {
                        this.equipmentSubsets[slotId].push(item);
                    }
                });
        }
        this.equipmentSubsets[this.micsr.equipmentSlotData.Passive.id].push(
            ...this.micsr.items.filter((x: any) => x.isPassiveItem)
        );
        // Add ammoType 2 and 3 to weapon subsets
        this.micsr.items.forEach((item: any) => {
            if (item.validSlots && item.validSlots.includes('Quiver') && (item.ammoType === 2 || item.ammoType === 3)) {
                this.equipmentSubsets[this.micsr.equipmentSlotData.Weapon.id].push(item);
            }
        });
        // Sort equipment subsets
        for (const slot in this.micsr.equipmentSlotData) {
            const slotId = (<any>this.micsr.equipmentSlotData)[slot].id;
            this.equipmentSubsets[slotId].sort(
                (a: any, b: any) =>
                    this.getItemLevelReq(a, this.micsr.skillIDs.Attack) -
                    this.getItemLevelReq(b, this.micsr.skillIDs.Attack)
            );
            this.equipmentSubsets[slotId].sort(
                (a: any, b: any) =>
                    this.getItemLevelReq(a, this.micsr.skillIDs.Defence) -
                    this.getItemLevelReq(b, this.micsr.skillIDs.Defence)
            );
            this.equipmentSubsets[slotId].sort(
                (a: any, b: any) =>
                    this.getItemLevelReq(a, this.micsr.skillIDs.Ranged) -
                    this.getItemLevelReq(b, this.micsr.skillIDs.Ranged)
            );
            this.equipmentSubsets[slotId].sort(
                (a: any, b: any) =>
                    this.getItemLevelReq(a, this.micsr.skillIDs.Magic) -
                    this.getItemLevelReq(b, this.micsr.skillIDs.Magic)
            );
            if (slotId === this.micsr.equipmentSlotData.Quiver.id) {
                this.equipmentSubsets[slotId].sort((a: any, b: any) => (a.ammoType || 0) - (b.ammoType || 0));
            }
        }
        this.skillKeys = ['Attack', 'Strength', 'Defence', 'Hitpoints', 'Ranged', 'Magic', 'Prayer', 'Slayer'];
    }

    async initialize(urls: any, modal: HTMLDivElement) {
        try {
            for (let i = 0; i < this.saveSlotsCount; i++) {
                const saveString: string | null = localStorage.getItem(`${this.saveSlotsKey}-${i}-${currentCharacter}`);

                if (saveString) {
                    const saveSlot: SaveSlot = JSON.parse(saveString);
                    this.saveSlots[i] = saveSlot;
                }
            }
        } catch (error) {
            console.error(`Failed to load save slots`, error);
        }

        // Simulation Object
        this.simulator = new Simulator(this, urls.simulationWorker);
        await this.simulator.createWorkers();
        // Import Object
        this.import = new Import(this);
        // Data Export Object
        this.dataExport = new DataExport(this);
        // Loot Object
        this.loot = new Loot(this, this.simulator);

        // drop list filters
        this.dropListFilters = {
            selectedMonster: false,
            onlyUndiscovered: false
        };

        const feedbackDiv = document.createElement('div');
        let message = `<div class="pl-4 mb-2 font-size-xs">`;
        if (this.micsr.wrongVersion) {
            message += `<span style="color:red">These values are for reference only! Since you are using a beta version they are not guaranteed to be accurate and you may experience different results in the actual game.&nbsp;</span>`;
        }
        message += `Please submit any issues/feedback using <a href="https://github.com/mythridium/combat-simulator/issues" target="_blank">GitHub issues</a>.</div>`;
        feedbackDiv.innerHTML = message;

        // Create the top container for the sim
        this.topContent = document.createElement('div');
        this.topContent.className = 'mcsTabContent';
        // Create the bottom container for the sim
        this.botContent = document.createElement('div');
        this.botContent.className = 'mcsTabContent';
        this.botContent.style.flexWrap = 'nowrap';
        this.botContent.style.minHeight = '452px';

        // Plotter Object
        this.plotter = new Plotter(this, urls.crossedOut);

        // Add Equipment and Food selection card
        this.createEquipmentSelectCard();
        // Add tab card
        this.mainTabCard = new TabCard(this.micsr, 'mcsMainTab', true, this.topContent, '', '150px', true);

        // Add Cards to the tab card
        this.createLevelSelectCard();
        this.createSpellSelectCards();
        this.createPrayerSelectCards();
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            if ((<any>this.actualGame.currentGamemode).allowAncientRelicDrops) {
                this.createAncientRelicSelectCards();
            }
            await this.runAsync(() => this.createCartographySelectCards());
        }

        this.createPotionSelectCard();
        this.createPetSelectCard();
        await this.runAsync(() => this.createAgilitySelectCard());
        this.createSlayerSelectCard();
        await this.runAsync(() => this.createAstrologySelectCard());
        this.createLootOptionsCard();
        this.createSimulationAndExportCard();
        this.createCompareCard();
        this.createConsumablesCard();
        // Add Combat Stat Display Card
        this.createCombatStatDisplayCard();
        // Individual simulation info card
        this.createIndividualInfoCard();

        // Bar Chart Card
        this.monsterToggleState = true;
        this.dungeonToggleState = true;
        this.slayerToggleState = true;
        // Setup plotter bar clicking
        this.selectedBar = 0;
        this.barSelected = false;
        for (let i = 0; i < this.plotter.bars.length; i++) {
            this.plotter.bars[i].parentElement.onclick = () => this.barOnClick(i);
        }
        /** @type {number[]} */
        this.barMonsterIDs = [];
        /** @type {boolean[]} */
        this.barType = [];
        this.barTypes = {
            monster: 0,
            dungeon: 1,
            task: 2
        };

        this.micsr.monsterIDs.forEach((monsterID: string) => {
            this.barMonsterIDs.push(monsterID);
            this.barType.push(this.barTypes.monster);
        });
        this.dungeonBarIDs = {};
        this.micsr.dungeonIDs.forEach((dungeonID: any) => {
            this.dungeonBarIDs[dungeonID] = this.barMonsterIDs.length;
            this.barMonsterIDs.push(dungeonID);
            this.barType.push(this.barTypes.dungeon);
        });
        this.micsr.slayerTaskData.forEach((task: any) => {
            this.dungeonBarIDs[task.display] = this.barMonsterIDs.length;
            this.barMonsterIDs.push(task.display);
            this.barType.push(this.barTypes.task);
        });
        // Dungeon View Variables
        this.isViewingDungeon = false;
        this.viewedDungeonID = undefined;

        // Now that everything is done we add the menu and modal to the document
        this.modalContent = $(modal).find('.modal-content');
        this.modalContent.append(feedbackDiv);
        this.modalContent.append(this.topContent);
        this.modalContent.append(this.plotHeaderContent);
        this.modalContent.append(this.botContent);

        // Finalize tooltips
        await this.runAsync(() => {
            this.tippyInstances = tippy('#mcsModal [data-tippy-content]', this.tippyOptions);
            this.tippySingleton = tippy.createSingleton(this.tippyInstances, {
                ...this.tippyOptions
            });
        });

        await this.runAsync(() => {
            for (const bar of this.plotter.bars) {
                this.addNoSingletonTippy(bar, { triggerTarget: bar.parentElement });
            }
        });

        // Setup the default state of the UI
        this.plotter.timeDropdown.selectOption(this.initialTimeUnitIndex);
        this.subInfoCard.container.style.display = 'none';
        this.plotter.petSkillDropdown.parentElement.style.display = 'none';
        document.getElementById(`MCS  Pet (%)/${this.timeShorthand[this.initialTimeUnitIndex]} Label`)!.textContent =
            this.loot.petSkill + ' Pet (%)/' + this.selectedTimeShorthand;
        await this.runAsync(() => this.updateUi());
        // slayer sim is off by default, so toggle auto slayer off
        this.toggleSlayerSims(!this.slayerToggleState, false);
        // load from local storage
        this.consumables.loadRates();
        this.initializing = false;
    }

    updateUi() {
        this.updateSpellOptions();
        this.updatePrayerOptions();
        this.updateCombatStats();
        this.updateHealing();
        this.updateSlayer();
        this.updatePlotData();
    }

    printRelevantModifiers(modifiers: any, options = {}) {
        let header = '';
        if ((options as any).header) {
            const headerTag = (options as any).headerTag ? (options as any).headerTag : 'h5';
            const headerClassNames = (options as any).headerClassNames
                ? `class="${(options as any).headerClassNames}"`
                : '';
            header += `<${headerTag} ${headerClassNames}>${(options as any).header}</${headerTag}>`;
        }
        let passives = '';
        this.micsr.showModifiersInstance.printRelevantModifiers(modifiers, 'combat').forEach((toPrint: any) => {
            const tag = (options as any).tag ? (options as any).tag : 'h5';
            let classNames = 'class="';
            if ((options as any).classNames) {
                classNames += (options as any).classNames;
                classNames += ' ';
            }
            classNames += toPrint[1] + '"';
            const style = (options as any).style ? `style="${(options as any).style}"` : '';
            passives += `<${tag} ${classNames} ${style}>${toPrint[0]}</${tag}>`;
        });
        return { header: header, passives: passives };
    }

    showRelevantModifiers(modifiers: any, header: any) {
        const options = {
            header: header,
            headerTag: 'h5',
            headerClassNames: 'font-w600 font-size-sm mb-1 text-combat-smoke',
            tag: 'h5',
            classNames: 'font-w400 font-size-sm mb-1',
            style: 'text-align: left;'
        };
        const printedModifiers = this.printRelevantModifiers(modifiers, options);
        SwalLocale.fire({ html: printedModifiers.header + printedModifiers.passives });
    }

    setSummoningSynergyText() {
        // set image
        const img = document.getElementById('MCS Summoning Synergy Button Image');
        if (!img) {
            return;
        }
        const synergy = this.player.equippedSummoningSynergy;
        if (synergy && this.player.isSynergyUnlocked) {
            (img as any).src = this.media.synergy;
        } else {
            (img as any).src = this.media.synergyLock;
        }
        // set text
        const text = document.getElementById('MCS Summoning Synergy Info');
        if (!text) {
            return;
        }
        if (!synergy) {
            text.innerHTML = 'Synergy locked';
            return;
        }
        if (synergy) {
            text.innerHTML = synergy.description;
            return;
        }
        text.innerHTML = 'No synergy possible.';
    }

    createEquipmentSelectCard() {
        this.equipmentSelectCard = new Card(this.micsr, this.topContent, '', '150px', true);
        const equipmentRows = [
            [EquipmentSlots.Passive, EquipmentSlots.Helmet, EquipmentSlots.Consumable],
            [EquipmentSlots.Cape, EquipmentSlots.Amulet, EquipmentSlots.Quiver],
            [EquipmentSlots.Weapon, EquipmentSlots.Platebody, EquipmentSlots.Shield],
            // @ts-ignore
            cloudManager.hasAoDEntitlement
                ? [EquipmentSlots.Gem, EquipmentSlots.Platelegs]
                : [EquipmentSlots.Platelegs],
            [EquipmentSlots.Gloves, EquipmentSlots.Boots, EquipmentSlots.Ring],
            [EquipmentSlots.Summon1, EquipmentSlots.Summon2]
        ];
        equipmentRows.forEach(row => {
            const rowSources: any = [];
            const rowIDs: any = [];
            const rowPopups: any = [];
            const tooltips: any = [];
            row.forEach(slotID => {
                rowSources.push((<any>this.micsr.equipmentSlotData)[EquipmentSlots[slotID]].emptyMedia);
                rowIDs.push(`MCS ${EquipmentSlots[slotID]} Image`);
                rowPopups.push(slotID);
                tooltips.push(EquipmentSlots[slotID]);
            });
            this.equipmentSelectCard.addMultiPopupMenu(rowSources, rowIDs, rowPopups, tooltips);
        });

        const summon1 = this.equipmentSelectCard.container.querySelector('.MCS.Summon1.Image.Container');

        if (summon1) {
            this.equipmentSelectCard.addImageToggleWithInfo(
                summon1,
                this.media.synergyLock,
                'Summoning Synergy',
                () => {
                    this.game.combat.player.isSynergyUnlocked = !this.game.combat.player.isSynergyUnlocked;
                    this.setSummoningSynergyText();
                    this.updateCombatStats();
                },
                'Synergy locked.'
            );
        }

        // Style dropdown (Specially Coded)
        const combatStyleCCContainer = this.equipmentSelectCard.createCCContainer();
        const combatStyleLabel = this.equipmentSelectCard.createLabel('Combat Style', '');
        combatStyleLabel.classList.add('mb-1');
        const meleeStyleDropdown = this.equipmentSelectCard.createDropdown(
            ['Stab', 'Slash', 'Block'],
            [0, 1, 2],
            'MCS melee Style Dropdown',
            (event: any) => this.styleDropdownOnChange(event, 'melee')
        );
        const rangedStyleDropdown = this.equipmentSelectCard.createDropdown(
            ['Accurate', 'Rapid', 'Longrange'],
            [0, 1, 2],
            'MCS ranged Style Dropdown',
            (event: any) => this.styleDropdownOnChange(event, 'ranged')
        );
        const magicStyleDropdown = this.equipmentSelectCard.createDropdown(
            ['Magic', 'Defensive'],
            [0, 1],
            'MCS magic Style Dropdown',
            (event: any) => this.styleDropdownOnChange(event, 'magic')
        );
        rangedStyleDropdown.style.display = 'none';
        magicStyleDropdown.style.display = 'none';
        combatStyleCCContainer.appendChild(combatStyleLabel);
        combatStyleCCContainer.appendChild(meleeStyleDropdown);
        combatStyleCCContainer.appendChild(rangedStyleDropdown);
        combatStyleCCContainer.appendChild(magicStyleDropdown);
        this.equipmentSelectCard.container.appendChild(combatStyleCCContainer);
        // food container
        this.createFoodContainer();
        // cooking mastery
        this.equipmentSelectCard.addToggleRadio(
            '95% Cooking Pool',
            'cookingPool',
            this.player,
            'cookingPool',
            this.player.cookingPool,
            25,
            () => this.updateHealing()
        );
        this.equipmentSelectCard.addToggleRadio(
            '99 Cooking Mastery',
            'cookingMastery',
            this.player,
            'cookingMastery',
            this.player.cookingMastery,
            25,
            () => this.updateHealing()
        );
        this.equipmentSelectCard.addToggleRadio(
            'Manual Eating',
            'isManualEating',
            this.player,
            'isManualEating',
            this.player.isManualEating
        );
        // Slayer task
        this.equipmentSelectCard.addRadio(
            'Slayer Task',
            25,
            'slayerTask',
            ['Yes', 'No'],
            [(e: any) => this.slayerTaskRadioOnChange(e, true), (e: any) => this.slayerTaskRadioOnChange(e, false)],
            1
        );

        this.equipmentSelectCard.addToggleRadio(
            'Solar Eclipse',
            'isSolarEclipse',
            this.player,
            'isSolarEclipse',
            (<any>this.player).isSolarEclipse,
            25,
            () => this.updateCombatStats()
        );

        // game mode
        const gameModeNames: any[] = [];
        const gameModeValues: number[] = [];
        this.micsr.gamemodes.forEach((gamemode: any, i: number) => {
            gameModeNames.push(gamemode.name);
            gameModeValues.push(i);
        });
        const gameModeDropdown = this.equipmentSelectCard.createDropdown(
            gameModeNames,
            gameModeValues,
            'MCS Game Mode Dropdown',
            (event: any) => {
                const gamemode = this.micsr.gamemodes[parseInt(event.currentTarget.value)];

                this.game.currentGamemode = gamemode;
                this.player.currentGamemodeID = gamemode.id;

                this.updateCombatStats();
                this.updateAstrologyTooltips();
                this.updateCartographyTooltips();
                this.agilityCourse.updateAllAgilityTooltips();
            }
        );
        const gameModeContainer = this.equipmentSelectCard.createCCContainer();
        gameModeContainer.appendChild(gameModeDropdown);
        this.equipmentSelectCard.container.appendChild(gameModeContainer);
        // import equipment and settings
        const importSetCCContainer = this.equipmentSelectCard.createCCContainer();
        importSetCCContainer.appendChild(this.equipmentSelectCard.createLabel('Import Set', ''));
        // only create buttons for purchased equipment sets
        let importButtonText = [];
        let importButtonFunc = [];
        for (let i = 0; i < this.micsr.actualGame.combat.player.equipmentSets.length; i++) {
            importButtonText.push(`${i + 1}`);
            importButtonFunc.push(() => this.import.importButtonOnClick(i));
        }
        this.equipmentSelectCard.addMultiButton(
            importButtonText,
            importButtonFunc,
            importSetCCContainer,
            'MCS_import_set'
        );
        this.equipmentSelectCard.container.appendChild(importSetCCContainer);

        // add button to show all modifiers
        const modifierCCContainer = this.equipmentSelectCard.createCCContainer();
        modifierCCContainer.appendChild(
            this.equipmentSelectCard.addButton('Show Modifiers', () =>
                this.showRelevantModifiers(this.player.modifiers, 'Active Modifiers')
            )
        );
        this.equipmentSelectCard.container.appendChild(modifierCCContainer);

        // summary button
        const summaryCCContainer = this.equipmentSelectCard.createCCContainer();
        summaryCCContainer.appendChild(
            this.equipmentSelectCard.addButton('Show Summary', () => {
                const summary = new Summary(this.micsr, this);
                summary.show();
            })
        );
        this.equipmentSelectCard.container.appendChild(summaryCCContainer);

        // import save slots
        const saveSlotCCContainer = this.equipmentSelectCard.createCCContainer();
        saveSlotCCContainer.appendChild(this.equipmentSelectCard.createLabel('Save Slot', ''));

        let saveSlotButtonText = [];
        let saveSlotButtonFunc = [];
        let saveSlotButtonTooltips = [];
        let saveSlotButtonIds = [];

        for (let i = 0; i < this.saveSlotsCount; i++) {
            const saveSlot = this.saveSlots[i];

            saveSlotButtonText.push(`${i + 1}`);
            saveSlotButtonFunc.push(() => this.showSaveSlotModal(i));
            saveSlotButtonTooltips.push(saveSlot?.name ?? 'Available');
            saveSlotButtonIds.push(`save-slot-${i}`);
        }

        this.equipmentSelectCard.addMultiButton(
            saveSlotButtonText,
            saveSlotButtonFunc,
            saveSlotCCContainer,
            'MCS-save-slot',
            saveSlotButtonIds,
            saveSlotButtonTooltips
        );

        this.equipmentSelectCard.container.appendChild(saveSlotCCContainer);
    }

    showSaveSlotModal(index: number) {
        const that = this;
        const saveSlot = this.saveSlots[index];

        if (saveSlot && this.disableOverwrite) {
            this.import.importSettings(this.import.convertStringToObject(saveSlot.data), true);
            return;
        }

        const container = document.createElement('div');
        container.id = 'mcs-save-slot-container';

        if (saveSlot) {
            const information = document.createElement('div');

            information.textContent = 'This save slot already contains data. Would you like to load this data?';

            const load = document.createElement('button');

            load.id = 'mcs-load-save-slot-button';
            load.className = 'btn btn-primary m-3';
            load.textContent = 'Load Save Slot';

            container.appendChild(information);
            container.appendChild(load);

            const overwrite = document.createElement('div');

            overwrite.textContent = 'Would you like to overwrite the save slot with the current settings instead?';

            container.appendChild(overwrite);
        } else {
            const information = document.createElement('div');

            information.textContent =
                'There is no data in this save slot. Would you like to save the current settings to this save slot?';

            container.appendChild(information);
        }

        SwalLocale.fire({
            titleText: saveSlot?.name ?? `Save Slot ${index + 1}`,
            customClass: {
                container: 'mcs-save-slot-swal-container',
                confirmButton: 'btn btn-primary m-1',
                cancelButton: 'btn btn-danger m-1'
            },
            html: container,
            showCancelButton: true,
            confirmButtonText: saveSlot ? 'Overwrite' : 'Save',
            returnFocus: false,
            input: 'text',
            inputValue: saveSlot?.name ?? `Save Slot ${index + 1}`,
            inputLabel: 'Save Slot Name',
            inputPlaceholder: `Enter a name to remember this save slot`,
            inputAttributes: {
                maxlength: '50'
            },
            inputValidator(inputValue: string) {
                if (!inputValue) {
                    return 'Save slot name cannot be empty.';
                }

                if (inputValue.length > 50) {
                    return 'Save slot name cannot be longer then 50 characters.';
                }
            },
            willOpen(popup) {
                const load = popup.querySelector<HTMLButtonElement>('#mcs-load-save-slot-button');

                if (load) {
                    load.onclick = () => {
                        that.import.importSettings(that.import.convertStringToObject(saveSlot.data), true);
                        SwalLocale.close();
                    };
                }
            },
            preConfirm(inputValue: string) {
                const saveSlot: SaveSlot = {
                    index,
                    name: inputValue,
                    data: that.import.convertObjectToJson(that.import.exportSettings())
                };

                try {
                    localStorage.setItem(`${that.saveSlotsKey}-${index}-${currentCharacter}`, JSON.stringify(saveSlot));
                } catch (error) {
                    console.error(`Failed to save slot to localstorage.`, error);
                }

                that.saveSlots[index] = saveSlot;

                const button = document.querySelector<HTMLElement>(`[id='MCS ${index + 1} Button save-slot-${index}']`);

                if (button) {
                    that.setTooltip(button, inputValue);
                }
            }
        });
    }

    createFoodPopup() {
        const foodSelectPopup = document.createElement('div');
        foodSelectPopup.className = 'mcsPopup';

        const equipmentSelectCard = new Card(this.micsr, foodSelectPopup, '', '600px');

        equipmentSelectCard.addSearch(`Food-search`, '.btn');

        const categories: { empty: FoodItem[]; food: FoodItem[]; perfect: FoodItem[] } = {
            empty: [],
            food: [],
            perfect: []
        };

        for (const item of this.micsr.items.food.allObjects.filter(item => this.filterIfHasKey('healsFor', item))) {
            if (item.golbinRaidExclusive) {
                continue;
            }

            if (item.id === 'melvorD:Empty_Food') {
                categories.empty.push(item);
                continue;
            }

            // the food is perfect if it's found in the product recipe map, but not found as an action.
            const isPerfect =
                this.micsr.game.cooking.productRecipeMap.get(item) !== undefined &&
                this.micsr.game.cooking.actions.getObjectByID(item.id) === undefined;

            if (isPerfect) {
                categories.perfect.push(item);
            } else {
                categories.food.push(item);
            }
        }

        categories.food.sort((a, b) => a.healsFor - b.healsFor);
        categories.perfect.sort((a, b) => a.healsFor - b.healsFor);

        const getDataFor = (items: FoodItem[]) => {
            const media = items.map(item => item.media);
            const ids = items.map(item => item.name);
            const callbacks = items.map(item => () => this.equipFood(item.id));
            const tooltips = items.map(item => this.getFoodTooltip(item));

            return { media, ids, callbacks, tooltips };
        };

        const food = getDataFor(categories.food);
        const perfect = getDataFor(categories.perfect);
        const empty = getDataFor(categories.empty);

        equipmentSelectCard.addSectionTitle('Food');
        equipmentSelectCard.addImageButtons(food.media, food.ids, 'Small', food.callbacks, food.tooltips, '100%');

        equipmentSelectCard.addSectionTitle('Perfect Food');
        equipmentSelectCard.addImageButtons(
            perfect.media,
            perfect.ids,
            'Small',
            perfect.callbacks,
            perfect.tooltips,
            '100%'
        );

        equipmentSelectCard.addSectionTitle('Empty');
        equipmentSelectCard.addImageButtons(empty.media, empty.ids, 'Small', empty.callbacks, empty.tooltips, '100%');

        return foodSelectPopup;
    }

    createFoodContainer() {
        this.foodCCContainer = this.equipmentSelectCard.createCCContainer();
        // Food card
        const containerDiv = document.createElement('div');
        containerDiv.style.position = 'relative';
        containerDiv.style.cursor = 'pointer';
        const newImage = document.createElement('img');
        newImage.id = 'MCS Food Image';
        newImage.style.border = '1px solid red';
        newImage.src = this.media.emptyFood;
        newImage.className = 'combat-food';
        newImage.dataset.tippyContent = 'No Food';
        newImage.dataset.tippyHideonclick = 'true';
        containerDiv.appendChild(newImage);
        this.foodCCContainer.appendChild(containerDiv);
        this.equipmentSelectCard.registerPopupMenu(containerDiv, 'Food');
        // Heal amt
        let label = document.createElement('span');
        label.id = 'MICSR-heal-amount-Label';
        label.className = 'text-bank-desc';
        label.textContent = '+0';
        const image = document.createElement('img');
        image.className = 'skill-icon-xs mr-1';
        image.src = this.media.hitpoints;
        image.style.marginLeft = '5px';
        const wrapper = document.createElement('h5');
        wrapper.className = 'font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2 heal-amount-wrapper';
        wrapper.appendChild(image);
        wrapper.appendChild(label);
        this.foodCCContainer.appendChild(wrapper);
        // Auto eat dropdown
        let autoEatTierNames = [
            'No Auto Eat',
            ...this.game.autoEatTiers.map(t =>
                this.actualGame.shop.purchases.getObjectByID(t)!.name.replace(' - Tier', '')
            )
        ];
        let autoEatTierValues = [-1, 0, 1, 2];
        const autoEatTierDropdown = this.equipmentSelectCard.createDropdown(
            autoEatTierNames,
            autoEatTierValues,
            'MCS Auto Eat Tier Dropdown',
            event => {
                this.game.setAutoEatTier(parseInt((event.currentTarget! as HTMLSelectElement).value));
                this.updateCombatStats();
            }
        );
        this.foodCCContainer.appendChild(autoEatTierDropdown);
        // Append to equipmentSelectCard
        this.equipmentSelectCard.container.appendChild(this.foodCCContainer);
    }

    equipFood(itemID: string) {
        const item = this.game.items.food.getObjectByID(itemID)!;
        this.player.equipFood(item, Number.MAX_SAFE_INTEGER);
        const img = document.getElementById('MCS Food Image');
        if (item.id === 'melvorD:Empty_Equipment') {
            (img as any).src = 'assets/media/skills/combat/food_empty.svg';
            img.style.border = '1px solid red';
        } else {
            (img as any).src = item.media;
            img.style.border = '';
        }
        this.setTooltip(img, this.getFoodTooltip(item));
        this.updateHealing();
    }

    getFoodTooltip(item: any) {
        if (!item || item.id === -1) {
            return 'No Food';
        }
        let tooltip = `<div class="text-center">${item.name}<br><small>`;
        if (item.description) {
            tooltip += `<span class='text-info'>${item.description.replace(/<br>\(/, ' (')}</span><br>`;
        }
        if (item.healsFor) {
            const amt = Math.round(item.healsFor * numberMultiplier);
            tooltip += `<h5 class="font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2">Base healing: <img class="skill-icon-xs mr-1" src="${this.media.hitpoints}"><span class="text-bank-desc">+${amt} HP</span></h5>`;
        }
        tooltip += '</small></div>';
        return tooltip;
    }

    updateHealing() {
        const amt = this.player.getFoodHealing(this.player.food.currentSlot.item);
        document.getElementById('MICSR-heal-amount-Label')!.textContent = `+${amt}`;
    }

    createCombatStatDisplayCard() {
        this.combatStatCard = new Card(
            this.micsr,
            this.topContent,
            '',
            '60px',
            true,
            undefined,
            'mcs-out-of-combat-stats-container'
        );
        this.combatStatCard.addSectionTitle('Out-of-Combat Stats');
        const combatStatNames = [
            'Attack Interval',
            'Summoning Interval',
            'Respawn Interval',
            'Min Hit',
            'Max Hit',
            'Summoning Max Hit',
            'Barrier Max Hit',
            'Accuracy Rating',
            'Evasion Rating',
            'Evasion Rating',
            'Evasion Rating',
            'Max Hitpoints',
            'Damage Reduction',
            'Auto Eat Threshold',
            'Drop Doubling (%)',
            'GP Multiplier'
        ];
        const combatStatIcons = [
            '',
            '',
            '',
            '',
            '',
            this.media.summoning,
            this.media.barrier,
            '',
            this.media.attack,
            this.media.ranged,
            this.media.magic,
            this.media.hitpoints,
            '',
            '',
            '',
            ''
        ];
        this.combatStatKeys = [
            'attackInterval',
            'summoningInterval',
            'respawnInterval',
            'minHit',
            'maxHit',
            'summoningMaxHit',
            'summoningBarrierMaxHit',
            'maxAttackRoll',
            'maxDefRoll',
            'maxRngDefRoll',
            'maxMagDefRoll',
            'maxHitpoints',
            'damageReduction',
            'autoEatThreshold',
            'lootBonusPercent',
            'gpBonus'
        ];
        for (let i = 0; i < combatStatNames.length; i++) {
            this.combatStatCard.addNumberOutput(
                combatStatNames[i],
                0,
                16,
                combatStatIcons[i] !== '' ? combatStatIcons[i] : '',
                `MCS ${this.combatStatKeys[i]} CS Output`
            );
        }

        const dr = this.combatStatCard.numOutputs.find(
            (output: Element) => output.id === `MCS damageReduction CS Output`
        );
        const prefix = `Uncapped Damage Reduction:`;
        // @ts-ignore
        tippy(dr, {
            content: `${prefix} 0`,
            onShow: instance => {
                const damageReduction =
                    this.game.combat.player.equipmentStats.damageReduction +
                    this.game.combat.player.modifiers.increasedDamageReduction -
                    this.game.combat.player.modifiers.decreasedDamageReduction;

                instance.setContent(`${prefix} ${damageReduction}`);
            }
        });

        this.combatStatCard.addSectionTitle('Plot Options');
        this.plotter.addToggles(this.combatStatCard);
        this.combatStatCard.addSectionTitle('');
        this.combatStatCard.addButton('Simulate All', () => this.simulateButtonOnClick(false));
        this.combatStatCard.addButton('Simulate Selected', () => this.simulateButtonOnClick(true));
    }

    createIndividualInfoCard() {
        this.zoneInfoCard = new Card(this.micsr, this.topContent, '', '100px', true);
        this.zoneInfoCard.addSectionTitle('Monster/Dungeon Info.', 'MCS Zone Info Title');
        this.infoPlaceholder = this.zoneInfoCard.addInfoText(
            'Click on a bar for detailed information on a Monster/Dungeon!'
        );
        this.subInfoCard = new Card(
            this.micsr,
            this.zoneInfoCard.container,
            '',
            '80px',
            undefined,
            undefined,
            'mcs-simulation-results-container'
        );
        const monsterImage = this.subInfoCard.addImage(this.media.combat, 48, 'MCS Info Image');
        const combatStyle = document.createElement('img');
        combatStyle.style.display = 'none';
        combatStyle.id = 'mcs-combat-style-info';
        monsterImage.parentElement.id = 'mcs-monster-info-image';
        monsterImage.parentElement.prepend(combatStyle);
        this.failureLabel = this.subInfoCard.addInfoText('');
        this.failureLabel.style.color = 'red';
        this.failureLabel.style.margin = '10px auto';
        const zoneInfoLabelNames = [];
        for (let i = 0; i < this.plotTypes.length; i++) {
            if (this.plotTypes[i].isTime) {
                zoneInfoLabelNames.push(this.plotTypes[i].info + this.selectedTimeShorthand);
            } else {
                zoneInfoLabelNames.push(this.plotTypes[i].info);
            }
        }
        for (let i = 0; i < this.plotTypes.length; i++) {
            this.subInfoCard.addNumberOutput(
                zoneInfoLabelNames[i],
                'N/A',
                20,
                '',
                `MCS ${this.plotTypes[i].value} Output`,
                true
            );
        }
        // attach tooltip to runesUsedPerSecond element
        let idx = 0;
        for (; idx < this.subInfoCard.container.children.length; idx++) {
            const child = this.subInfoCard.container.children[idx].lastChild;
            if (
                child &&
                [
                    'MCS prayerXpPerSecond Output',
                    'MCS runesUsedPerSecond Output',
                    'MCS deathRate Output',
                    'MCS dropChance Output'
                ].includes(child.id)
            ) {
                // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
                this.addNoSingletonTippy(child);
            }
        }
    }

    addNoSingletonTippy(target: any, options: any) {
        this.tippyNoSingletonInstances = this.tippyNoSingletonInstances.concat(
            tippy(target, {
                ...this.tippyOptions,
                ...options
            })
        );
    }

    createLevelSelectCard() {
        this.levelSelectCard = this.mainTabCard.addTab('Levels', this.media.combat, '', '150px');
        this.levelSelectCard.addSectionTitle('Player Levels');
        this.skillKeys.forEach(skillName => {
            let minLevel = 1;
            if (skillName === 'Hitpoints') {
                minLevel = 10;
            }
            this.levelSelectCard.addNumberInput(skillName, minLevel, minLevel, Number.MAX_SAFE_INTEGER, (event: any) =>
                this.levelInputOnChange(event, skillName)
            );
        });
    }

    createSpellSelectCards() {
        this.spellSelectCard = this.mainTabCard.addPremadeTab(
            'Spells',
            this.media.spellbook,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        // add title for spellbook tab
        this.spellSelectCard.addSectionTitle('Spells');
        // add tab menu, it was not yet created in the constructor
        this.spellSelectCard.addTabMenu();

        // add spell books
        this.spellSelectCard.addPremadeTab(
            'Standard',
            this.media.spellbook,
            this.createSpellSelectCard(
                'Standard Magic',
                'standard',
                this.combatData.spells.standard.allObjects,
                combatMenus.spells.standard
            )
        );
        this.spellSelectCard.addPremadeTab(
            'Curses',
            this.media.curse,
            this.createSpellSelectCard(
                'Curses',
                'curse',
                this.combatData.spells.curse.allObjects,
                combatMenus.spells.curse
            )
        );
        this.spellSelectCard.addPremadeTab(
            'Auroras',
            this.media.aurora,
            this.createSpellSelectCard(
                'Auroras',
                'aurora',
                this.combatData.spells.aurora.allObjects,
                combatMenus.spells.aurora
            )
        );
        this.spellSelectCard.addPremadeTab(
            'Ancient Magicks',
            this.media.ancient,
            this.createSpellSelectCard(
                'Ancient Magicks',
                'ancient',
                this.combatData.spells.ancient.allObjects,
                combatMenus.spells.ancient
            )
        );
        this.spellSelectCard.addPremadeTab(
            'Archaic Magic',
            this.media.archaic,
            this.createSpellSelectCard(
                'Archaic Magic',
                'archaic',
                this.combatData.spells.archaic.allObjects,
                combatMenus.spells.archaic
            )
        );

        // add combination rune toggle
        this.spellSelectCard.addToggleRadio(
            'Use Combination Runes',
            'combinationRunes',
            this.player,
            'useCombinationRunes'
        );
    }

    /**
     * Creates a card for selecting spells
     * @param {string} title The title of the card
     * @param {string} spellType The type of spells to generate the select menu for
     * @return {Card} The created spell select card
     */
    createSpellSelectCard(
        title: string,
        spellType: CombatSpellBook,
        spells: CombatSpell[],
        spellMenu: SpellMenu<CombatSpell>
    ) {
        const newCard = new Card(this.micsr, this.spellSelectCard.container, '', '100px');
        newCard.addSectionTitle(title);
        const spellImages = spells.map(spell => spell.media);
        const spellNames = spells.map(spell => spell.localID);
        const spellCallbacks = spells.map(spell => (event: any) => this.spellButtonOnClick(event, spell, spellType));
        const tooltips = spells.map(spell => {
            return spellMenu.getTooltipHTML(spell);
        });
        newCard.addImageButtons(spellImages, spellNames, 'Medium', spellCallbacks, tooltips);
        return newCard;
    }

    createPrayerSelectCards() {
        this.prayerSelectCard = this.mainTabCard.addPremadeTab(
            'Prayers',
            this.media.prayer,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        this.prayerSelectCard.addSectionTitle('Prayers');
        // add tab menu, it was not yet created in the constructor
        this.prayerSelectCard.addTabMenu();

        const prayers = this.micsr.prayers.allObjects.sort((a, b) => a.level - b.level);

        this.prayerSelectCard.addPremadeTab(
            'Standard Prayers',
            this.media.prayer,
            this.createPrayerSelectCard(
                'Standard Prayers',
                prayers.filter(prayer => !(<any>prayer).isUnholy),
                combatMenus.prayer
            )
        );
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            this.prayerSelectCard.addPremadeTab(
                'Unholy Prayers',
                this.media.unholy,
                this.createPrayerSelectCard(
                    'Unholy Prayers',
                    prayers.filter(prayer => (<any>prayer).isUnholy),
                    combatMenus.prayer
                )
            );
        }
    }

    createAncientRelicSelectCards() {
        this.ancientRelicSelectCard = this.mainTabCard.addPremadeTab(
            'Ancient Relics',
            this.media.ancientRelics,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        this.ancientRelicSelectCard.addSectionTitle('Ancient Relics');

        const newCard = new Card(this.micsr, this.ancientRelicSelectCard.container, '', '100px');

        this.game.skills
            .filter(skill => this.micsr.ancientRelicSkillKeys.includes(skill.localID))
            .forEach((skill: any) => {
                const relics = [...skill.ancientRelics, { relic: skill.completedAncientRelic }];

                const relicNames = relics.map(relic => relic.relic.localID);
                const relicImages = relics.map(relic => {
                    if (relic.relic.id === skill.completedAncientRelic.id) {
                        return this.media.ancientRelics;
                    }

                    return skill.media;
                });
                const relicCallbacks = relics.map(
                    relic => (event: any) => this.relicButtonOnClick(event, relic.relic, skill)
                );
                const tooltips = relics.map(relic => {
                    let tooltip = `<div class="text-center mb-1">${relic.relic.name}</div>`;

                    tooltip += '<div class="font-size-xs">';
                    tooltip += describeModifierData(relic.relic.modifiers);
                    tooltip += '</div>';

                    return tooltip;
                });

                newCard.addImageButtons(relicImages, relicNames, 'Medium', relicCallbacks, tooltips, '300px');
            });

        this.ancientRelicSelectCard.addButton('Clear All Relics', () => {
            this.import.importAncientRelics([]);
            this.updateCombatStats();
        });
    }

    /**
     * Creates a card for selecting spells
     * @param {string} title The title of the card
     * @param {string} spellType The type of spells to generate the select menu for
     * @return {Card} The created spell select card
     */
    createPrayerSelectCard(title: string, prayers: ActivePrayer[], prayerMenu: PrayerMenu) {
        const newCard = new Card(this.micsr, this.prayerSelectCard.container, '', '100px');

        newCard.addSectionTitle(title);
        const prayerImages = prayers.map(prayer => prayer.media);
        const prayerNames = prayers.map(prayer => this.getPrayerName(prayer));
        const prayerCallbacks = prayers.map(prayer => (event: any) => this.prayerButtonOnClick(event, prayer));
        const tooltips = prayers.map(prayer => prayerMenu['getUnlockedTooltipHTML'](prayer));
        newCard.addImageButtons(prayerImages, prayerNames, 'Medium', prayerCallbacks, tooltips);

        return newCard;
    }

    createPotionSelectCard() {
        this.potionSelectCard = this.mainTabCard.addTab('Potions', this.media.emptyPotion, '', '100px');
        this.potionSelectCard.addSectionTitle('Potions');
        this.potionSelectCard.addDropdown(
            'Potion Tier',
            ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
            [0, 1, 2, 3],
            (e: any) => this.potionTierDropDownOnChange(e)
        );
        const potionSources: string[] = [];
        const potionNames: string[] = [];
        const potionCallbacks: { (e: any): void }[] = [];
        const tooltips: string[] = [];
        /** @type {number[]} */
        this.combatPotionRecipes = [];
        this.micsr.herblorePotionRecipes.forEach(herblorePotionRecipe => {
            if (herblorePotionRecipe.category.localID === 'CombatPotions') {
                const basePotion = herblorePotionRecipe.potions[0];
                potionSources.push(basePotion.media);
                potionNames.push(this.getPotionHtmlId(herblorePotionRecipe));
                potionCallbacks.push((e: any) => this.potionImageButtonOnClick(e, herblorePotionRecipe));
                tooltips.push(this.getPotionTooltip(herblorePotionRecipe.potions[this.potionTier]));
                this.combatPotionRecipes.push(herblorePotionRecipe);
            }
        });
        this.potionSelectCard.addImageButtons(potionSources, potionNames, 'Medium', potionCallbacks, tooltips);

        const otherPotionSources: string[] = [];
        const otherPotionNames: string[] = [];
        const otherPotionCallbacks: { (e: any): void }[] = [];
        const otherPotionTooltips: string[] = [];

        this.potionSelectCard.addSectionTitle('Other Potions');
        const otherPotions = this.micsr.items.filter(
            i => i.type == 'Potion' && i.category !== 'Herblore'
        ) as PotionItem[];

        otherPotions.forEach(potion => {
            otherPotionSources.push(potion.media);
            otherPotionNames.push(potion.id);
            otherPotionCallbacks.push(e => this.otherPotionImageButtonOnClick(e, potion));
            otherPotionTooltips.push(this.getPotionTooltip(potion));
        });

        this.potionSelectCard.addImageButtons(
            otherPotionSources,
            otherPotionNames,
            'Medium',
            otherPotionCallbacks,
            otherPotionTooltips
        );
    }

    createPetSelectCard() {
        const skillingModifiers = [
            'increasedChanceToDoubleItemsSkill',
            'increasedMiningNodeHP',
            'increasedSkillPreservationChance',
            'increasedFlatFarmingYield',
            'increasedGlobalMasteryXP',
            'golbinRaidStartingWeapon',
            'golbinRaidIncreasedStartingRuneCount',
            'increasedGPFromThieving',
            'decreasedSkillInterval',
            'increasedGPFromAgility',
            'decreasedSummoningShardCost',
            'increasedChanceGoldenStardust',
            'increasedTownshipMaxStorage',
            'increasedSkillXP',
            'increasedTownshipResourceProduction',
            'increasedTownshipHappiness',
            'increasedTownshipEducation',
            'increasedChanceAdditionalSkillResource',
            'increasedChanceToPreserveMapCharges',
            'decreasedHexTravelCost'
        ];

        const combatModifiers = [
            'increasedGlobalSkillXP',
            'increasedHiddenSkillLevel',
            'increasedDamageReduction',
            'increasedFlatMaxHitpoints',
            'increasedChanceToDoubleLootCombat',
            'increasedGlobalAccuracy',
            'increasedGPFromMonsters',
            'increasedRangedMaxHit',
            'increasedMagicMaxHit',
            'increasedSlayerCoins',
            'increasedAmmoPreservation',
            'increasedRunePreservation',
            'increasedChanceToPreservePrayerPoints',
            'increasedMeleeEvasion',
            'increasedRangedEvasion',
            'increasedMagicEvasion',
            'decreasedAttackInterval',
            'increasedDamageToCombatAreaMonsters',
            'increasedDamageToSlayerAreaMonsters',
            'increasedDamageToDungeonMonsters',
            'increasedDamageToAllMonsters',
            'increasedChanceToDoubleItemsGlobal',
            'increasedMaxHitPercent',
            'increasedSummoningChargePreservation',
            'increasedGPGlobal',
            'increasedLifesteal',
            'increasedSummoningMaxHit',
            'increasedFlatPrayerCostReduction',
            'decreasedMonsterRespawnTimer',
            'increasedChanceToPreservePotionCharge',
            'increasedGlobalEvasion',
            'increasedMinHitBasedOnMaxHit',
            'decreasedBurnDOTDamage',
            'increasedReflectDamage',
            'increasedChanceToPreserveUnholyPrayerPoints',
            'doubleActiveModifiersCartography'
        ];

        const hasModifier = (modifiers: string[], pet: Pet) => {
            return modifiers.some(modifier => Object.keys(pet.modifiers).some(petModifier => petModifier === modifier));
        };

        const hasSkillModifier = (pet: Pet) => hasModifier(skillingModifiers, pet);
        const hasCombatModifier = (pet: Pet) => hasModifier(combatModifiers, pet);

        // only get pets that have any modifiers, if they have a skill modifier, they must also have a combat modifier
        // otherwise include by default
        const combatPets = this.game.pets.allObjects.filter(
            pet =>
                (pet.enemyModifiers ? Object.keys(pet.enemyModifiers).length : Object.keys(pet.modifiers).length) &&
                (hasSkillModifier(pet) ? hasCombatModifier(pet) : true)
        );

        this.petSelectCard = this.mainTabCard.addTab('Pets', this.media.pet, '', '100px');
        this.petSelectCard.addSectionTitle('Pets');
        const petImageSources = combatPets.map(pet => pet.media);
        const petNames = combatPets.map(pet => pet.name);
        const petButtonCallbacks = combatPets.map(pet => (e: any) => this.petButtonOnClick(e, pet));
        const tooltips = combatPets.map(
            pet =>
                `<div class="text-center">${pet.name}<br><small class='text-info'>${pet.description.replace(
                    /\.$/,
                    ''
                )}</small></div>`
        );
        this.petSelectCard.addImageButtons(petImageSources, petNames, 'Medium', petButtonCallbacks, tooltips);
        this.petSelectCard.addButton('Clear All Pets', () => {
            this.import.importPets([]);
            this.updateCombatStats();
        });
        this.petSelectCard.addImage(
            this.actualGame.pets.getObjectByID('melvorD:CoolRock')!.media,
            100,
            'MCS Rock'
        ).style.display = 'none';
    }

    getCartographyPointsOfInterest() {
        const data: { [key: string]: any[] } = {};

        const maps = this.game.cartography.worldMaps.filter(map =>
            map.pointsOfInterest.some(poi => poi.activeModifiers !== undefined)
        );

        maps.forEach(map => {
            data[map.localID] = [];

            map.pointsOfInterest.forEach((poi: any) => {
                if (poi.activeModifiers) {
                    data[map.localID].push(poi);
                }
            });
        });

        return { data, maps };
    }

    createCartographySelectCards() {
        const { data, maps } = this.getCartographyPointsOfInterest();

        this.cartographySelectCard = this.mainTabCard.addPremadeTab(
            'Cartography',
            this.media.cartography,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        this.cartographySelectCard.addSectionTitle('Cartography');

        if (Object.keys(data).length > 1) {
            // add tab menu, it was not yet created in the constructor
            this.cartographySelectCard.addTabMenu();

            maps.forEach(map => {
                const newCard = new Card(this.micsr, this.cartographySelectCard.container, '', '100px');

                newCard.addSectionTitle(map.name);

                this.createHexMasterySelectCard(newCard, map);

                this.createCartographySelectCard(newCard, data[map.localID]);

                this.cartographySelectCard.addPremadeTab(map.name, this.media.cartography, newCard);
            });
        } else {
            maps.forEach(map => {
                const newCard = new Card(this.micsr, this.cartographySelectCard.container, '', '100px');

                this.createHexMasterySelectCard(newCard, map);

                this.createCartographySelectCard(newCard, data[map.localID]);
            });
        }
    }

    createHexMasterySelectCard(card: Card, map: any) {
        const masteryBonuses = Array.from<any>(map.masteryBonuses.registeredObjects.values());

        const images = masteryBonuses.map(() => this.media.cartography);
        const names = masteryBonuses.map(bonus => `${bonus.localID} Hexes`);
        const callbacks = masteryBonuses.map(
            bonus => (event: any) => this.cartographyHexMasteryButtonOnClick(event, bonus, map)
        );
        const tooltips = masteryBonuses.map(bonus => {
            let tooltip = `<div class="text-center mb-1">${bonus.localID} Hexes</div>`;

            if (bonus.modifiers) {
                const descriptions = getSpansFromModifierObject(bonus.modifiers);

                tooltip += '<div class="justify-vertical-center font-size-xs text-center">';

                descriptions.forEach(description => {
                    tooltip += description.outerHTML;
                });
            }

            tooltip += '</div>';

            return tooltip;
        });

        card.addImageButtons(images, names, 'Medium', callbacks, tooltips, '300px');

        return card;
    }

    getPointOfInterestTooltip(poi: any) {
        let tooltip = `<div class="text-center mb-1">${poi.name}</div>`;

        const posMult = (<any>this.game).cartography.hasCarthuluPet ? 2 : 1;

        const descriptions = getSpansFromModifierObject(poi.activeModifiers, 1, posMult);

        tooltip += '<div class="justify-vertical-center font-size-xs text-center">';

        descriptions.forEach(description => {
            tooltip += description.outerHTML;
        });

        tooltip += '</div>';

        return tooltip;
    }

    createCartographySelectCard(card: Card, pointsOfInterest: any[]) {
        const poiImages = pointsOfInterest.map(poi => poi.media);
        const poiNames = pointsOfInterest.map(poi => poi.localID);
        const poiCallbacks = pointsOfInterest.map(
            poi => (event: any) => this.cartographyImageButtonOnClick(event, poi)
        );
        const tooltips = pointsOfInterest.map(poi => this.getPointOfInterestTooltip(poi));

        card.addImageButtons(poiImages, poiNames, 'Medium', poiCallbacks, tooltips, '300px', 'mt-3');

        return card;
    }

    createAgilitySelectCard() {
        if (!this.agilitySelectCard) {
            this.agilitySelectCard = this.mainTabCard.addTab('Agility', this.media.agility, '', '100px');
            this.agilityCourse = new AgilityCourse(this, this.player, [
                { tag: 'combat', text: 'Combat', media: this.media.combat }
            ]);
        } else {
            this.agilitySelectCard.clearContainer();
        }
        this.agilityCourse.createAgilityCourseContainer(this.agilitySelectCard, this.agilityCourse.filters[0]);
    }

    agilityCourseCallback() {
        this.updateCombatStats();
    }

    createSlayerSelectCard() {
        this.slayerSelectCard = this.mainTabCard.addPremadeTab(
            'Slayer',
            this.media.slayer,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        this.slayerSelectCard.addSectionTitle('Slayer');

        const newCard = new Card(
            this.micsr,
            this.slayerSelectCard.container,
            '',
            '100px',
            undefined,
            'slayer-tab-container'
        );

        const { dungeonSet, purchaseSet, itemsFoundSet } = this.getSlayerRequirementData(this.game);

        newCard.addSectionTitle('Dungeon Completions');

        const dungeons = Array.from(dungeonSet);
        const purchases = Array.from(purchaseSet);
        const items = Array.from(itemsFoundSet);

        newCard.addImageButtons(
            dungeons.map(dungeon => dungeon.media),
            dungeons.map(dungeon => dungeon.localID),
            'Medium',
            dungeons.map(dungeon => event => {
                dungeon = this.game.dungeons.find(dung => dung.id === dungeon.id)!;

                if (this.game.combat['dungeonCompletion'].has(dungeon)) {
                    this.game.combat['dungeonCompletion'].delete(dungeon);
                    this.unselectButton(event.currentTarget as HTMLButtonElement);
                } else {
                    this.game.combat['dungeonCompletion'].set(dungeon, 1);
                    this.selectButton(event.currentTarget as HTMLButtonElement);
                }
            }),
            dungeons.map(dungeon => dungeon.name),
            '300px'
        );

        newCard.addSectionTitle('Shop Purchases');

        newCard.addImageButtons(
            purchases.map(purchase => purchase.media),
            purchases.map(purchase => purchase.localID),
            'Medium',
            purchases.map(purchase => event => {
                if (this.game.shop.upgradesPurchased.has(purchase)) {
                    this.game.shop.upgradesPurchased.delete(purchase);
                    this.unselectButton(event.currentTarget as HTMLButtonElement);
                } else {
                    this.game.shop.upgradesPurchased.set(purchase, 1);
                    this.selectButton(event.currentTarget as HTMLButtonElement);
                }
            }),
            purchases.map(purchase => purchase.name),
            '300px'
        );

        newCard.addSectionTitle('Found Items');

        newCard.addImageButtons(
            items.map(item => item.media),
            items.map(item => item.localID),
            'Medium',
            items.map(item => event => {
                const current = this.game.stats.itemFindCount(item);

                if (current) {
                    this.game.stats.Items.getTracker(item).remove(ItemStats.TimesFound);
                    this.unselectButton(event.currentTarget as HTMLButtonElement);
                } else {
                    this.game.stats.Items.add(item, ItemStats.TimesFound, 1);
                    this.selectButton(event.currentTarget as HTMLButtonElement);
                }
            }),
            items.map(item => item.name),
            '300px'
        );
    }

    getSlayerRequirementData(game: Game | SimGame) {
        const dungeonSet = new Set<Dungeon>();
        const purchaseSet = new Set<ShopPurchase>();
        const itemsFoundSet = new Set<AnyItem>();

        for (const area of game.slayerAreas.allObjects) {
            area.entryRequirements
                ?.filter(requirement => requirement.type === 'DungeonCompletion')
                .forEach((requirement: any) => {
                    dungeonSet.add(requirement.dungeon);
                });

            area.entryRequirements
                ?.filter(requirement => requirement.type === 'ShopPurchase')
                .forEach((requirement: any) => {
                    purchaseSet.add(requirement.purchase);
                });

            area.entryRequirements
                ?.filter(requirement => requirement.type === 'ItemFound')
                .forEach((requirement: any) => {
                    itemsFoundSet.add(requirement.item);
                });
        }

        return { dungeonSet, purchaseSet, itemsFoundSet };
    }

    getSlayerData(game: Game | SimGame) {
        const { dungeonSet, purchaseSet, itemsFoundSet } = this.getSlayerRequirementData(game);

        const slayer: IImportSlayer = {
            dungeonCompletion: [],
            shopPurchase: [],
            foundItem: []
        };

        for (const dungeon of dungeonSet.values()) {
            const count: number = game.combat['dungeonCompletion'].get(dungeon);

            if (count) {
                slayer.dungeonCompletion.push(dungeon.id);
            }
        }

        for (const purchase of purchaseSet.values()) {
            // @ts-ignore
            const count: number = game.shop['upgradesPurchased'].get(purchase);

            if (count) {
                slayer.shopPurchase.push(purchase.id);
            }
        }

        for (const itm of itemsFoundSet.values()) {
            const found = game.stats.itemFindCount(itm);

            if (found) {
                slayer.foundItem.push(itm.id);
            }
        }

        return slayer;
    }

    updateSlayer() {
        const container = document.querySelector('.slayer-tab-container');

        if (!container) {
            return;
        }

        const buttons = Array.from(container.querySelectorAll('button'));

        for (const button of buttons) {
            this.unselectButton(button);
        }

        const slayer = this.getSlayerData(this.game);

        for (const dungeonId of slayer.dungeonCompletion) {
            const dungeon = this.game.dungeons.getObjectByID(dungeonId);

            if (dungeon) {
                const button = buttons.find(button => button.id === `MCS ${dungeon.localID} Button`);

                if (button) {
                    this.selectButton(button);
                }
            }
        }

        for (const purchaseId of slayer.shopPurchase) {
            const purchase = this.game.shop.purchases.getObjectByID(purchaseId);

            if (purchase) {
                const button = buttons.find(button => button.id === `MCS ${purchase.localID} Button`);

                if (button) {
                    this.selectButton(button);
                }
            }
        }

        for (const itemId of slayer.foundItem) {
            const item = this.game.items.getObjectByID(itemId);

            if (item) {
                const button = buttons.find(button => button.id === `MCS ${item.localID} Button`);

                if (button) {
                    this.selectButton(button);
                }
            }
        }
    }

    createAstrologySelectCard() {
        this.astrologySelectCard = this.mainTabCard.addPremadeTab(
            'Astrology',
            this.media.astrology,
            new TabCard(this.micsr, '', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;

        this.astrologySelectCard.container.classList.add('astrology-card-container');

        this.astrologySelectCard.addSectionTitle('Astrology');
        this.astrologySelectCard.addTabMenu();

        this.game.astrology.actions.allObjects
            .filter(constellation => !this.skipConstellations.includes(constellation.id))
            .sort((a, b) => a.level - b.level)
            .forEach(constellation => {
                this.astrologySelectCard.addPremadeTab(
                    constellation.name,
                    constellation.media,
                    this.createConstellationSelectCard(constellation)
                );
            });

        this.astrologySelectCard.addButton('Clear All Star Modifiers', () => this.clearAstrology());
    }

    createConstellationSelectCard(constellation: AstrologyRecipe) {
        const newCard = new Card(
            this.micsr,
            this.astrologySelectCard.container,
            '',
            '100px',
            undefined,
            undefined,
            `constellation-card-container-${constellation.localID.toLowerCase()} my-2`
        );

        newCard.addSectionTitle(constellation.name);

        const skillContainer = document.createElement('div');
        skillContainer.className = `mcs-contellation-skill-container`;

        for (const skill of constellation.skills) {
            const skillImg = document.createElement('img');

            skillImg.src = skill.media;
            skillImg.className = `skill-icon-xs m-2`;

            skillContainer.appendChild(skillImg);
        }

        newCard.container.appendChild(skillContainer);

        for (const [index, modifier] of constellation.standardModifiers.entries()) {
            this.createModifier(newCard, index, modifier, constellation, false);
        }

        for (const [index, modifier] of constellation.uniqueModifiers.entries()) {
            this.createModifier(newCard, index, modifier, constellation, true);
        }

        return newCard;
    }

    createModifier(
        card: Card,
        index: number,
        modifier: AstrologyModifier,
        constellation: AstrologyRecipe,
        isUnique: boolean
    ) {
        const container = document.createElement('div');
        container.className = `constellation-modifiers-container`;

        const icon = document.createElement('img');
        icon.src = isUnique ? this.media.uniqueStar : this.media.standardStar;
        icon.className = `skill-icon-sm mr-2`;

        container.appendChild(icon);

        const list = document.createElement('ul');
        list.className = `nav-main nav-main-horizontal nav-main-horizontal-override`;

        for (let i = 0; i < modifier.maxCount; i++) {
            const item = document.createElement('li');

            item.className = `mcs-constellation-${constellation.localID.toLowerCase()} ${
                isUnique ? 'unique' : 'standard'
            }-index-${index} modifier-${i + 1} astro-mod inactive m-1`;
            item.dataset.tippyContent = this.getConstellationModifierDescription(modifier, i + 1, constellation);

            item.onclick = () => {
                const items = Array.from(list.querySelectorAll('li'));

                for (const li of items) {
                    li.classList.remove('active');
                    li.classList.toggle('inactive', true);
                }

                if (!isUnique) {
                    if (constellation.standardModsBought[index] === i + 1) {
                        constellation.standardModsBought[index] = 0;
                    } else {
                        constellation.standardModsBought[index] = i + 1;
                    }

                    if (constellation.standardModsBought[index] > 0) {
                        for (const [liIndex, li] of items.entries()) {
                            if (liIndex <= i) {
                                li.classList.remove('inactive');
                                li.classList.add('active');
                            }
                        }
                    }
                } else {
                    if (constellation.uniqueModsBought[index] === i + 1) {
                        constellation.uniqueModsBought[index] = 0;
                    } else {
                        constellation.uniqueModsBought[index] = i + 1;
                    }

                    if (constellation.uniqueModsBought[index] > 0) {
                        for (const [liIndex, li] of items.entries()) {
                            if (liIndex <= i) {
                                li.classList.remove('inactive');
                                li.classList.add('active');
                            }
                        }
                    }
                }

                this.game.astrology.actionMastery.set(constellation, { xp: 13034432, level: 99 });

                this.game.astrology.computeProvidedStats(false);
                this.updateCombatStats();
                setTimeout(() => this.updateAstrologyTooltips(), 10);
            };

            list.appendChild(item);
        }

        container.append(list);

        card.container.appendChild(container);
    }

    updateAstrologyMods() {
        const container = document.querySelector(`.astrology-card-container`);

        if (!container) {
            return;
        }

        for (const constellation of this.game.astrology.actions.allObjects.filter(
            constellation => !this.skipConstellations.includes(constellation.id)
        )) {
            for (const [index, modifier] of constellation.standardModifiers.entries()) {
                const items = container.querySelectorAll(
                    `.mcs-constellation-${constellation.localID.toLowerCase()}.standard-index-${index}`
                );

                for (let i = 0; i < modifier.maxCount; i++) {
                    items[i].classList.remove('inactive', 'active');

                    if (constellation.standardModsBought[index] > i) {
                        items[i].classList.add('active');
                    } else {
                        items[i].classList.add('inactive');
                    }
                }
            }

            for (const [index, modifier] of constellation.uniqueModifiers.entries()) {
                const items = container.querySelectorAll(
                    `.mcs-constellation-${constellation.localID.toLowerCase()}.unique-index-${index}`
                );

                for (let i = 0; i < modifier.maxCount; i++) {
                    items[i].classList.remove('inactive', 'active');

                    if (constellation.uniqueModsBought[index] > i) {
                        items[i].classList.add('active');
                    } else {
                        items[i].classList.add('inactive');
                    }
                }
            }
        }
    }

    isConstellationComplete(constellation: AstrologyRecipe) {
        let complete = true;

        constellation.standardModsBought.forEach((count, index) => {
            if (count < constellation.standardModifiers[index].maxCount) complete = false;
        });

        constellation.uniqueModsBought.forEach((count, index) => {
            if (count < constellation.uniqueModifiers[index].maxCount) complete = false;
        });

        return complete;
    }

    updateAstrologyTooltips() {
        const container = document.querySelector(`.astrology-card-container`);

        if (!container) {
            return;
        }

        for (const constellation of this.game.astrology.actions.allObjects.filter(
            constellation => !this.skipConstellations.includes(constellation.id)
        )) {
            for (const [index, modifier] of constellation.standardModifiers.entries()) {
                const items = container.querySelectorAll(
                    `.mcs-constellation-${constellation.localID.toLowerCase()}.standard-index-${index}`
                );

                for (let i = 0; i < modifier.maxCount; i++) {
                    const content = this.getConstellationModifierDescription(modifier, i + 1, constellation);

                    if (items[i]) {
                        this.setTooltip(items[i] as HTMLElement, content);
                    }
                }
            }

            for (const [index, modifier] of constellation.uniqueModifiers.entries()) {
                const items = container.querySelectorAll(
                    `.mcs-constellation-${constellation.localID.toLowerCase()}.unique-index-${index}`
                );

                for (let i = 0; i < modifier.maxCount; i++) {
                    const content = this.getConstellationModifierDescription(modifier, i + 1, constellation);

                    if (items[i]) {
                        this.setTooltip(items[i] as HTMLElement, content);
                    }
                }
            }
        }
    }

    getConstellationModifierDescription(modifier: AstrologyModifier, buyCount: number, constellation: AstrologyRecipe) {
        const multi = (<any>this.game.astrology).hasMasterRelic && this.isConstellationComplete(constellation) ? 2 : 1;
        const modValue = buyCount * modifier.incrementValue * multi;
        const mods = (<any>this.game.astrology).getModifierElement(modifier, modValue);
        const precision = Number.isInteger(modValue) ? 0 : 2;

        let text = '';

        for (const [index, mod] of mods.entries()) {
            let description;
            if ('values' in mod) {
                [description] = printPlayerModifier(mod.key, mod.values[0], precision);
            } else {
                [description] = printPlayerModifier(mod.key, mod.value, precision);
            }

            if (index > 0) {
                text += '<br>';
            }

            text += description;
        }

        return text;
    }

    clearAstrology() {
        // Set UI to 0
        $('input.astrology-modifier').val(0);
        // Update Game
        this.game.astrology.actions.allObjects.forEach(constellation => {
            constellation.standardModsBought.fill(0);
            constellation.uniqueModsBought.fill(0);
        });
        // Update stats
        this.game.astrology.computeProvidedStats(false);
        this.updateCombatStats();
        this.updateAstrologyMods();

        setTimeout(() => this.updateAstrologyTooltips(), 10);
    }

    createLootOptionsCard() {
        if (!this.lootSelectCard) {
            this.lootSelectCard = this.mainTabCard.addTab('Loot Options', this.media.loot, '', '150px');
        } else {
            this.lootSelectCard.clearContainer();
        }
        // drop chance options
        this.lootSelectCard.addSectionTitle('Drop Chance Options');
        this.lootSelectCard.addToggleRadio(
            'Only Selected Monster',
            'selectedMonster',
            this.dropListFilters,
            'selectedMonster',
            this.dropListFilters.selectedMonster, // default
            25, // default
            () => {
                this.createLootOptionsCard();
                this.updatePlotForLoot();
            }
        );
        this.lootSelectCard.addToggleRadio(
            'Only Undiscovered',
            'onlyUndiscovered',
            this.dropListFilters,
            'onlyUndiscovered',
            this.dropListFilters.onlyUndiscovered, // default
            25, // default
            () => {
                this.createLootOptionsCard();
                this.updatePlotForLoot();
            }
        );
        const droppedItems = this.buildItemDropList();
        let index = droppedItems.indexOf(this.combatData.dropSelected);
        if (index === -1) {
            index = 0;
            this.combatData.dropSelected = 'micsr:none';
            this.updatePlotForLoot();
        }
        const { dropdown } = this.lootSelectCard.addDropdown(
            'Choose Item',
            droppedItems.map(itemID =>
                itemID === 'micsr:none' ? 'None' : this.micsr.items.getObjectByID(itemID)!.name
            ),
            droppedItems,
            (event: any) => this.dropChanceOnChange(event),
            true
        );
        if ((<any>dropdown).index !== index) {
            (<any>dropdown).selectOption(index);
        }

        // gp options
        this.lootSelectCard.addSectionTitle('');
        this.lootSelectCard.addSectionTitle('GP/s Options');
        this.lootSelectCard.addRadio(
            'Sell Bones',
            25,
            'sellBones',
            ['Yes', 'No'],
            [(e: any) => this.sellBonesRadioOnChange(e, true), (e: any) => this.sellBonesRadioOnChange(e, false)],
            this.loot.sellBones ? 0 : 1
        );
        this.lootSelectCard.addRadio(
            'Convert Shards',
            25,
            'convertShards',
            ['Yes', 'No'],
            [
                (e: any) => this.convertShardsRadioOnChange(e, true),
                (e: any) => this.convertShardsRadioOnChange(e, false)
            ],
            this.loot.convertShards ? 0 : 1
        );
        this.lootSelectCard.addRadio(
            'High Alch Drops',
            25,
            'alchHighValueItems',
            ['Yes', 'No'],
            [
                (e: any) => this.alchHighValueItemsRadioOnChange(e, true),
                (e: any) => this.alchHighValueItemsRadioOnChange(e, false)
            ],
            this.loot.alchHighValueItems ? 0 : 1
        );
        this.lootSelectCard.addNumberInput(
            'Alch Min Sale Value',
            this.loot.alchemyCutoff,
            0,
            Number.MAX_SAFE_INTEGER,
            (event: any) => this.alchemyCutoffInputOnChange(event)
        );
    }

    addToLootMap(monster: any, lootMap: any) {
        if (monster.lootTable) {
            monster.lootTable.drops.forEach((drop: any) => {
                const itemID: string = drop.item.id;
                lootMap.set(itemID, true);
                const dropTable = drop.item.dropTable;
                if (dropTable) {
                    dropTable.drops.forEach((drp: any) => lootMap.set(drp.item.id, true));
                }
            });
        }
        if (monster.bones) {
            lootMap.set(monster.bones.item.id, true);
            // TODO: some bones are upgradable, e.g. Earth_Shard
        }

        if (monster.hasBarrier) {
            lootMap.set('melvorAoD:Barrier_Dust', true);
        }

        if (monster.rewards) {
            monster.rewards.forEach((reward: any) => {
                lootMap.set(reward.id, true);
                const dropTable = reward.dropTable;
                if (dropTable) {
                    dropTable.drops.forEach((drp: any) => lootMap.set(drp.item.id, true));
                }
            });
        }
        return lootMap;
    }

    buildItemDropList() {
        // construct map
        let lootMap = new Map();
        if (this.dropListFilters.selectedMonster) {
            if (!this.isViewingDungeon) {
                if (this.barIsDungeon(this.selectedBar)) {
                    const dungeonID = this.barMonsterIDs[this.selectedBar];
                    const dungeon = this.micsr.dungeons.getObjectByID(dungeonID)!;
                    const monsters = dungeon.monsters;
                    const boss = monsters[monsters.length - 1];
                    lootMap = this.addToLootMap(boss, lootMap);
                    lootMap = this.addToLootMap(dungeon, lootMap);
                } else if (this.barIsTask(this.selectedBar)) {
                    const taskID = this.barMonsterIDs[this.selectedBar];
                    const monsters = this.simulator.slayerTaskMonsters[taskID];
                    monsters
                        .map((monster: any) => this.micsr.monsters.getObjectByID(monster.id))
                        .forEach((monster: any) => (lootMap = this.addToLootMap(monster, lootMap)));
                } else {
                    lootMap = this.addToLootMap(
                        this.micsr.monsters.getObjectByID(this.barMonsterIDs[this.selectedBar]),
                        lootMap
                    );
                }
            } else if (this.loot.godDungeonIDs.includes(this.viewedDungeonID)) {
                const monsterID = this.getSelectedDungeonMonsterID();
                lootMap = this.addToLootMap(this.micsr.monsters.getObjectByID(monsterID), lootMap);
            }
        } else {
            this.micsr.monsters.forEach((monster: any) => (lootMap = this.addToLootMap(monster, lootMap)));

            this.micsr.dungeons.forEach(dungeon => {
                lootMap = this.addToLootMap(dungeon, lootMap);
            });
        }
        // construct list
        let lootList: any[] = [];
        lootMap.forEach((_: boolean, itemID: any) => {
            // apply undiscovered filter
            if (this.dropListFilters.onlyUndiscovered) {
                const item = this.micsr.actualGame.items.getObjectByID(itemID);
                if (this.micsr.actualGame.stats.itemFindCount(item!) === 0) {
                    lootList.push(itemID);
                }
            } else {
                lootList.push(itemID);
            }
        });
        // sort by name
        return [
            'micsr:none',
            ...lootList.sort((a, b) =>
                this.micsr.items.getObjectByID(a)!.name > this.micsr.items.getObjectByID(b)!.name ? 1 : -1
            )
        ];
    }

    dropChanceOnChange(event: any) {
        this.combatData.dropSelected = event.currentTarget.value;
        this.updatePlotForLoot();
    }

    getSelectedDropLabel() {
        if (this.combatData.dropSelected === 'micsr:none') {
            return `Drops/${this.selectedTimeShorthand}`;
        }
        const item = this.micsr.items.getObjectByID(this.combatData.dropSelected)!;
        return `${item.name}/${this.selectedTimeShorthand}`;
    }

    createSimulationAndExportCard() {
        this.simOptionsCard = this.mainTabCard.addTab('Simulation Options', this.media.settings, '', '150px');
        // advanced options
        this.simOptionsCard.addSectionTitle('Advanced Options');
        this.simOptionsCard.addNumberInput('# Trials', this.micsr.trials, 1, 1e5, (event: any) =>
            this.numTrialsInputOnChange(event)
        );
        this.simOptionsCard.addNumberInput('Max tick/trial', this.micsr.maxTicks, 1, 1e8, (event: any) =>
            this.maxTicksInputOnChange(event)
        );
        this.simOptionsCard.addToggleRadio(
            'Heal After Death',
            'healAfterDeath',
            this.player,
            'healAfterDeath',
            this.player.healAfterDeath
        );
        this.simOptionsCard.addToggleRadio('Has Runes', 'hasRunes', this.player, 'hasRunes', this.player.hasRunes);
        this.simOptionsCard.addToggleRadio(
            'Disable Save Slot Overwrite',
            'disableOverwrite',
            this,
            'disableOverwrite',
            this.disableOverwrite
        );
        // settings export and import
        this.simOptionsCard.container.appendChild(document.createElement('br'));
        this.simOptionsCard.addSectionTitle('Settings Export - Import');
        this.simOptionsCard.addButton('Export Settings', () => this.exportSettingButtonOnClick());
        this.importedSettings = undefined;
        this.simOptionsCard.addTextInput('Settings JSON:', '', (event: any) => {
            try {
                this.importedSettings = this.import.convertStringToObject(event.currentTarget.value);
            } catch {
                this.notify('Ignored invalid JSON settings!', 'danger');
                this.importedSettings = undefined;
            }
        });
        this.simOptionsCard.addButton('Import Settings', () => {
            if (!this.importedSettings) {
                this.notify('No settings to import.', 'danger');
                return;
            }
            this.import.importSettings(this.importedSettings, false);
        });
        // data export
        this.simOptionsCard.container.appendChild(document.createElement('br'));
        this.simOptionsCard.addSectionTitle('Data Export');
        this.simOptionsCard.addToggleRadio(
            'Dungeon Monsters',
            `DungeonMonsterExportRadio`,
            this.dataExport.exportOptions,
            'dungeonMonsters',
            this.dataExport.exportOptions.dungeonMonsters
        );
        this.simOptionsCard.addToggleRadio(
            'Non-Simulated',
            `NonSimmedExportRadio`,
            this.dataExport.exportOptions,
            'nonSimmed',
            this.dataExport.exportOptions.nonSimmed
        );
        this.simOptionsCard.addButton('Export Data', () => this.exportDataOnClick());
    }

    createCompareCard() {
        if (!this.compareCard) {
            this.trackHistory = false;
            this.savedSimulations = [];
            this.compareCard = this.mainTabCard.addTab('Saved Simulations', this.media.statistics, '', '150px');
        } else {
            this.compareCard.clearContainer();
        }
        this.compareCard.addButton('Clear History', () => {
            this.savedSimulations = [];
            this.simulationCount = 0;
            this.createCompareCard();
        });
        this.compareCard.addRadio(
            'Track History',
            25,
            'trackHistory',
            ['Yes', 'No'],
            [() => (this.trackHistory = true), () => (this.trackHistory = false)],
            this.trackHistory ? 0 : 1
        );

        this.compareCard.addSectionTitle('Saved Simulations');
        this.savedSimulations.forEach((saved: any, i: any) => {
            const load = this.compareCard.addButton(saved.name, () => this.loadSavedSimulation(i));

            const clear = document.createElement('button');

            clear.type = 'button';
            clear.className = 'btn font-size-sm m-1 btn-danger';
            clear.textContent = 'X';
            clear.onclick = () => this.clearSavedSimulation(i);

            const rename = document.createElement('button');

            rename.type = 'button';
            rename.className = 'btn font-size-sm m-1 btn-info mcs-rename-simulation';
            rename.innerHTML = `<img src="${this.micsr.icons.pencil}" />`;
            rename.onclick = () => this.renameSavedSimulation(i);

            load.parentElement.appendChild(rename);
            load.parentElement.appendChild(clear);
        });
    }

    loadSavedSimulation(idx: number) {
        const simulation = this.savedSimulations[idx];
        if (!simulation) {
            this.micsr.logger.error(`Unable to load simulation with index ${idx}`);
            return;
        }
        // load settings
        this.import.importSettings(simulation.save.settings, true);
        // load results
        for (const id in simulation.save.monsterSimData) {
            this.simulator.monsterSimData[id] = {
                ...simulation.save.monsterSimData[id]
            };
        }
        this.simulator.performPostSimAnalysis();
        this.updateDisplayPostSim();
    }

    clearSavedSimulation(index: number) {
        this.savedSimulations.splice(index, 1);
        this.createCompareCard();
    }

    renameSavedSimulation(index: number) {
        if (!this.savedSimulations[index]) {
            return;
        }

        const that = this;

        SwalLocale.fire({
            titleText: `Rename`,
            customClass: {
                container: 'mcs-rename-history-swal-container',
                confirmButton: 'btn btn-primary m-1',
                cancelButton: 'btn btn-danger m-1'
            },
            showCancelButton: true,
            confirmButtonText: 'Rename',
            returnFocus: false,
            input: 'text',
            inputValue: this.savedSimulations[index].name,
            inputLabel: 'Enter a name to remember this saved simulation',
            inputAttributes: {
                maxlength: '30'
            },
            inputValidator(inputValue: string) {
                if (!inputValue) {
                    return 'Name cannot be empty.';
                }

                if (inputValue.length > 30) {
                    return 'Name cannot be longer then 30 characters.';
                }
            },
            preConfirm(inputValue: string) {
                that.savedSimulations[index].name = inputValue;
                that.createCompareCard();
            }
        });
    }

    createConsumablesCard() {
        this.consumablesCard = this.mainTabCard.addPremadeTab(
            'Consumables',
            this.media.bank,
            new TabCard(this.micsr, 'consumables', false, this.mainTabCard.tabContainer, '100%', '150px')
        ) as TabCard;
        this.consumables = new Consumables(this);
    }

    /** Adds a multi-button with equipment to the equipment select popup
     * @param {Card} card The parent card
     * @param {number} equipmentSlot The equipment slot
     * @param {Function} filterFunction Filter equipment with this function
     * @param {Function} sortFunction Sort equipment by this key
     */
    addEquipmentMultiButton(
        card: any,
        equipmentSlot: any,
        filterFunction: any,
        sortFunction = (item: any) => item.id,
        golbinRaid = false
    ) {
        const menuItems = this.equipmentSubsets[equipmentSlot]
            .filter(filterFunction)
            .filter((x: any) => !!x.golbinRaidExclusive === golbinRaid);

        const sortKey = (item: any) => {
            const x = sortFunction(item);
            return x ? x : 0;
        };

        const sortFunc = sortByOrder<any, any>(this.actualGame.bank['defaultSortOrder'], 'item');
        menuItems.sort(
            (a: any, b: any) =>
                sortKey(a) - sortKey(b) ||
                sortFunc(
                    { item: this.actualGame.items.getObjectByID(a.id) },
                    { item: this.actualGame.items.getObjectByID(b.id) }
                )
        );
        const buttonMedia = menuItems.map((item: any) => item.media);
        const buttonIds = menuItems.map((item: any) => item.name);
        const buttonCallbacks = menuItems.map((item: any) => () => {
            tippy.hideAll({ duration: 0 });
            this.equipItem(equipmentSlot, item);
            container?.remove();
        });

        const tooltips = menuItems.map((item: any) => this.getEquipmentTooltip(equipmentSlot, item));

        const container = card.addImageButtons(buttonMedia, buttonIds, 'Small', buttonCallbacks, tooltips, '100%');
    }

    /**
     * Filters an array by if the array item has the key
     * @param {string} key
     * @param {Object} item
     * @return {boolean}
     */
    filterIfHasKey(key: any, item: any) {
        return key in item || item.id === -1;
    }

    filterIfHasLevelReq(item: any, skillID: any) {
        if (item.id === -1) {
            return true;
        }
        if (this.force[skillID].includes(item.id)) {
            return true;
        }

        const forcedItems = Object.values<string[]>(this.force).flat();

        // the item has already been forced, otherwise ignore it
        if (forcedItems.includes(item.id)) {
            return false;
        }

        return this.getItemLevelReq(item, skillID) > 0;
    }

    getItemLevelReq(item: any, skillID: any) {
        if (skillID === this.micsr.skillIDs.Summoning) {
            return item.summoningLevel | 0;
        }
        let req = 0;
        if (item.equipRequirements === undefined || item.equipRequirements.length === 0) {
            return req;
        }
        return item.equipRequirements
            .filter((x: AnyRequirement) => x.type === 'SkillLevel' && x.skill.id === skillID)
            .map((x: SkillLevelRequirementData) => x.level)[0];
    }

    /**
     * Filters equipment by if it has no level requirements
     * @param {Object} item
     * @return {boolean}
     */
    filterIfHasNoLevelReq(item: any) {
        if (item.id === -1) {
            return true;
        }

        if (this.force['Other'].includes(item.id)) {
            return true;
        }

        const skillIDs = [this.micsr.skillIDs.Defence, this.micsr.skillIDs.Ranged, this.micsr.skillIDs.Magic];
        for (let skillID of skillIDs) {
            if (this.getItemLevelReq(item, skillID) || (this.force[skillID] && this.force[skillID].includes(item.id))) {
                return false;
            }
        }
        return true;
    }

    filterByCombatConsumable(item: EquipmentItem) {
        return this.filterByMonsterConsumable(item) || this.filterByPlayerConsumable(item);
    }

    filterByMonsterConsumable(item: EquipmentItem) {
        const combatTypes = ['EnemyAttack', 'MonsterKilled', 'MonsterSpawned'];

        return item.consumesOn?.some(consume => combatTypes.includes((<any>consume).type));
    }

    filterByPlayerConsumable(item: EquipmentItem) {
        const combatTypes = ['PlayerAttack', 'PlayerSummonAttack', 'PrayerPointConsumption', 'RuneConsumption'];

        return item.consumesOn?.some(consume => combatTypes.includes((<any>consume).type));
    }

    /**
     * Filter an item array by the ammoType
     * @param {number} type
     * @param {Object} item
     * @return {boolean}
     */
    filterByAmmoType(type: any, item: any) {
        return item.ammoType === type || item.id === -1;
    }

    filterNoAmmoType(item: any) {
        return item.ammoType === undefined || item.id === -1;
    }

    /**
     * Filter an item array by the ammoType
     * @param {number} type
     * @param {Object} item
     * @return {boolean}
     */
    filterByAmmoReq(type: any, item: any) {
        return item.ammoTypeRequired === type || item.id === -1;
    }

    /**
     * Filter an item if it's twohanded property matches the given state
     * @param {boolean} is2H Filter if twohanded matches this
     * @param {Object} item
     * @return {boolean}
     */
    filterByTwoHanded(is2H: any, item: any) {
        if (item.id === -1) {
            return true;
        }
        return this.isTwoHanded(item) === is2H;
    }

    isTwoHanded(item: any) {
        return item.occupiesSlots && item.occupiesSlots.includes('Shield');
    }

    filterMagicDamage(item: any) {
        if (item.id === -1) {
            return true;
        }
        if (item.modifiers === undefined) {
            return false;
        }
        const equipmentStatBonuses = item.equipmentStats
            .filter((x: any) => x.key === 'magicAttackBonus' || x.key === 'magicDamageBonus')
            .map((x: any) => x.value)
            .filter((x: any) => x > 0);
        return (
            equipmentStatBonuses.length > 0 ||
            item.modifiers.increasedMinAirSpellDmg > 0 ||
            item.modifiers.increasedMinEarthSpellDmg > 0 ||
            item.modifiers.increasedMinFireSpellDmg > 0 ||
            item.modifiers.increasedMinWaterSpellDmg > 0
        );
    }

    filterSlayer(item: any) {
        if (item.id === -1) {
            return true;
        }
        if (item.modifiers === undefined) {
            return false;
        }
        if (
            item.modifiers.increasedSkillXP &&
            item.modifiers.increasedSkillXP.filter((x: any) => x[0] === this.micsr.skillIDs.Slayer).length > 0
        ) {
            return true;
        }
        return (
            item.modifiers.increasedSlayerAreaEffectNegationFlat > 0 ||
            item.modifiers.increasedDamageToSlayerTasks > 0 ||
            item.modifiers.increasedDamageToSlayerAreaMonsters > 0 ||
            item.modifiers.increasedSlayerTaskLength > 0 ||
            item.modifiers.increasedSlayerCoins > 0
        );
    }

    filterRemainingPassive(item: any) {
        if (item.id === -1) {
            return true;
        }
        return !this.filterMagicDamage(item) && !this.filterSlayer(item);
    }

    /**
     * Filter an item by the weapon type
     * @param {string} weaponType
     * @param {Object} item
     * @return {boolean}
     */
    filterByWeaponType(attackType: any, item: any) {
        if (item.id === -1) {
            return true;
        }
        return item.attackType === attackType;
    }

    /**
     * Filter by combat summon
     * @return {boolean}
     */
    filterCombatSummon(item: any, combat: any) {
        if (item.id === -1) {
            return true;
        }
        let maxhit = 0;
        if (item.equipmentStats) {
            const maxhitList = item.equipmentStats.filter((x: any) => x.key === 'summoningMaxhit');
            if (maxhitList.length > 0) {
                maxhit = maxhitList[0].value;
            }
        }
        return maxhit > 0 === combat;
    }

    /**
     * Filter by returning all elements
     * @return {boolean}
     */
    returnTrue() {
        return true;
    }

    /**
     * Change a button's classes to show that it is selected
     * @param {HTMLButtonElement} button
     */
    selectButton(button: HTMLElement) {
        button.classList.add('btn-primary');
        button.classList.remove('btn-outline-dark');
    }

    /**
     * Change a button's classes to show that it is not selected
     * @param {HTMLButtonElement} button
     */
    unselectButton(button: HTMLElement) {
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-dark');
    }

    /**
     * Creates an equipment popup
     * @param {number} equipmentSlot
     * @return {HTMLDivElement}
     */
    createEquipmentPopup(equipmentSlot: any) {
        const equipmentSelectPopup = document.createElement('div');
        equipmentSelectPopup.className = 'mcsPopup';
        const equipmentSelectCard = new Card(this.micsr, equipmentSelectPopup, '', '600px');
        equipmentSelectCard.addSearch(`${EquipmentSlots[equipmentSlot]}-search`, '.btn');
        const triSplit = [
            EquipmentSlots.Helmet,
            EquipmentSlots.Platebody,
            EquipmentSlots.Platelegs,
            EquipmentSlots.Boots,
            EquipmentSlots.Shield,
            EquipmentSlots.Gloves
        ];
        const noSplit = [EquipmentSlots.Amulet, EquipmentSlots.Ring, EquipmentSlots.Cape];
        if (triSplit.includes(equipmentSlot)) {
            equipmentSelectCard.addSectionTitle('Melee');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterIfHasLevelReq(item, this.micsr.skillIDs.Defence),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Defence)
            );
            equipmentSelectCard.addSectionTitle('Ranged');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterIfHasLevelReq(item, this.micsr.skillIDs.Ranged),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('Magic');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterIfHasLevelReq(item, this.micsr.skillIDs.Magic),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Magic)
            );
            if (
                this.equipmentSubsets[equipmentSlot].filter((item: any) => this.filterIfHasNoLevelReq(item)).length > 1
            ) {
                equipmentSelectCard.addSectionTitle('Other');
                this.addEquipmentMultiButton(
                    equipmentSelectCard,
                    equipmentSlot,
                    (item: any) => this.filterIfHasNoLevelReq(item),
                    x => x.name
                );
            }
        } else if (noSplit.includes(equipmentSlot)) {
            equipmentSelectCard.addSectionTitle(EquipmentSlots[equipmentSlot]);
            this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, () => this.returnTrue());
        } else if (equipmentSlot === EquipmentSlots.Weapon) {
            equipmentSelectCard.addSectionTitle('1H Melee');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(false, item) && this.filterByWeaponType('melee', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Attack)
            );
            equipmentSelectCard.addSectionTitle('2H Melee');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(true, item) && this.filterByWeaponType('melee', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Attack)
            );
            equipmentSelectCard.addSectionTitle('1H Ranged');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(false, item) && this.filterByWeaponType('ranged', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('2H Ranged');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(true, item) && this.filterByWeaponType('ranged', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('1H Magic');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(false, item) && this.filterByWeaponType('magic', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Magic)
            );
            equipmentSelectCard.addSectionTitle('2H Magic');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => {
                    return this.filterByTwoHanded(true, item) && this.filterByWeaponType('magic', item);
                },
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Magic)
            );
        } else if (equipmentSlot === EquipmentSlots.Quiver) {
            equipmentSelectCard.addSectionTitle('Arrows');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterByAmmoType(0, item),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('Bolts');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterByAmmoType(1, item),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('Javelins');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterByAmmoType(2, item),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('Throwing Knives');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterByAmmoType(3, item),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Ranged)
            );
            equipmentSelectCard.addSectionTitle('Other');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterNoAmmoType(item),
                x => x.name
            );
        } else if (equipmentSlot === EquipmentSlots.Passive) {
            equipmentSelectCard.addSectionTitle('Magic Damage');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterMagicDamage(item),
                x => x.name
            );
            equipmentSelectCard.addSectionTitle('Slayer');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterSlayer(item),
                x => x.name
            );
            equipmentSelectCard.addSectionTitle('Other');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterRemainingPassive(item),
                x => x.name
            );
        } else if (equipmentSlot === EquipmentSlots.Consumable) {
            equipmentSelectCard.addSectionTitle('Player Events');
            this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item: EquipmentItem) =>
                this.filterByPlayerConsumable(item)
            );
            equipmentSelectCard.addSectionTitle('Monster Events');
            this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item: EquipmentItem) =>
                this.filterByMonsterConsumable(item)
            );
            equipmentSelectCard.addSectionTitle('Non Combat');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: EquipmentItem) => !this.filterByCombatConsumable(item)
            );
        } else if (equipmentSlot === EquipmentSlots.Summon1 || equipmentSlot === EquipmentSlots.Summon2) {
            equipmentSelectCard.addSectionTitle('Combat Familiars');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterCombatSummon(item, true),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Summoning)
            );
            equipmentSelectCard.addSectionTitle('Non-Combat Familiars');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.filterCombatSummon(item, false),
                x => this.getItemLevelReq(x, this.micsr.skillIDs.Summoning)
            );
        } else if (equipmentSlot === 15) {
            equipmentSelectCard.addSectionTitle('Gem');
            this.addEquipmentMultiButton(
                equipmentSelectCard,
                equipmentSlot,
                (item: any) => this.returnTrue(),
                x => x.name
            );
        } else {
            throw Error(`Invalid equipmentSlot: ${equipmentSlot}`);
        }
        return equipmentSelectPopup;
    }

    // Callback Functions for equipment select card
    /**
     * Equips an item to an equipment slot
     */
    equipItem(slotID: any, item: any, updateStats = true, skipUnequip = false) {
        const activePrayers = new Set(this.player.activePrayers);
        let slot = EquipmentSlots[slotID] as SlotTypes;
        // determine equipment slot
        if (item.occupiesSlots && item.occupiesSlots.includes(slot)) {
            slot = item.validSlots[0];
            slotID = (<any>this.micsr.equipmentSlotData)[slot].id;
        }

        // clear previous item
        if (!skipUnequip) {
            let slots = [slot];
            if (item.occupiesSlots) {
                slots = [slot, ...item.occupiesSlots];
            }
            slots.forEach(slotToOccupy => {
                const equipment = this.player.equipment;
                const prevSlot = equipment['getRootSlot'](slotToOccupy) as SlotTypes;
                equipment.slots[prevSlot].occupies.forEach((occupied: any) => {
                    this.setEquipmentImage((<any>this.micsr.equipmentSlotData)[occupied].id);
                });
                this.player.unequipItem(0, prevSlot);
                this.setEquipmentImage((<any>this.micsr.equipmentSlotData)[prevSlot].id);
            });
        }

        // equip new item
        this.player.equipItem(item, 0, slot);
        this.setEquipmentImage(slotID, item);
        // update stats
        if (updateStats) {
            this.updateEquipmentStats();
        }

        let isCurrentUnholy = false;
        for (const prayer of activePrayers) {
            if ((<any>prayer).isUnholy) {
                isCurrentUnholy = true;
                break;
            }
        }

        if (activePrayers.size > 0 && isCurrentUnholy && (<any>this.player.modifiers).allowUnholyPrayerUse < 2) {
            for (const prayer of activePrayers) {
                const button = document.getElementById(`MCS ${this.getPrayerName(prayer)} Button`);
                if (button) {
                    this.unselectButton(button);
                }
            }
        } else {
            for (const prayer of activePrayers.values()) {
                this.player.activePrayers.add(prayer);
            }
        }
    }

    updateEquipmentStats() {
        this.updateStyleDropdowns();
        this.updateSpellOptions();
        this.updateCombatStats();
    }

    /**
     * Change the equipment image
     */
    setEquipmentImage(equipmentSlot: any, occupy = true) {
        const slotKey = EquipmentSlots[equipmentSlot] as SlotTypes;

        // @ts-ignore
        if (!cloudManager.hasAoDEntitlement && slotKey === 'Gem') {
            return;
        }

        const img = document.getElementById(`MCS ${slotKey} Image`);
        const slot = this.player.equipment.slots[slotKey];
        let imgSrc = this.micsr.equipmentSlotData[slotKey].emptyMedia;
        if (!slot.isEmpty) {
            imgSrc = slot.item.media;
        }
        (img as any).src = imgSrc;
        this.setTooltip(img, this.getEquipmentTooltip(equipmentSlot, slot.item));
        if (occupy && slot.item.occupiesSlots) {
            slot.item.occupiesSlots.forEach((slot: any) =>
                this.setEquipmentImage((<any>this.micsr.equipmentSlotData)[slot].id, false)
            );
        }
    }

    /**
     * Gets the content for the tooltip of a piece of equipment
     *
     * @param equipmentSlot The equipment slot of the item
     * @param item The item to get the tooltip for
     * @returns {string} The tooltip content
     */
    getEquipmentTooltip(equipmentSlot: any, item: any) {
        if (!item || item.localID === 'Empty_Equipment') {
            return EquipmentSlots[equipmentSlot];
        }

        let tooltip = `<div class="text-center mt-1 mb-1"><span class="text-warning">${item.name}</span><br><small>`;

        tooltip += getItemSpecialAttackInformation(item);

        if (item.hasDescription) {
            let description = item.description;

            try {
                description = item.modifiedDescription;
            } catch {}

            tooltip += `<span class="text-info mt-1 mb-1">${description}</span>`;
        }

        const pushBonus = (list: any, header = '', footer = '', multiplier = 1) => {
            const statBonuses: any = [];
            if (item.equipmentStats === undefined) {
                return;
            }
            list.forEach((bonusInfo: any) => {
                const name = bonusInfo[0];
                const tag = bonusInfo[1];
                const suffix = bonusInfo[2] === undefined ? '' : bonusInfo[2];
                const value = item.equipmentStats
                    .filter((y: any) => y.key === tag)
                    .reduce((a: any, b: any) => a + b.value, 0);
                if (value !== 0) {
                    statBonuses.push(this.getTooltipStatBonus(name, value * multiplier, suffix));
                }
            });
            if (statBonuses.length > 0) {
                tooltip += header;
                tooltip += statBonuses.map((stat: any) => `<div>${stat}</div>`).join('');
                tooltip += footer;
            }
        };

        pushBonus(
            [
                ['Attack Speed', 'attackSpeed'],
                ['Melee Strength', 'meleeStrengthBonus'],
                ['Stab', 'stabAttackBonus'],
                ['Slash', 'slashAttackBonus'],
                ['Block', 'blockAttackBonus'],
                ['Ranged Strength', 'rangedStrengthBonus'],
                ['Ranged Attack', 'rangedAttackBonus'],
                ['Magic Damage', 'magicDamageBonus', '%'],
                ['Magic Attack', 'magicAttackBonus']
            ],
            `<div class="mt-1">Offence:</div><span class="mb-1">`,
            '</span>'
        );

        pushBonus(
            [
                ['Damage Reduction', 'damageReduction', '%'],
                ['Melee Defence', 'defenceBonus'],
                ['Ranged Defence', 'rangedDefenceBonus'],
                ['Magic Defence', 'magicDefenceBonus']
            ],
            `<div class="mt-1">Defence:</div><span class="mb-1">`,
            '</span>'
        );

        pushBonus([['Summoning Max Hit', 'summoningMaxhit']], `<div class="mt-1">`, '</div>', 10);

        if (item.equipRequirements) {
            const requirements: any = [];
            const levelReqs = item.equipRequirements.find((x: any) => x.type === 'Level');
            if (levelReqs) {
                this.skillKeys.forEach(skill => {
                    const levelReq = levelReqs.levels.find((x: any) => x.skill.name === skill);
                    if (levelReq) {
                        requirements.push(`${skill} Level ${levelReq.level}`);
                    }
                });
            }
            if (requirements.length > 0) {
                tooltip += `<div>Requires:</div><span class="text-warning">${requirements.join(', ')}</span>`;
            }
        }

        tooltip += '</small></div>';
        return tooltip;
    }

    /**
     * Returns a span containing a description of the given stat bonus
     * @param {string} stat The name of the stat
     * @param {number} bonus The value of the bonus
     * @param {string} suffix A suffix to add after the bonus
     * @returns {HTMLSpanElement}
     */
    getTooltipStatBonus(stat: any, bonus: any, suffix = '') {
        return `<span style="white-space: nowrap;" class="text-${
            bonus > 0 ? 'success">+' : 'danger">'
        }${bonus}${suffix} ${stat}</span>`;
    }

    /**
     * Returns an image element containing the given icon for use in a tooltip
     * @param {string} icon The source of the icon
     * @returns {HTMLImageElement} The image element
     */
    getTooltipIcon(icon: any) {
        return `<img class="tooltip-icon" src="${icon}">`;
    }

    /**
     * Updates the style selection dropdowns
     * @memberof McsApp
     */
    updateStyleDropdowns() {
        // TODO: When player equipment is changed
        // const item = this.player.equipment.slots.Weapon.item as WeaponItem;
        const itemID = this.player.equipmentID(this.micsr.equipmentSlotData.Weapon.id);
        const item = this.micsr.items.getObjectByID(itemID) as WeaponItem;
        this.disableStyleDropdown('melee');
        this.disableStyleDropdown('ranged');
        this.disableStyleDropdown('magic');
        this.enableStyleDropdown(item.attackType ?? 'melee');
    }

    /**
     * Callback for when a level input is changed
     * @param {Event} event The change event for an input
     * @param {string} skillName The key of playerLevels to Change
     */
    levelInputOnChange(event: any, skillName: any) {
        const newLevel = parseInt(event.currentTarget.value);
        if (newLevel >= 1) {
            this.player.skillLevel.set(this.micsr.skillIDs[skillName], newLevel);
            // Update Spell and Prayer Button UIS, and deselect things if they become invalid
            if (skillName === 'Magic') {
                this.updateSpellOptions();
            }
            if (skillName === 'Prayer') {
                this.updatePrayerOptions();
            }
        }
        this.updateCombatStats();
    }

    /**
     * Callback for when a combat style is changed
     * @param {Event} event The change event for a dropdown
     * @param {string} combatType The key of styles to change
     */
    styleDropdownOnChange(event: any, combatType: AttackType) {
        let idx = parseInt(event.currentTarget.value);
        if (combatType === 'magic') {
            idx += 3;
        }
        if (combatType === 'ranged') {
            idx += 5;
        }
        this.player.attackStyles[combatType] = this.micsr.game.attackStyles.allObjects[idx];
        this.updateCombatStats();
    }

    relicButtonOnClick(event: any, relic: any, skill: any) {
        let relicChanged = false;

        const isMasterRelic = skill.completedAncientRelic.id === relic.id;

        const updateMasterRelic = () => {
            const button = document.getElementById(`MCS ${skill.completedAncientRelic.localID} Button`);

            if (skill.ancientRelicsFound.size === skill.ancientRelics.length) {
                if (button) {
                    this.selectButton(button);
                }
            } else {
                if (button) {
                    this.unselectButton(button);
                }
            }
        };

        if (isMasterRelic) {
            if (skill.ancientRelicsFound.size === skill.ancientRelics.length) {
                skill.ancientRelicsFound.clear();
                skill.numberOfRelicsFound = 0;

                skill.ancientRelics.forEach((relic: any) => {
                    const button = document.getElementById(`MCS ${relic.relic.localID} Button`);

                    if (button) {
                        this.unselectButton(button);
                    }
                });

                updateMasterRelic();
            } else {
                skill.ancientRelicsFound.clear();
                skill.numberOfRelicsFound = 0;

                skill.ancientRelics.forEach((relic: any) => {
                    skill.ancientRelicsFound.set(relic.relic, 1);
                    skill.numberOfRelicsFound++;

                    const button = document.getElementById(`MCS ${relic.relic.localID} Button`);

                    if (button) {
                        this.selectButton(button);
                    }
                });

                updateMasterRelic();
            }

            relicChanged = true;
        } else {
            if (skill.ancientRelicsFound.has(relic)) {
                skill.ancientRelicsFound.delete(relic);
                skill.numberOfRelicsFound--;
                this.unselectButton(event.currentTarget);
                relicChanged = true;
            } else {
                skill.ancientRelicsFound.set(relic, 1);
                skill.numberOfRelicsFound++;
                this.selectButton(event.currentTarget);
                relicChanged = true;
            }

            updateMasterRelic();
        }

        if (relicChanged) {
            this.updateCombatStats();

            setTimeout(() => {
                this.agilityCourse.updateAllAgilityTooltips();
                this.updateAstrologyTooltips();
            }, 10);
        }
    }

    cartographyHexMasteryButtonOnClick(event: any, mastery: any, map: any) {
        const bonus = map.sortedMasteryBonuses.find((bonus: any) => bonus.id === mastery.id);

        if (bonus.masteredHexes === map.masteredHexes) {
            map.masteredHexes = 0;

            map.sortedMasteryBonuses.forEach((masteryBonus: any) => {
                const button = document.getElementById(`MCS ${masteryBonus?.localID} Hexes Button`);

                if (button) {
                    masteryBonus.awarded = false;
                    this.unselectButton(button);
                }
            });
        } else {
            map.masteredHexes = bonus.masteredHexes;

            map.sortedMasteryBonuses.forEach((masteryBonus: any) => {
                const button = document.getElementById(`MCS ${masteryBonus?.localID} Hexes Button`);

                if (button) {
                    if (masteryBonus.masteredHexes <= map.masteredHexes) {
                        masteryBonus.awarded = true;
                        this.selectButton(button);
                    } else {
                        masteryBonus.awarded = false;
                        this.unselectButton(button);
                    }
                }
            });
        }

        this.micsr.game.cartography.computeProvidedStats(false);
        this.updateCombatStats();
    }

    cartographyImageButtonOnClick(event: any, poi: any) {
        const cartography = (<any>this.micsr.game).cartography;
        const map = cartography.worldMaps.getObjectByID(poi.hex.map.id);
        poi = map.pointsOfInterest.getObjectByID(poi.id);

        cartography.worldMaps.forEach((worldMap: any) => {
            const currentPoi = worldMap.playerPosition?.pointOfInterest;
            const button = document.getElementById(`MCS ${currentPoi?.localID} Button`);

            if (currentPoi && button) {
                this.unselectButton(button);
            }
        });

        const currentPoi = poi.hex.map?.playerPosition?.pointOfInterest;

        // deselect
        if (currentPoi?.localID === poi.localID) {
            const firstNonActive = map.pointsOfInterest.find((poi: any) => !poi.activeModifiers);

            if (firstNonActive) {
                map.setPlayerPosition(firstNonActive.hex);
                cartography.activeMap = map;
            }

            this.unselectButton(event.currentTarget);
        } else {
            map.setPlayerPosition(poi.hex);
            cartography.activeMap = map;
            this.selectButton(event.currentTarget);
        }

        cartography.computeProvidedStats(false);
        this.updateCombatStats();
    }

    // Callback Functions for the Prayer Select Card
    /**
     * Callback for when a prayer image button is clicked
     * @param {MouseEvent} event The onclick event for a button
     * @param {number} prayerID Index of this.micsr.prayersS
     */
    prayerButtonOnClick(event: any, prayer: ActivePrayer) {
        // Escape if prayer level is not reached
        if (
            !this.player.activePrayers.has(prayer) &&
            this.player.skillLevel.get(this.micsr.skillIDs.Prayer)! < prayer.level
        ) {
            this.micsr.imageNotify(
                this.media.prayer,
                `${this.getPrayerName(prayer)} requires level ${prayer.level} Prayer.`,
                'danger'
            );
            return;
        }
        let isCurrentUnholy = false;
        for (const prayer of this.player.activePrayers) {
            if ((<any>prayer).isUnholy) {
                isCurrentUnholy = true;
                break;
            }
        }

        if (this.player.activePrayers.size > 0 && isCurrentUnholy !== (<any>prayer).isUnholy) {
            this.micsr.imageNotify(
                isCurrentUnholy ? this.media.unholy : this.media.prayer,
                <any>prayer
                    ? 'You cannot use Unholy Prayers with Standard Prayers!'
                    : 'You cannot use Standard Prayers with Unholy Prayers!',
                'danger'
            );
            return;
        }
        if ((<any>prayer).isUnholy && (<any>this.player.modifiers).allowUnholyPrayerUse < 2) {
            this.micsr.imageNotify(
                this.media.unholy,
                "You don't have enough items equipped that allow you to use Unholy Prayers!",
                'danger'
            );
            return;
        }

        let prayerChanged = false;
        if (this.player.activePrayers.has(prayer)) {
            this.player.activePrayers.delete(prayer);
            this.unselectButton(event.currentTarget);
            prayerChanged = true;
        } else {
            if (this.player.activePrayers.size < 2) {
                this.player.activePrayers.add(prayer);
                this.selectButton(event.currentTarget);
                prayerChanged = true;
            } else {
                this.micsr.imageNotify(
                    isCurrentUnholy ? this.media.unholy : this.media.prayer,
                    'You can only have 2 prayers active at once.',
                    'danger'
                );
            }
        }

        if (prayerChanged) {
            this.updateCombatStats();
        }
    }

    /**
     * Callback for when the potion tier is changed
     * @param {Event} event The change event for a dropdown
     */
    potionTierDropDownOnChange(event: any) {
        const potionTier = parseInt(event.currentTarget.value);
        if (this.player.potion?.category === 'Herblore') {
            const recipe = this.game.herblore.actions.find(r => r.potions.includes(this.player.potion!));
            if (!recipe) {
                throw new Error('Could not find recipe.');
            }
            const newPotion = recipe.potions[potionTier];
            this.player.setPotion(newPotion);
        }
        this.updatePotionTier(potionTier);
        this.updateCombatStats();
    }

    /**
     * Callback for when a potion button is clicked
     * @param {MouseEvent} event The onclick event for a button
     * @param {HerbloreRecipe} recipe
     */
    potionImageButtonOnClick(event: any, recipe: HerbloreRecipe) {
        // Resolve recipe to the SimGame instance
        recipe = this.micsr.game.herblore.actions.getObjectByID(recipe.id)!;
        const clickedPotion = recipe.potions[this.potionTier];
        let newPotion: PotionItem | undefined = undefined;

        if (this.player.potion === clickedPotion) {
            // Deselect Potion
            newPotion = undefined;
            this.unselectButton(event.currentTarget);
        } else {
            if (this.player.potion) {
                recipe = this.micsr.game.herblore['potionToRecipeMap'].get(this.player.potion)!;
                // Change Potion
                const button = document.getElementById(
                    `MCS ${this.getPotionHtmlId(recipe) ?? this.player.potion.id} Button`
                );

                if (button) {
                    this.unselectButton(button);
                }
            }
            newPotion = clickedPotion;
            this.selectButton(event.currentTarget);
        }
        this.player.setPotion(newPotion);
        this.updateCombatStats();
    }

    /**
     * Callback for when a potion button is clicked
     * @param {MouseEvent} event The onclick event for a button
     * @param {HerbloreRecipe} recipe
     */
    otherPotionImageButtonOnClick(event: any, potion: PotionItem) {
        // Resolve recipe to the SimGame instance
        potion = this.micsr.game.items.getObjectByID(potion.id)! as PotionItem;
        let newPotion: PotionItem | undefined = undefined;

        if (this.player.potion === potion) {
            // Deselect Potion
            newPotion = undefined;
            this.unselectButton(event.currentTarget);
        } else {
            if (this.player.potion) {
                const recipe = this.micsr.game.herblore['potionToRecipeMap'].get(this.player.potion)!;
                // Change Potion
                const button = document.getElementById(
                    `MCS ${this.getPotionHtmlId(recipe) ?? this.player.potion.id} Button`
                );
                if (button) {
                    this.unselectButton(button);
                }
            }
            newPotion = potion;
            this.selectButton(event.currentTarget);
        }
        this.player.setPotion(newPotion);
        this.updateCombatStats();
    }

    // Callback Functions for the spell select buttons
    spellButtonOnClick(event: any, spell: CombatSpell, spellType: CombatSpellBook) {
        const selected = this.player.getSpellFromType(spellType);
        if (selected === spell) {
            this.disableSpell(spellType, spell);
        } else {
            this.enableSpell(spellType, spell);
        }
        // Clean up invalid configurations
        this.spellSanityCheck();
        // Update combat stats for new spell
        this.updateCombatStats();
    }

    disableSpell(spellType: CombatSpellBook, spell?: CombatSpell, message?: string) {
        // do nothing
        if (spell === undefined || this.player.getSpellFromType(spellType) !== spell) {
            return;
        }
        // unselect spell
        const button = document.getElementById(`MCS ${spell.localID} Button`);
        if (button) {
            this.unselectButton(button);
        }
        this.player.disableSpellFromType(spellType);
        // send message if required
        if (message && !this.initializing) {
            this.micsr.imageNotify(this.media.magic, message, 'danger');
        }
    }

    enableSpell(spellType: CombatSpellBook, spell: CombatSpell, message?: string) {
        // do nothing
        if (spell === undefined) {
            return;
        }
        // Escape for not meeting the level/item requirement
        if (this.player.skillLevel.get(this.micsr.skillIDs.Magic)! < spell.level) {
            this.micsr.imageNotify(this.media.magic, `${spell.name} requires level ${spell.level} Magic.`, 'danger');
            return;
        }
        if (this.checkRequiredItem(spell)) {
            this.micsr.imageNotify(this.media.magic, `${spell.name} requires ${spell.requiredItem!.name}.`, 'danger');
            return;
        }
        // remove previous selection
        this.disableSpell(spellType, this.player.getSpellFromType(spellType));
        if (spellType === 'ancient' || spellType === 'archaic') {
            this.disableSpell('standard', this.player.spellSelection.standard, 'Disabled standard magic spell.');
        }
        if (spellType === 'standard' || spellType === 'archaic') {
            this.disableSpell('ancient', this.player.spellSelection.ancient, 'Disabled ancient magick spell.');
        }
        if (spellType === 'ancient' || spellType === 'standard') {
            this.disableSpell('archaic', this.player.spellSelection.archaic, 'Disabled archaic magic spell.');
        }
        // select spell
        const button = document.getElementById(`MCS ${spell.localID} Button`);
        if (button) {
            this.selectButton(button);
        }
        this.player.setSpellFromType(spellType, spell);
        // send message if required
        if (message) {
            this.micsr.imageNotify(this.media.magic, message, 'danger');
        }
    }

    spellSanityCheck() {
        const spellSelection = this.player.spellSelection;
        // can we even use magic?
        this.player.checkMagicUsage();

        if (!this.player.canAurora) {
            this.disableSpell('aurora', spellSelection.aurora, `Disabled aurora, can't use auroras!`);
        }

        if (!this.player.canCurse) {
            this.disableSpell('curse', spellSelection.curse, `Disabled curse, can't use curses!`);
        }
        if (this.player.attackType !== 'magic') {
            this.disableSpell('ancient', spellSelection.ancient, `Disabled ancient magicks spell, can't use magic!`);
            this.disableSpell('standard', spellSelection.standard, `Disabled standard magic spell, can't use magic!`);
            this.disableSpell('archaic', spellSelection.archaic, `Disabled archaic magic spell, can't use magic!`);
            return;
        }
        // get rid of invalid spells selections
        // Object.keys(this.combatData.spells).forEach((spellType) => {
        //     if (spellSelection[spellType] === undefined) {
        //         return;
        //     }
        //     if (spellSelection[spellType] === undefined) {
        //         this.player.spellSelection[spellType] = undefined;
        //         this.micsr.imageNotify(
        //             this.media.magic,
        //             `disabled invalid ${spellType} spell ${spellSelection[spellType].id}`,
        //             "danger"
        //         );
        //     }
        // });
        // check that at least one spell is selected
        if (
            spellSelection.standard === undefined &&
            spellSelection.ancient === undefined &&
            spellSelection.archaic === undefined
        ) {
            this.enableSpell('standard', this.defaultSpell, `Enabled ${this.defaultSpell.name}.`);
        }
        // if both standard and ancient magic are selected, disable ancient magic
        if (spellSelection.standard !== undefined && spellSelection.ancient !== undefined) {
            this.disableSpell('ancient', spellSelection.ancient, `Disabled ${spellSelection.ancient.name}.`);
        }
        // if both standard and archaic magic are selected, disable archaic magic
        if (spellSelection.standard !== undefined && spellSelection.archaic !== undefined) {
            this.disableSpell('archaic', spellSelection.archaic, `Disabled ${spellSelection.archaic.name}.`);
        }
        // if ancient magic is selected, disable curses
        if (spellSelection.ancient !== undefined && spellSelection.curse !== undefined) {
            this.disableSpell('curse', spellSelection.curse, `Disabled ${spellSelection.curse.name}.`);
        }
    }

    // Callback Functions for the pet select card
    /**
     *
     * @param {MouseEvent} event
     * @param {Pet} pet
     */
    petButtonOnClick(event: any, pet: Pet) {
        const realPet = this.actualGame.pets.getObjectByID(pet.id)!;

        if (this.game.petManager['unlocked'].has(pet)) {
            this.game.petManager['unlocked'].delete(pet);
            this.game.petManager['unlocked'].delete(realPet);
            this.player.petUnlocked = this.player.petUnlocked.filter(unlockedPet => unlockedPet.id !== pet.id);
            this.unselectButton(event.currentTarget);
        } else {
            this.game.petManager['unlocked'].add(realPet);
            this.game.petManager['unlocked'].add(pet);
            this.player.petUnlocked.push(realPet);
            this.player.petUnlocked.push(pet);
            this.selectButton(event.currentTarget);
        }

        setTimeout(() => this.updateCartographyTooltips(pet), 10);
        this.updateCombatStats();
    }

    updateCartographyTooltips(pet?: Pet) {
        if (pet && pet.localID !== 'MapMasteryPet') {
            return;
        }

        const { data, maps } = this.getCartographyPointsOfInterest();

        for (const map of maps) {
            const pois = data[map.localID];

            for (const poi of pois) {
                const button = document.getElementById(`MCS ${poi.localID} Button`);

                if (button) {
                    (button as any)._tippy.setContent(this.getPointOfInterestTooltip(poi));
                    (button as any)._tippy.hide();
                }
            }
        }
    }

    /**
     * Callback for when the number of trials input is changed
     * @param {Event} event The change event for an input
     */
    numTrialsInputOnChange(event: any) {
        const newNumTrials = parseInt(event.currentTarget.value);
        if (newNumTrials > 0) {
            this.micsr.trials = newNumTrials;
        }
    }

    /**
     * Callback for when the number of ticks input is changed
     * @param {Event} event The change event for an input
     */
    maxTicksInputOnChange(event: any) {
        const maxTicks = parseInt(event.currentTarget.value);
        if (maxTicks > 0) {
            this.micsr.maxTicks = maxTicks;
        }
    }

    /**
     * Callback for when the alchemyCutoff input is changed
     * @param {Event} event The change event for an input
     */
    alchemyCutoffInputOnChange(event: any) {
        const alchemyCutoff = parseInt(event.currentTarget.value);
        this.loot.alchemyCutoff = alchemyCutoff;
        this.updatePlotForGP();
    }

    /**
     * Callback for when the plot type is changed
     * @param {Event} event The change event for a dropdown
     */
    plottypeDropdownOnChange(event: any) {
        this.plotter.plotType = event.currentTarget.value;
        this.plotter.plotID = event.currentTarget.index;
        this.simulator.selectedPlotIsTime = this.plotTypes[event.currentTarget.index].isTime;
        this.simulator.selectedPlotScales = this.plotTypes[event.currentTarget.index].scale;
        if (this.simulator.selectedPlotIsTime) {
            this.plotter.timeDropdown.parentElement.style.display = '';
        } else {
            this.plotter.timeDropdown.parentElement.style.display = 'none';
        }
        if (this.plotter.plotType === 'petChance') {
            this.plotter.petSkillDropdown.parentElement.style.display = '';
        } else {
            this.plotter.petSkillDropdown.parentElement.style.display = 'none';
        }
        this.updatePlotData();
    }

    /**
     * Callback for when the pet skill type is changed
     * @param {Event} event The change event for a dropdown
     */
    petSkillDropdownOnChange(event: any) {
        this.loot.petSkill = event.currentTarget.value;
        this.loot.updatePetChance();
        if (this.plotter.plotType === 'petChance') {
            this.updatePlotData();
        }
        document.getElementById(`MCS  Pet (%)/${this.timeShorthand[this.initialTimeUnitIndex]} Label`).textContent =
            this.loot.petSkill + ' Pet (%)/' + this.selectedTimeShorthand;
        this.updateZoneInfoCard();
    }

    /**
     * Callback for when the simulate button is clicked
     * @param {boolean} single
     */
    async simulateButtonOnClick(single: boolean) {
        if (this.simulator.simInProgress) {
            this.simulator.cancelSimulation();
            const simButton = document.getElementById('MCS Simulate All Button');
            (simButton as any).disabled = true;
            simButton.textContent = 'Cancelling...';
        }
        if (!this.simulator.simInProgress && this.simulator.simulationWorkers.length === this.simulator.maxThreads) {
            document.getElementById('MCS Simulate Selected Button').style.display = 'none';
            await this.simulator.simulateCombat(single);
        }
    }

    exportSettingButtonOnClick() {
        const settings = this.import.exportSettings();
        const data = this.import.convertObjectToJson(settings);
        this.popExport(data);
    }

    /**
     * Callback for when the sell bones option is changed
     * @param {Event} event The change event for a radio
     * @param {boolean} newState The new value for the option
     */
    sellBonesRadioOnChange(event: any, newState: any) {
        this.loot.sellBones = newState;
        this.updatePlotForGP();
    }

    /**
     * Callback for when the convert shards option is changed
     * @param {Event} event The change event for a radio
     * @param {boolean} newState The new value for the option
     */
    convertShardsRadioOnChange(event: any, newState: any) {
        this.loot.convertShards = newState;
        this.updatePlotForGP();
    }

    /**
     * Callback for when the alchHighValueItems option is changed
     * @param {Event} event The change event for a radio
     * @param {boolean} newState The new value for the option
     */
    alchHighValueItemsRadioOnChange(event: any, newState: any) {
        this.loot.alchHighValueItems = newState;
        this.updatePlotForGP();
    }

    /**
     * Callback for when the slayer task option is changed
     * @param {Event} event The change event for a radio
     * @param {boolean} newState The new value for the option
     */
    slayerTaskRadioOnChange(event: any, newState: any) {
        this.player.isSlayerTask = newState;
        this.slayerTaskSimsToggle();
    }

    slayerTaskSimsToggle() {
        // toggle dungeon sims off if slayer task is on
        if (this.player.isSlayerTask) {
            this.toggleDungeonSims(false, true);
        }
        // toggle auto slayer sims off if slayer task is off
        if (!this.player.isSlayerTask) {
            this.toggleSlayerSims(false, true);
        }
    }

    /**
     * The callback for when the time unit dropdown is changed
     * @param {Event} event The change event for a dropdown
     */
    timeUnitDropdownOnChange(event: any) {
        this.timeMultiplier = this.timeMultipliers[event.currentTarget.index];
        this.simulator.selectedPlotIsTime = this.plotTypes[this.plotter.plotID].isTime;
        this.simulator.selectedPlotScales = this.plotTypes[this.plotter.plotID].scale;
        this.selectedTime = this.timeOptions[event.currentTarget.index];
        this.selectedTimeShorthand = this.timeShorthand[event.currentTarget.index];
        // Updated Signet chance
        this.loot.updateSignetChance();
        // Update pet chance
        this.loot.updatePetChance();
        // Update zone info card time units
        for (let i = 0; i < this.plotTypes.length; i++) {
            const name = this.plotTypes[i].info;
            const value = this.plotTypes[i].value;
            let newName = '';
            if (value === 'petChance') {
                newName = this.loot.petSkill + name + this.selectedTimeShorthand;
            } else if (value === 'dropChance') {
                newName = this.getSelectedDropLabel();
            } else if (this.plotTypes[i].isTime) {
                newName = name + this.selectedTimeShorthand;
            }
            if (newName) {
                document.getElementById(`MCS ${name}h Label`).textContent = newName;
            }
        }
        // Update Plot
        this.updatePlotData();
        // Update Info Card
        this.updateZoneInfoCard();
    }

    notify(message: string, type: StandardTheme = 'success') {
        let img = this.media.combat;
        this.micsr.imageNotify(img, message, type);
    }

    popExport(data: any) {
        const error = () =>
            SwalLocale.fire({
                title: 'Clipboard API error!',
                html: `<h5 class="font-w600 font-size-sm text-combat-smoke mb-4">Manually copy the data below.</h5><textarea class="mb-1" rows="5" onclick="this.select();">${data}</textarea>`,
                showCancelButton: false,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Ok'
            });

        if ((<any>self).nw?.Clipboard.get().set) {
            try {
                (<any>self).nw?.Clipboard?.get().set(data, 'text');
            } catch {
                error();
            }
        } else {
            navigator.clipboard.writeText(data).then(
                () => this.notify('Exported to clipboard!'),
                () => error()
            );
        }
    }

    /**
     * The callback for when the export button is clicked
     */
    exportDataOnClick() {
        let data = this.dataExport.exportData();
        this.popExport(data);
    }

    barIsMonster(idx: any) {
        return this.barType[idx] === this.barTypes.monster;
    }

    barIsDungeon(idx: any) {
        return this.barType[idx] === this.barTypes.dungeon;
    }

    barIsTask(idx: any) {
        return this.barType[idx] === this.barTypes.task;
    }

    // Callback Functions for Bar inspection
    /**
     * The callback for when the inspect dungeon button is clicked
     */
    inspectDungeonOnClick() {
        if (this.barSelected && !this.barIsMonster(this.selectedBar)) {
            this.setPlotToDungeon(this.barMonsterIDs[this.selectedBar]);
        } else {
            this.micsr.logger.warn('How did you click this?');
        }
    }

    /**
     * The callback for when the stop dungeon inspection button is clicked
     */
    stopInspectOnClick() {
        this.setPlotToGeneral();
    }

    /**
     * The callback for when a plotter bar is clicked
     * @param {number} barID The id of the bar
     */
    barOnClick(barID: any) {
        if (this.barSelected) {
            if (this.selectedBar === barID) {
                this.barSelected = false;
                this.removeBarhighlight(barID);
            } else {
                this.removeBarhighlight(this.selectedBar);
                this.selectedBar = barID;
                this.setBarHighlight(barID);
            }
        } else {
            this.barSelected = true;
            this.selectedBar = barID;
            this.setBarHighlight(barID);
        }
        if (this.barSelected && !this.isViewingDungeon && !this.barIsMonster(barID) && !this.barIsTask(barID)) {
            this.plotter.inspectButton.style.display = '';
        } else {
            this.plotter.inspectButton.style.display = 'none';
        }
        this.updateZoneInfoCard();
        this.createLootOptionsCard();
    }

    /**
     * Turns on the border for a bar
     * @param {number} barID The id of the bar
     */
    setBarHighlight(barID: any) {
        if (this.plotter.bars[barID].className === 'mcsBar') {
            this.plotter.bars[barID].style.border = 'thin solid red';
        } else {
            this.plotter.bars[barID].style.border = 'thin solid blue';
        }
    }

    /**
     * Turns off the border for a bar
     * @param {number} barID The id of the bar
     */
    removeBarhighlight(barID: any) {
        this.plotter.bars[barID].style.border = 'none';
    }

    /**
     * Callback for when a monster/dungeon image below a bar is clicked
     * @param {number} imageID The id of the image that was clicked
     */
    barImageOnClick(imageID: any) {
        if (this.isViewingDungeon) {
            return;
        }
        let newState;
        if (this.barIsDungeon(imageID)) {
            newState = !this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]];
            if (newState && this.player.isSlayerTask) {
                const checkbox = document.getElementById(`MCS Slayer Task Radio No`) as HTMLInputElement;
                checkbox.checked = true;
                this.player.isSlayerTask = false;
                this.slayerToggleState = false;
                this.micsr.taskIDs.forEach((taskID: string) => {
                    this.simulator.slayerSimFilter[taskID] = false;
                });
                this.plotter.crossImagesPerSetting();
                this.notify('Slayer Task has been disabled and simulating not being on task.', 'danger');
            }
            this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]] = newState;
        } else if (this.barIsTask(imageID)) {
            const taskID = this.barMonsterIDs[imageID];
            newState = !this.simulator.slayerSimFilter[taskID];
            if (newState && !this.player.isSlayerTask) {
                const checkbox = document.getElementById(`MCS Slayer Task Radio Yes`) as HTMLInputElement;
                checkbox.checked = true;
                this.player.isSlayerTask = true;
                this.dungeonToggleState = false;
                this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                    this.simulator.dungeonSimFilter[dungeonID] = false;
                });
                this.plotter.crossImagesPerSetting();
                this.notify('Slayer Task has been enabled and simulating as being on task.', 'success');
            }
            this.simulator.slayerSimFilter[taskID] = newState;
        } else {
            this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]] =
                !this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]];
            newState = this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]];
        }
        // UI Changes
        if (newState) {
            // Uncross
            this.plotter.unCrossOutBarImage(imageID);
        } else {
            // Crossout
            this.plotter.crossOutBarImage(imageID);
            if (this.selectedBar === imageID) {
                this.barSelected = false;
                this.removeBarhighlight(imageID);
            }
        }
        this.updatePlotData();
    }

    /**
     * Callback to toggle the simulation of dungeons
     */
    toggleDungeonSims(newState: any, silent: any) {
        if (newState && this.player.isSlayerTask) {
            const checkbox = document.getElementById(`MCS Slayer Task Radio No`) as HTMLInputElement;
            checkbox.checked = true;
            this.player.isSlayerTask = !newState;
            this.slayerToggleState = !newState;

            this.micsr.taskIDs.forEach((taskID: string) => {
                this.simulator.slayerSimFilter[taskID] = !newState;
            });
            this.notify('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.dungeonToggleState = newState;
        this.micsr.dungeonIDs.forEach((dungeonID: any) => {
            this.simulator.dungeonSimFilter[dungeonID] = newState;
        });
        this.updatePlotData();
        this.plotter.crossImagesPerSetting();
    }

    /**
     * Callback to toggle the simulation of dungeons
     */
    toggleSlayerSims(newState: any, silent: any) {
        if (newState && !this.player.isSlayerTask) {
            const checkbox = document.getElementById(`MCS Slayer Task Radio Yes`) as HTMLInputElement;
            checkbox.checked = true;
            this.player.isSlayerTask = newState;
            this.dungeonToggleState = !newState;
            this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                this.simulator.dungeonSimFilter[dungeonID] = !newState;
            });
            this.notify('Slayer Task has been enabled and simulating as being on task.', 'success');
        } else if (!newState && this.player.isSlayerTask) {
            const checkbox = document.getElementById(`MCS Slayer Task Radio No`) as HTMLInputElement;
            checkbox.checked = true;
            this.player.isSlayerTask = newState;
            this.notify('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.slayerToggleState = newState;
        this.micsr.taskIDs.forEach((taskID: string) => {
            this.simulator.slayerSimFilter[taskID] = newState;
        });
        this.updatePlotData();
        this.plotter.crossImagesPerSetting();
    }

    /**
     * Callback to toggle the simulation of monsters in combat and slayer areas
     */
    toggleMonsterSims() {
        const newState = !this.monsterToggleState;
        this.monsterToggleState = newState;
        // Set all non-dungeon monsters to newState
        this.micsr.monsterIDs.forEach((monsterID: any) => {
            this.simulator.monsterSimFilter[monsterID] = newState;
        });
        this.updatePlotData();
        this.plotter.crossImagesPerSetting();
    }

    /**
     * Updates the bars in the plot to the currently selected plot type
     */
    updatePlotData() {
        this.plotter.updateBarData(this.simulator.getDataSet(this.plotter.plotType), this.simulator.getRawData());
    }

    getSimFailureText(data: any) {
        const prefix = 'No valid simulation data';
        if (data.reason) {
            if (data.tickCount >= this.micsr.maxTicks * this.micsr.trials) {
                return `Insufficient simulation time: ${data.reason}.`;
            }
            return `${prefix}: ${data.reason}.`;
        }
        if (!data.simSuccess) {
            return `${prefix}: unknown simulation error.`;
        }
        return '';
    }

    setZoneInfoCard(title: any, media: any, data: any, combatStyle?: AttackType | 'random', monsterData?: any) {
        document.getElementById('MCS Zone Info Title').textContent = `${title}`;
        (document.getElementById('MCS Info Image') as any).src = media;

        if (combatStyle) {
            const icon = MonsterSelectTableElement.attackTypeMedia[combatStyle];
            const img = <HTMLImageElement>document.getElementById('mcs-combat-style-info');
            img.src = icon;
            img.style.display = 'block';
        } else {
            const img = <HTMLImageElement>document.getElementById('mcs-combat-style-info');
            img.style.display = 'none';
        }

        this.failureLabel.textContent = this.getSimFailureText(data);
        const updateInfo = data.simSuccess;
        for (let i = 0; i < this.plotTypes.length; i++) {
            const dataKey = this.plotTypes[i].value;
            const outElem = document.getElementById(`MCS ${dataKey} Output`);
            outElem.textContent =
                updateInfo && !isNaN(data[dataKey])
                    ? Util.mcsFormatNum(this.simulator.getValue(true, data, dataKey, this.plotTypes[i].scale), 4)
                    : 'N/A';
        }

        let isNearDeath = data.highestDamageTaken >= data.lowestHitpoints;

        if (monsterData) {
            const monsters = monsterData.map((monster: Monster) => {
                const id = this.simulator.simID(monster.id);
                return this.simulator.monsterSimData[id];
            });

            isNearDeath = monsters.some((data: ISimData) => data.highestDamageTaken >= data.lowestHitpoints);
        }

        if (data.highestReflectDamageTaken >= this.player.stats.maxHitpoints) {
            document.getElementById('MCS highestReflectDamageTaken Output').style.color = 'orange';
        } else {
            document.getElementById('MCS highestReflectDamageTaken Output').style.color = '';
        }

        if (isNearDeath) {
            document.getElementById('MCS highestDamageTaken Output').style.color = 'orange';
            document.getElementById('MCS lowestHitpoints Output').style.color = 'orange';
        } else {
            document.getElementById('MCS highestDamageTaken Output').style.color = '';
            document.getElementById('MCS lowestHitpoints Output').style.color = '';
        }

        if (data.deathRate > 0) {
            document.getElementById('MCS deathRate Output').style.color = 'red';
        } else {
            document.getElementById('MCS deathRate Output').style.color = '';
        }

        this.setDropsTooltip();
        this.setDeathRateTooltip(data.deathRate, data.killTimeS);
        this.setRuneTooltip(data.usedRunesBreakdown, data.killTimeS);
        this.setPrayerTooltip(data.prayerXpPerSecond, data.ppConsumedPerSecond);
    }

    setDeathRateTooltip(deathRate: any, killTimeS: any) {
        let dataMultiplier = this.timeMultiplier;
        if (dataMultiplier === -1) {
            dataMultiplier = killTimeS;
        }
        let tooltip = `<span>${Math.floor((deathRate / killTimeS) * dataMultiplier * 10000) / 10000} Est. Deaths/${
            this.selectedTimeShorthand
        }</span><br/>`;
        tooltip = `<div className="text-center">${tooltip}</div>`;
        this.setTooltipById(`MCS deathRate Output`, tooltip);
    }

    setTooltipById(id: string, tooltip: string) {
        this.setTooltip(document.getElementById(id), tooltip);
    }

    setTooltip(element: HTMLElement | null, tooltip: string) {
        element._tippy.setContent(tooltip);
        element._tippy.disable();
        element._tippy.enable();
    }

    setDropsTooltip() {
        this.setTooltipById(
            `MCS dropChance Output`,
            this.combatData.dropSelected === 'micsr:none'
                ? 'Kills multiplied by doubling chance. (includes chance to receive no drops)'
                : 'Drop chance for selected item.'
        );
    }

    setPrayerTooltip(prayerXpPerSecond: any, ppConsumedPerSecond: any) {
        let xpPerPP = prayerXpPerSecond / ppConsumedPerSecond;
        if (prayerXpPerSecond === 0) {
            xpPerPP = 0;
        }
        let tooltip = `<span>${xpPerPP.toFixed(3)} Prayer XP/Point</span><br/>`;
        tooltip = `<div className="text-center">${tooltip}</div>`;
        this.setTooltipById(`MCS prayerXpPerSecond Output`, tooltip);
    }

    setRuneTooltip(runesUsed: { [index: string]: number }, killTimeS: number) {
        let dataMultiplier = this.timeMultiplier;
        if (dataMultiplier === -1) {
            dataMultiplier = killTimeS;
        }
        let tooltip = '';
        for (const id in runesUsed) {
            const rune = this.game.items.getObjectByID(id)!;
            tooltip += `<img class="skill-icon-xs" src="${rune.media}"><span>${(runesUsed[id] * dataMultiplier).toFixed(
                2
            )}</span><br/>`;
        }
        if (tooltip.length > 0) {
            tooltip = `<div className="text-center">Runes / ${this.selectedTime}<br/>${tooltip}</div>`;
            this.setTooltipById(`MCS runesUsedPerSecond Output`, tooltip);
        } else {
            this.setTooltipById(`MCS runesUsedPerSecond Output`, `No runes used.`);
        }
    }

    /**
     * Updates the zone info card text fields
     */
    updateZoneInfoCard() {
        const data = this.getZoneInfoCardData();

        if (data) {
            this.subInfoCard.container.style.display = '';
            this.infoPlaceholder.style.display = 'none';

            this.setZoneInfoCard(data.title, data.media, data.data, data.combatStyle, data.monsters);
        } else {
            document.getElementById('MCS Zone Info Title').textContent = 'Monster/Dungeon Info.';
            this.subInfoCard.container.style.display = 'none';
            this.infoPlaceholder.style.display = '';
        }
    }

    getZoneInfoCardData() {
        if (!this.barSelected) {
            return;
        }

        if (!this.isViewingDungeon && this.barIsDungeon(this.selectedBar)) {
            const dungeonID = this.barMonsterIDs[this.selectedBar];

            return {
                title: this.getDungeonName(dungeonID),
                media: this.micsr.dungeons.getObjectByID(dungeonID)!.media,
                data: this.simulator.dungeonSimData[dungeonID]
            };
        } else if (!this.isViewingDungeon && this.barIsTask(this.selectedBar)) {
            const taskID = this.barMonsterIDs[this.selectedBar];

            return {
                title: taskID,
                media: this.micsr.game.slayer.media,
                data: this.simulator.slayerSimData[taskID],
                monsters: this.simulator.slayerTaskMonsters[taskID]
            };
        } else {
            let monsterID;
            let dungeonID;

            if (this.isViewingDungeon) {
                dungeonID = this.viewedDungeonID!;
                monsterID = this.getSelectedDungeonMonsterID();
            } else {
                monsterID = this.barMonsterIDs[this.selectedBar];
            }

            const monster = this.micsr.monsters.getObjectByID(monsterID)!;

            return {
                title: this.getMonsterName(monsterID),
                media: monster.media,
                combatStyle: <AttackType | 'random'>monster.attackType,
                data: this.simulator.monsterSimData[
                    this.simulator.simID(
                        monsterID,
                        // @ts-ignore
                        dungeonID >= this.micsr.dungeonCount ? undefined : dungeonID
                    )
                ]
            };
        }
    }

    getSelectedDungeonMonsterID() {
        const monsters = this.getMonsterList(this.viewedDungeonID);
        return monsters[this.selectedBar + monsters.length - this.plotter.bars.length].id;
    }

    /**
     * get list of monsters for dungeon (or slayer task, where task IDs start at this.micsr.dungeonCount)
     */
    getMonsterList(dungeonID: any): Monster[] {
        if (this.micsr.isDungeonID(dungeonID)) {
            return this.micsr.dungeons.getObjectByID(this.viewedDungeonID!)!.monsters;
        }
        return this.simulator.slayerTaskMonsters[dungeonID];
    }

    // Functions that manipulate the UI
    /**
     * Toggles the display of a style dropdown, and the spell selection dropdown off
     * @param {string} combatType The combat type to disable
     */
    disableStyleDropdown(combatType: any) {
        document.getElementById(`MCS ${combatType} Style Dropdown`).style.display = 'none';
    }

    /**
     * Toggles the display of a style dropdown, and the spell selection dropdown on
     * @param {string} combatType The combat type to enable
     */
    enableStyleDropdown(combatType: any) {
        document.getElementById(`MCS ${combatType} Style Dropdown`).style.display = 'inline';
    }

    runAsync(callback: Function) {
        // run during micro tasks
        return new Promise<void>(resolve => {
            // move it to the next call stack in 10ms
            setTimeout(() => {
                callback();
                resolve();
            }, 10);
        });
    }

    /**
     * Updates the list of options in the spell menus, based on if the player can use it
     */
    updateSpellOptions() {
        this.player['computeAttackType']();
        this.player.checkMagicUsage();
        this.checkForSpellLevel();
        this.checkForSpellItem();
        this.spellSanityCheck();
    }

    /**
     * Checks if magic level required for spell is met
     */
    checkForSpellLevel() {
        const magicLevel = this.player.skillLevel.get(this.micsr.skillIDs.Magic)!;

        const setSpellsPerLevel = (spell: CombatSpell, spellType: CombatSpellBook) => {
            const id = `MCS ${spell.localID} Button Image`;
            const elt = document.getElementById(id);
            if (magicLevel < spell.level) {
                (elt as any).src = this.media.question;
                this.disableSpell(
                    spellType,
                    spell,
                    `${spell.name} has been de-selected. It requires level ${spell.level} Magic.`
                );
            } else {
                (elt as any).src = spell.media;
            }
        };
        this.micsr.standardSpells.forEach(spell => setSpellsPerLevel(spell, 'standard'));
        this.micsr.auroraSpells.forEach(spell => setSpellsPerLevel(spell, 'aurora'));
        this.micsr.curseSpells.forEach(spell => setSpellsPerLevel(spell, 'curse'));
        this.micsr.ancientSpells.forEach(spell => setSpellsPerLevel(spell, 'ancient'));
        this.micsr.archaicSpells.forEach(spell => setSpellsPerLevel(spell, 'archaic'));
    }

    checkRequiredItem(spell: CombatSpell) {
        return (
            spell.requiredItem !== undefined &&
            !this.player.equipment.slotArray.map((x: any) => x.item.id).includes(spell.requiredItem.id)
        );
    }

    /**
     * Checks if item required for spell is equipped
     */
    checkForSpellItem() {
        const disableSpellsForItem = (spell: CombatSpell, spellType: CombatSpellBook) => {
            if (this.checkRequiredItem(spell)) {
                (document.getElementById(`MCS ${spell.localID} Button Image`) as any).src = this.media.question;
                this.disableSpell(
                    spellType,
                    spell,
                    `${spell.name} has been de-selected. It requires ${spell.requiredItem?.name}.`
                );
            }
        };
        this.micsr.standardSpells.forEach(spell => disableSpellsForItem(spell, 'standard'));
        this.micsr.auroraSpells.forEach(spell => disableSpellsForItem(spell, 'aurora'));
        this.micsr.curseSpells.forEach(spell => disableSpellsForItem(spell, 'curse'));
        this.micsr.ancientSpells.forEach(spell => disableSpellsForItem(spell, 'ancient'));
        this.micsr.archaicSpells.forEach(spell => disableSpellsForItem(spell, 'archaic'));
    }

    /**
     * Updates the prayers that display in the prayer selection card, based on if the player can use it
     */
    updatePrayerOptions() {
        const prayerLevel = this.player.skillLevel.get(this.micsr.skillIDs.Prayer)!;

        this.micsr.prayers.forEach((prayer: any) => {
            const prayerName = this.getPrayerName(prayer);
            if (prayer.prayerLevel > prayerLevel) {
                (document.getElementById(`MCS ${prayerName} Button Image`) as any).src = this.media.question;
                if (this.player.activePrayers.has(prayer.id)) {
                    this.prayerButtonOnClick(
                        {
                            currentTarget: document.getElementById(`MCS ${prayerName} Button`)
                        },
                        prayer.id
                    );
                    this.micsr.imageNotify(
                        this.media.prayer,
                        `${prayerName} has been de-selected. It requires level ${prayer.prayerLevel} Prayer.`,
                        'danger'
                    );
                }
            } else {
                (document.getElementById(`MCS ${prayerName} Button Image`) as any).src = prayer.media;
            }
        });
    }

    /**
     * Updates the text fields for the computed combat stats
     */
    updateCombatStats() {
        // debugger;
        // first update the values
        // needed so ancient relics update
        this.player.computeAllStats();

        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            (<any>this.game).cartography.computeProvidedStats(false);
        }

        this.game.astrology.computeProvidedStats(false);

        this.combatData.updateCombatStats();
        // second update the view
        this.combatStatKeys.forEach((key: any) => {
            switch (key) {
                case 'attackSpeed':
                    const attackSpeed = this.combatData.playerAttackSpeed();
                    document.getElementById(`MCS ${key} CS Output`)!.textContent = attackSpeed.toLocaleString();
                    break;
                case 'summoningInterval':
                    const summonInterval = (<any>this.game.combat.player).summonAttackInterval;
                    document.getElementById(`MCS ${key} CS Output`)!.textContent = summonInterval.toString();
                    break;
                case 'respawnInterval':
                    const respawnTime = this.game.combat.player.getMonsterSpawnTime();
                    document.getElementById(`MCS ${key} CS Output`)!.textContent = respawnTime.toString();
                    break;
                default:
                    document.getElementById(`MCS ${key} CS Output`)!.textContent = (<any>this.combatData.combatStats)[
                        key
                    ].toLocaleString();
            }
        });
        this.setSummoningSynergyText();
        this.consumables.updateView();
    }

    /**
     * Updates the simulator display for when a gp option is changed
     */
    updatePlotForGP() {
        this.loot.updateGPData();
        if (this.plotter.plotType === 'gpPerSecond') {
            this.updatePlotData();
        }
        this.updateZoneInfoCard();
    }

    /**
     * Updates the simulator display for when a loot option is changed
     */
    updatePlotForLoot() {
        const elt = document.getElementById('MCS Drops/h Label');
        if (elt === null) {
            this.micsr.logger.error('Could not find element with id "MCS Drops/h Label".');
            return;
        }
        elt.textContent = this.getSelectedDropLabel();
        this.loot.updateDropChance();
        this.consumables.update();
        if (this.plotter.plotType === 'dropChance') {
            this.updatePlotData();
        }
        this.updateZoneInfoCard();
    }

    /**
     * Updates the images and tooltips for potions when the potion tier is changed
     * @param {number} potionTier The new potion tier
     */
    updatePotionTier(potionTier: number) {
        this.potionTier = potionTier;
        (<any>document.getElementById('MCS Potion Tier Dropdown')).selectOption(potionTier);
        this.combatPotionRecipes.forEach((recipe: HerbloreRecipe) => {
            const potion = recipe.potions[potionTier];
            const img = document.getElementById(`MCS ${this.getPotionHtmlId(recipe)} Button Image`) as HTMLImageElement;
            img.src = potion.media;
            this.setTooltip(img.parentElement, this.getPotionTooltip(recipe.potions[this.potionTier]));
        });
    }

    /**
     * Gets the content for the tooltip of a potion
     * @param recipe
     * @returns {string} The tooltip content
     */
    getPotionTooltip(potion: PotionItem) {
        return (
            `<div class="text-center">${potion.name}<small>` +
            `<br><span class='text-info'>${potion.description.replace(/\.$/, '')}</span>` +
            `<br></small></div>`
        );
    }

    // Functions for dungeon display
    /**
     * Changes the simulator to display an individual dungeon
     * @param {number} dungeonID the index of the dungeon in this.micsr.dungeons
     */
    setPlotToDungeon(dungeonID: any) {
        this.isViewingDungeon = true;
        this.viewedDungeonID = dungeonID;
        this.loot.update();
        this.updatePlotData();
        // Undo bar selection if needed
        if (this.barSelected) {
            this.barSelected = false;
            this.removeBarhighlight(this.selectedBar);
        }
        this.updateZoneInfoCard();
        this.plotter.displayDungeon(dungeonID);
    }

    /**
     * Changes the simulator to display non-dungeon monsters and dungeon summary results
     */
    setPlotToGeneral() {
        this.isViewingDungeon = false;
        this.loot.update();
        if (this.barSelected) {
            this.removeBarhighlight(this.selectedBar);
        }
        this.barSelected = true;
        const barID = this.dungeonBarIDs[this.viewedDungeonID!];
        this.selectedBar = barID;
        this.setBarHighlight(barID);
        this.plotter.inspectButton.style.display = '';
        this.updatePlotData();
        this.updateZoneInfoCard();
        this.plotter.displayGeneral();
    }

    // Data Sanitizing Functions
    /**
     * Removes HTML from the dungeon name
     * @param {number} dungeonID The index of Dungeons
     * @return {string} The name of a dungeon
     */
    getDungeonName(dungeonID: any) {
        let name = undefined;
        if (this.micsr.dungeons.getObjectByID(dungeonID)) {
            name = this.micsr.dungeons.getObjectByID(dungeonID)!.name;
        } else if (dungeonID && dungeonID.name) {
            name = dungeonID.name;
        }
        if (name === undefined) {
            this.micsr.logger.error(`Unknown dungeon in getDungeonName ${dungeonID}`);
            return 'Unknown Dungeon';
        }
        return this.replaceApostrophe(name);
    }

    /**
     * Removes HTML from the potion name
     * @param {PotionItem} potion The potion
     * @return {string} The name of a potion
     */
    getPotionHtmlId(recipe: HerbloreRecipe) {
        return recipe?.id;
    }

    /**
     * Removes HTML from a prayer name
     * @param {number} prayerID The index of this.micsr.prayers
     * @return {string} the name of a prayer
     */
    getPrayerName(prayer: ActivePrayer) {
        return this.replaceApostrophe(prayer.name);
    }

    /**
     * Removes HTML from a monster name
     * @param {number} monsterID The index of this.micsr.monsters
     * @return {string} the name of a monster
     */
    getMonsterName(monsterID: any) {
        const monster = this.micsr.monsters.getObjectByID(monsterID)!;
        const name = monster.name;
        if (name === undefined) {
            this.micsr.logger.error(`Unknown monster in getMonsterName ${monsterID}`);
            return 'Unknown Monster';
        }
        return this.replaceApostrophe(name);
    }

    /**
     * Replaces &apos; with an actual ' character
     * @param {string} stringToFix The string to replace
     * @return {string} the fixed string
     */
    replaceApostrophe(stringToFix: string) {
        return stringToFix.replace(/&apos;/g, "'");
    }

    /** Updates the display post simulation */
    updateDisplayPostSim() {
        this.createLootOptionsCard(); // update in case slayer task monsters changed
        this.updatePlotData();

        if (this.isViewingDungeon) {
            let bar = this.selectedBar;
            let selected = this.barSelected;
            this.setPlotToGeneral();
            this.setPlotToDungeon(this.barMonsterIDs[this.selectedBar]);
            this.barSelected = selected;
            this.selectedBar = bar;
            this.setBarHighlight(bar);
        }

        this.updateZoneInfoCard();
        (document.getElementById('MCS Simulate All Button') as any).disabled = false;
        document.getElementById('MCS Simulate All Button').textContent = 'Simulate All';
        document.getElementById('MCS Simulate Selected Button').style.display = 'block';
    }

    destroy() {
        // terminate any workers
        this.simulator.simulationWorkers.forEach((worker: any) => worker.worker.terminate());
        // remove all tool tips
        this.tippySingleton.destroy();
        this.tippyInstances.forEach((instance: any) => instance.destroy());
        this.tippyNoSingletonInstances.forEach((instance: any) => instance.destroy());
    }
}

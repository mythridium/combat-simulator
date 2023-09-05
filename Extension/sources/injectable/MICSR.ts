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

type PackageTypes = "Demo" | "Full" | "TotH" | "AoD";

type IDataPackage = {
    [packageName in PackageTypes]?: any;
};

class MICSR {
    wrongVersion: boolean;
    isDev: boolean;
    isVerbose: boolean;
    name: string;
    shortName: string;
    gameVersion: string;
    version: string;
    majorVersion: number;
    minorVersion: number;
    patchVersion: number;
    preReleaseVersion?: string;

    dataPackage: IDataPackage;
    trials: number;
    maxTicks: number;
    DATA_VERSION: number;
    currentSaveVersion: number;
    equipmentSlotData: EquipmentObject<SlotData>;
    slayerTaskData: SlayerTaskData[];
    taskIDs: string[];
    imageNotify: (
        media: string,
        message: string,
        messageTheme?: StandardTheme
    ) => void;
    actualGame!: Game;
    game!: SimGame;
    namespace!: DataNamespace;
    gamemodes!: Gamemode[];
    emptyItem!: EquipmentItem;
    skillIDs!: { [index: string]: string };
    skillNames!: string[];
    pets!: NamespaceRegistry<Pet>;
    dungeons!: NamespaceRegistry<Dungeon>;
    dungeonIDs!: any[];
    dungeonCount!: number;
    bardID!: string;
    monsters!: NamespaceRegistry<Monster>;
    monsterList!: Monster[];
    combatAreas!: NamespaceRegistry<CombatArea>;
    slayerAreas!: NamespaceRegistry<SlayerArea>;
    monsterIDs!: any[];
    herblorePotionRecipes!: NamespaceRegistry<HerbloreRecipe>;
    items!: ItemRegistry;
    standardSpells!: NamespaceRegistry<StandardSpell>;
    curseSpells!: NamespaceRegistry<CurseSpell>;
    auroraSpells!: NamespaceRegistry<AuroraSpell>;
    ancientSpells!: NamespaceRegistry<AncientSpell>;
    archaicSpells!: NamespaceRegistry<ArchaicSpell>;
    prayers!: NamespaceRegistry<ActivePrayer>;
    attackStylesIdx: any;
    skillNamesLC!: { [index: string]: string };
    showModifiersInstance!: ShowModifiers;
    bannedSkills: string[];

    constructor(isDev = false) {
        this.isDev = isDev;
        this.isVerbose = false;
        this.wrongVersion = false;
        // combat sim name
        this.name = "[Myth] Combat Simulator";
        this.shortName = "Combat Simulator";

        // compatible game version
        this.gameVersion = "v1.2";

        // combat sim version
        this.majorVersion = 2;
        this.minorVersion = 1;
        this.patchVersion = 0;
        this.preReleaseVersion = undefined;
        this.version = `v${this.majorVersion}.${this.minorVersion}.${this.patchVersion}`;
        if (this.preReleaseVersion !== undefined) {
            this.version = `${this.version}-${this.preReleaseVersion}`;
        }

        // simulation settings
        this.trials = 1e3;
        this.maxTicks = 1e3;
        this.DATA_VERSION = DATA_VERSION;
        this.currentSaveVersion = currentSaveVersion;
        this.equipmentSlotData = equipmentSlotData;
        this.slayerTaskData = SlayerTask.data;
        this.taskIDs = this.slayerTaskData.map((task) => task.display);
        this.imageNotify = imageNotify;

        this.dataPackage = {
            // Demo: {},
            // Full: {},
            // TotH: {}
        };

        this.bannedSkills = [
            "Woodcutting",
            "Firemaking",
            "Fishing",
            "Mining",
            "Cooking",
            "Smithing",
            "Farming",
            // "Summoning", // Need for summoning xp calculation
            "Thieving",
            "Fletching",
            "Crafting",
            "Runecrafting",
            // "Herblore", // Need for potion recipe lookup
            // "Agility",
            // "Astrology",
            "Township",
            //"Archaeology",
            //"Cartography"
        ];
    }

    tryLoad() {
        this.wrongVersion = gameVersion !== this.gameVersion;
        if (
            this.wrongVersion &&
            gameVersion !== localStorage.getItem("MICSR-gameVersion")
        ) {
            return window.confirm(
                `${this.name} ${this.version}\n` +
                    `A different game version was detected (expected: ${this.gameVersion}).\n` +
                    `Loading the combat sim may cause unexpected behaviour.\n` +
                    `After a successful load, this popup will be skipped for Melvor ${gameVersion}\n` +
                    `Try loading the simulator?`
            );
        }
        return true;
    }

    async fetchData() {
        await this.fetchDataPackage(
            "Demo",
            `/assets/data/melvorDemo.json?${this.DATA_VERSION}`
        );
        if (cloudManager.hasFullVersionEntitlement) {
            await this.fetchDataPackage(
                "Full",
                `/assets/data/melvorFull.json?${this.DATA_VERSION}`
            );
        }
        if (cloudManager.hasTotHEntitlement) {
            await this.fetchDataPackage(
                "TotH",
                `/assets/data/melvorTotH.json?${this.DATA_VERSION}`
            );
        }
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            await this.fetchDataPackage(
                "AoD",
                `/assets/data/melvorExpansion2.json?${this.DATA_VERSION}`
            );
        }
    }

    async initialize(game: SimGame, actualGame: Game) {
        game.registerDataPackage(this.dataPackage["Demo"]);
        if (cloudManager.hasFullVersionEntitlement) {
            game.registerDataPackage(this.dataPackage["Full"]);
        }
        if (cloudManager.hasTotHEntitlement) {
            game.registerDataPackage(this.dataPackage["TotH"]);
        }
        // @ts-ignore
        if (cloudManager.hasAoDEntitlement) {
            game.registerDataPackage(this.dataPackage["AoD"]);
        }
        game.postDataRegistration();
        this.setupGame(game, actualGame);
        this.showModifiersInstance = new ShowModifiers(
            this,
            "",
            "MICSR",
            false /* TODO */
        );
    }

    versionCheck(
        exact: any,
        major: any,
        minor: any,
        patch: any,
        prerelease: any
    ) {
        // check exact version match
        if (
            major === this.majorVersion &&
            minor === this.minorVersion &&
            patch === this.patchVersion &&
            prerelease === this.preReleaseVersion
        ) {
            return true;
        }
        if (exact) {
            // exact match is required
            return false;
        }
        // check minimal version match
        if (major !== this.majorVersion) {
            return major < this.majorVersion;
        }
        if (minor !== this.minorVersion) {
            return minor < this.minorVersion;
        }
        if (patch !== this.patchVersion) {
            return patch < this.patchVersion;
        }
        if (this.preReleaseVersion !== undefined) {
            if (prerelease === undefined) {
                // requires release version
                return false;
            }
            return prerelease < this.preReleaseVersion;
        }
        // this is release version, and either pre-release or release is required, so we're good
        return true;
    }

    async fetchDataPackage(id: PackageTypes, url: string) {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const response = await fetch(url, {
            method: "GET",
            headers,
        });
        if (!response.ok)
            throw new Error(`Could not fetch data package with URL: ${url}`);
        this.dataPackage[id] = await response.json();
        // this.cleanupDataPackage(id);
    }

    cleanupDataPackage(id: PackageTypes) {
        this.dataPackage[id].data.lore = undefined;
        this.dataPackage[id].data.tutorialStages = undefined;
        this.dataPackage[id].data.tutorialStageOrder = undefined;
        this.dataPackage[id].data.steamAchievements = undefined;
        this.dataPackage[id].data.shopDisplayOrder = undefined;
        this.dataPackage[id].data.shopUpgradeChains = undefined;
        this.dataPackage[id].modifications = undefined;

        this.dataPackage[id].data.shopPurchases.forEach(
            (x: any) => (x.purchaseRequirements = [])
        );

        let skillData: {
            skillID: string;
            data: {
                altSpells?: any[];
            };
        }[] = this.dataPackage[id].data.skillData;
        skillData = skillData.filter(
            (skill) =>
                !this.bannedSkills
                    .map((bannedSkill: string) => `melvorD:${bannedSkill}`)
                    .includes(skill.skillID)
        );
        skillData = skillData.filter(
            (skill) =>
                !this.bannedSkills
                    .map((bannedSkill: string) => `melvorAoD:${bannedSkill}`)
                    .includes(skill.skillID)
        );
        const magicSkillData = skillData.find(
            (skill) => skill.skillID === "melvorD:Magic"
        );
        if (magicSkillData) {
            magicSkillData.data.altSpells = [];
        }
        this.dataPackage[id].data.skillData = skillData;
    }

    // any setup that requires a game object
    setupGame(game: SimGame, actualGame: Game) {
        this.actualGame = actualGame;
        this.game = game;
        let namespace = this.game.registeredNamespaces.getNamespace("micsr");
        if (namespace === undefined) {
            namespace = this.game.registeredNamespaces.registerNamespace(
                "micsr",
                "Combat Simulator",
                true
            );
        }
        this.namespace = namespace;
        //gamemodes
        this.gamemodes = this.game.gamemodes.allObjects.filter(
            (x: any) => x.id !== "melvorD:Unset"
        );

        // empty items
        this.emptyItem = this.game.emptyEquipmentItem;

        // skill IDs
        this.skillIDs = {};
        this.skillNames = [];
        this.skillNamesLC = {};
        this.game.skills.allObjects.forEach((x, i) => {
            this.skillIDs[x.localID] = x.id;
            this.skillNames.push(x.localID);
            this.skillNamesLC[x.id] = x.localID.toLowerCase();
        });
        // pets array
        this.pets = this.game.pets;
        // dg array
        this.dungeons = this.game.dungeons;
        this.dungeonIDs = this.dungeons.allObjects.map(
            (dungeon: any) => dungeon.id
        );
        this.dungeonCount = this.dungeonIDs.length;

        // TODO filter special dungeons
        //  this.dungeons = this.dungeons.filter((dungeon) => dungeon.id !== Dungeons.Impending_Darkness);
        // TODO filter special monsters
        //  this.dungeons[Dungeons.Into_the_Mist].monsters = [147, 148, 149];
        // monsters
        this.bardID = "melvorF:WanderingBard";
        this.monsters = this.game.monsters;
        this.monsterList = this.game.monsters.allObjects;
        this.combatAreas = this.game.combatAreas;
        this.slayerAreas = this.game.slayerAreas;
        this.monsterIDs = [
            ...this.combatAreas.allObjects
                .map((area: any) =>
                    area.monsters.map((monster: any) => monster.id)
                )
                .reduce((a: any, b: any) => a.concat(b), []),
            this.bardID,
            ...this.slayerAreas.allObjects
                .map((area: any) =>
                    area.monsters.map((monster: any) => monster.id)
                )
                .reduce((a: any, b: any) => a.concat(b), []),
        ];
        // potions
        this.herblorePotionRecipes = this.game.herblore.actions;
        // items
        this.items = this.game.items;
        // spells
        this.standardSpells = this.game.standardSpells;
        this.curseSpells = this.game.curseSpells;
        this.auroraSpells = this.game.auroraSpells;
        this.ancientSpells = this.game.ancientSpells;
        this.archaicSpells = this.game.archaicSpells;
        // prayers
        this.prayers = this.game.prayers;
        // attackStyles
        this.attackStylesIdx = {};
        const attackStyleGrouping: {[index: string]: number} = {};
        this.game.attackStyles.allObjects.forEach((a, i) => {
            let index = attackStyleGrouping[a.attackType];
            if(!index){
                index = 0;
            }
            this.attackStylesIdx[a.id] = index;
            attackStyleGrouping[a.attackType] = index + 1;
        });
    }

    isDungeonID(id?: string) {
        if (!id) {
            return false;
        }
        return this.dungeons?.getObjectByID(id) !== undefined;
    }

    /////////////
    // logging //
    /////////////
    debug(...args: any[]) {
        console.debug("MICSR:", ...args);
    }
    log(...args: any[]) {
        console.log("MICSR:", ...args);
    }
    logVerbose(...args: any[]) {
        if (this.isVerbose) {
            console.log("MICSR:", ...args);
        }
    }
    warn(...args: any[]) {
        console.warn("MICSR:", ...args);
    }
    error(...args: any[]) {
        console.error("MICSR:", ...args);
    }
}

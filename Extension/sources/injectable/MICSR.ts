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

    ancientRelicSkillKeys = [
        "Attack",
        "Strength",
        "Defence",
        "Hitpoints",
        "Ranged",
        "Magic",
        "Prayer",
        "Slayer",
        'Firemaking',
        'Cooking',
        'Smithing',
        "Agility",
        "Astrology"
    ];

    constructor(isDev = false) {
        this.isDev = isDev;
        this.isVerbose = false;
        this.wrongVersion = false;
        // combat sim name
        this.name = "[Myth] Combat Simulator";
        this.shortName = "Combat Simulator";

        // compatible game version
        this.gameVersion = "v1.2.1";

        // combat sim version
        this.majorVersion = 2;
        this.minorVersion = 2;
        this.patchVersion = 2;
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
            //"Firemaking",
            "Fishing",
            "Mining",
            //"Cooking",
            //"Smithing",
            "Farming",
            // "Summoning", // Need for summoning xp calculation
            "Thieving",
            "Fletching",
            "Crafting",
            //"Runecrafting",
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

        let href = location.origin;

        if (cloudManager.isTest) {
            href += '/lemvorIdle';
        }

        const response = await fetch(`${href}${url}`, {
            method: "GET",
            headers,
        });
        if (!response.ok)
            throw new Error(`Could not fetch data package with URL: ${href}${url}`);
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

    gamemodeToData = (gm: Gamemode): GamemodeData => {
        let playerModifierArray: Array<[keyof PlayerModifierObject, PlayerModifierObject]> = Object.entries(gm.playerModifiers) as Array<[keyof PlayerModifierObject, PlayerModifierObject]>; // For reasons I don't really understand, Typescript cannot guarantee the type of Object.keys() so we have to cast it. https://stackoverflow.com/questions/55012174/why-doesnt-object-keys-return-a-keyof-type-in-typescript
        let playerModifierObj: PlayerModifierData = {};

        playerModifierArray.forEach((modifierPair: [keyof PlayerModifierObject, PlayerModifierObject]) => {
            // @ts-ignore
            if (modifierPair[1] instanceof Array<SkillModifierData>) { // Check for modifiers like decreasedSkillIntervalPercent which affect multiple skills and are an array.
                playerModifierObj[modifierPair[0]] = modifierPair[1].map((skillModifier: SkillModifier) => (
                    { skillID: skillModifier.skill.id, value: skillModifier.value }
                )) as SkillModifierData[] & number // I don't understand why I've had to typecast this, but I have done so to shut the compiler up. I don't know how to guarantee the type is Array & number
            }
        });

        return {
            //@ts-ignore Ignore warning about accessing private variables. I don't think there's any workaround for this since we *need* to access these private version of these specific variables (for initalisation purposes) and not the getter version that's publically available
            name: gm._name,
            //@ts-ignore
            id: gm._localID,
            //@ts-ignore
            description: gm._description,
            //@ts-ignore
            rules: gm._rules,
            //@ts-ignore
            media: gm._media,
            textClass: gm.textClass,
            btnClass: gm.btnClass,
            isPermaDeath: gm.isPermaDeath,
            isEvent: gm.isEvent,
            startDate: gm.startDate,
            endDate: gm.endDate,
            //@ts-ignore
            combatTriangle: Object.entries(COMBAT_TRIANGLE_IDS).filter(x => x[1] == gm._combatTriangle)[0][0],
            hitpointMultiplier: gm.hitpointMultiplier,
            hasRegen: gm.hasRegen,
            capNonCombatSkillLevels: gm.capNonCombatSkillLevels,
            startingPage: 'melvorD:ActiveSkill',
            startingItems: [],
            allowSkillUnlock: gm.allowSkillUnlock,
            skillUnlockCost: gm.skillUnlockCost,
            playerModifiers: playerModifierObj,
            enemyModifiers: gm.enemyModifiers,
            hasTutorial: gm.hasTutorial,
            // @ts-ignore
            allowAncientRelicDrops: gm.allowAncientRelicDrops,
            // @ts-ignore
            allowDungeonLevelCapIncrease: gm.allowDungeonLevelCapIncrease,
            // @ts-ignore
            allowXPOverLevelCap: gm.allowXPOverLevelCap
        }
    }

    obstacleToData(obstacle: AgilityObstacle): AgilityObstacleData {
        let modifiers: MappedModifiers = obstacle.modifiers as any;

        if (!(obstacle.modifiers instanceof MappedModifiers)) {
            modifiers = game.agility.getObstacleModifiers(obstacle);
        }

        return {
            // @ts-ignore
            name: obstacle._name,
            // @ts-ignore
            id: obstacle._localID,
            baseExperience: obstacle.baseExperience,
            baseInterval: obstacle.baseInterval,
            category: obstacle.category,
            gpCost: obstacle.gpCost,
            gpReward: obstacle.gpReward,
            skillRequirements: [],
            itemCosts: [],
            itemRewards: [],
            scCost: 0,
            scReward: 0,
            // @ts-ignore
            modifiers: this.cloneSafeModifiers(modifiers),
            // @ts-ignore
            media: obstacle._media
        };
    }

    pillarToData(obstacle: AgilityPillar): BaseAgilityObjectData {
        let modifiers: MappedModifiers = obstacle.modifiers as any;

        if (!(obstacle.modifiers instanceof MappedModifiers)) {
            modifiers = game.agility.getPillarModifiers(obstacle);
        }

        return {
            // @ts-ignore
            name: obstacle._name,
            // @ts-ignore
            id: obstacle._localID,
            gpCost: obstacle.gpCost,
            itemCosts: [],
            scCost: 0,
            // @ts-ignore
            modifiers: this.cloneSafeModifiers(modifiers),
            // @ts-ignore
            media: obstacle._media
        };
    }

    cloneSafeModifiers(modifiers: MappedModifiers) {
        const clonedModifiers: any = {};

        for (const modifier of modifiers.skillModifiers) {
            clonedModifiers[modifier[0]] = Array.from(modifier[1])
                .filter(mod => !mod[0].isModded)
                .map(mod => ({ skillID: mod[0].id, value: mod[1] }));
        }

        for (const modifier of modifiers.standardModifiers) {
            clonedModifiers[modifier[0]] = modifier[1];
        }

        return clonedModifiers;
    }

    // any setup that requires a game object
    setupGame(game: SimGame, actualGame: Game) {
        this.actualGame = actualGame;
        this.game = game;
        let namespace = this.game.registeredNamespaces.getNamespace("mythCombatSimulator");
        if (namespace === undefined) {
            namespace = this.game.registeredNamespaces.registerNamespace(
                "mythCombatSimulator",
                "Combat Simulator",
                true
            );
        }
        this.namespace = namespace;
        //gamemodes
        this.gamemodes = this.game.gamemodes.allObjects.filter(
            (x: any) => x.id !== "melvorD:Unset"
        );

        this.gamemodes.forEach(gamemode => {
            (<any>gamemode).overrideLevelCap = undefined;
        });

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

        if ((<any>self).game) {
            (<any>self).game.pets = this.pets;
        }

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

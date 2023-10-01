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

interface ISimData extends ISimStats, ISimResult {
    inQueue?: boolean;
    adjustedRates: any;
}

interface ISimSave {
    settings: IImportSettings;
    monsterSimData: { [index: string]: ISimData };
    dungeonSimData: { [index: string]: ISimData };
    slayerSimData: { [index: string]: ISimData };
}

declare var gameFileVersion: string;
declare function checkFileVersion(version: string): boolean;

/**
 * Simulator class, used for all simulation work, and storing simulation results and settings
 */
class Simulator {
    currentJob: any;
    currentSim: any;
    dungeonSimData: { [index: string]: ISimData };
    dungeonSimFilter: { [index: string]: boolean };
    isTestMode: any;
    maxThreads: any;
    monsterSimData: { [index: string]: ISimData };
    monsterSimIDs: string[];
    monsterSimFilter: { [index: string]: boolean };
    notSimulatedReason: any;
    parent: App;
    selectedPlotIsTime: any;
    selectedPlotScales: any;
    simCancelled: any;
    simInProgress: any;
    simStartTime: any;
    simulationQueue: any;
    simulationWorkers: any;
    slayerSimData: { [index: string]: ISimData };
    slayerSimFilter: { [index: string]: boolean };
    slayerTaskMonsters: any;
    testCount: any;
    testMax: any;
    workerURL: any;
    private cloner: CloneData;
    micsr: MICSR;

    constructor(parent: App, workerURL: any) {
        this.parent = parent;
        this.micsr = parent.micsr;
        this.cloner = new CloneData();
        // Simulation settings
        this.monsterSimFilter = {};
        this.dungeonSimFilter = {};
        this.slayerSimFilter = {};
        // not simulated reason
        this.notSimulatedReason = "entity not simulated";
        // Simulation data;
        this.monsterSimIDs = [];
        this.monsterSimData = {};
        this.micsr.monsters.forEach((monster: any) => {
            this.monsterSimData[monster.id] = this.newSimData(true);
            this.monsterSimIDs.push(monster.id);
            this.monsterSimFilter[monster.id] = true;
        });
        this.dungeonSimData = {};
        this.micsr.dungeons.forEach((dungeon: any) => {
            this.dungeonSimData[dungeon.id] = this.newSimData(false);
            this.dungeonSimFilter[dungeon.id] = false;
            dungeon.monsters.forEach((monster: any) => {
                const simID = this.simID(monster.id, dungeon.id);
                if (!this.monsterSimData[simID]) {
                    this.monsterSimData[simID] = this.newSimData(true);
                    this.monsterSimIDs.push(simID);
                }
            });
        });
        //
        this.slayerTaskMonsters = {};
        this.slayerSimData = {};
        this.micsr.slayerTaskData.forEach((task: any) => {
            this.slayerTaskMonsters[task.display] = [];
            this.slayerSimData[task.display] = this.newSimData(false);
            this.slayerSimFilter[task.display] = true;
        });
        /** Variables of currently stored simulation */
        this.currentSim = this.initCurrentSim();
        // Options for time multiplier
        this.selectedPlotIsTime = true;
        this.selectedPlotScales = true;
        // Test Settings
        this.isTestMode = false;
        this.testMax = 10;
        this.testCount = 0;
        // Simulation queue and webworkers
        this.workerURL = workerURL;
        this.currentJob = 0;
        this.simInProgress = false;
        this.simulationQueue = [];
        this.simulationWorkers = [];
        this.maxThreads = 1; // TODO: window.navigator.hardwareConcurrency;
        this.simStartTime = 0;
        /** If the current sim has been cancelled */
        this.simCancelled = false;
    }

    newSimData(isMonster: boolean): ISimData {
        const data: any = {
            simSuccess: false,
            reason: this.notSimulatedReason,
            adjustedRates: {},
        };
        if (isMonster) {
            data.inQueue = false;
            data.petRolls = { other: [] };
        }
        return data;
    }

    /**
     * Initializes a performance test
     */
    runTest(numSims: any) {
        this.testCount = 0;
        this.isTestMode = true;
        this.testMax = numSims;
        this.simulateCombat(false);
    }

    /**
     * Creates the webworkers for simulation jobs
     */
    async createWorkers() {
        for (let i = 0; i < this.maxThreads; i++) {
            const worker = await this.createWorker();
            await this.sendScripts(worker, i);
            this.intializeWorker(worker, i);
            const newWorker = {
                worker: worker,
                inUse: false,
                selfTime: 0,
            };
            this.simulationWorkers.push(newWorker);
        }
    }

    /**
     * Creates a web worker
     * @return {Promise<Worker>}
     */
    async createWorker(): Promise<Worker> {
        return new Worker(this.workerURL);
    }

    sendScripts(worker: Worker, i: number) {
        return new Promise<void>(resolve => {
            // worker
            worker.onmessage = (event: any) => this.processWorkerMessage(event, i, resolve);
            worker.onerror = (event: any) => {
                this.micsr.log("An error occurred in a simulation worker");
                this.micsr.log(event);
            };

            let href = location.origin;

            if (cloudManager.isTest) {
                href += '/lemvorIdle';
            }

            worker.postMessage({
                action: "SCRIPTS",
                gameFileVersion,
                href
            });
        });
    }

    // TODO: refactor intializeWorker
    /**
     * Intializes a simulation worker
     * @param {Worker} worker
     * @param {number} i
     */
    intializeWorker(worker: any, i: any) {
        // constants
        const constantNames: {
            name: string;
            data: any;
        }[] = [
            // modified objects
            { name: "CDNDIR", data: "" },
            { name: "currentSaveVersion", data: currentSaveVersion },
            { name: "gameVersion", data: gameVersion },
            { name: "enemyNoun", data: enemyNoun },
            // @ts-ignore
            { name: 'ArtefactWeightRange', data: ArtefactWeightRange, },
            { name: 'TownshipResourceTypeID', data: TownshipResourceTypeID },
            { name: 'AltMagicProductionID', data: AltMagicProductionID },
            // We need loadedLangJson for skill names (used with XP tracking)
            { name: "loadedLangJson", data: loadedLangJson },
            { name: "MAX_QUICK_EQUIP_ITEMS", data: MAX_QUICK_EQUIP_ITEMS },
            { name: "TICK_INTERVAL", data: TICK_INTERVAL },
            { name: "youNoun", data: youNoun },
            { name: "TODO_REPLACE_MEDIA", data: TODO_REPLACE_MEDIA },
            { name: "DEBUGENABLED", data: false },
            {
                name: "cloudManager",
                data: {
                    ...cloudManager,
                    formElements: undefined,
                    formInnerHTML: undefined,
                    checkAuthentication: undefined,
                    hidePageLoader: undefined,
                    showPageLoader: undefined,
                    showSignInContainer: undefined,
                    showRegisterContainer: undefined,
                    showForgotContainer: undefined,
                    showLanguageSelection: undefined,
                    initSilentSignIn: undefined,
                    initChangePassword: undefined,
                    performChanceEmail: undefined,
                    playfabEventAPI: undefined,
                    checkForPlayFabTokenRefresh: undefined,
                    checkForPlayFabAutoSave: undefined,
                    refreshPlayFabSaves: undefined,
                    skipCloudAuthentication: undefined,
                    log: undefined,
                    setStatus: undefined,
                    changePasswordToMelvorCloud: undefined,
                    accessBaseGame: undefined,
                    accessTestServer: undefined,
                    connectToPatreon: undefined,
                    getPlayFabSave: undefined,
                    deletePlayFabSave: undefined,
                    forceUpdatePlayFabSave: undefined,
                    updateLastSaveTimestampText: undefined,
                    disableForceSyncButton: undefined,
                    enableForceSyncButton: undefined,
                    updateUIForPlayFabSignIn: undefined,
                    updateUIForMelvorCloudSignIn: undefined,
                    updateUIForEntitlements: undefined,
                    connectionSuccessMelvorCloud: undefined,
                    connectionFailedMelvorCloud: undefined,
                    logout: undefined,
                    updateUIForAccountSteamLinkStatus: undefined,
                    displaySteamLinkSwal: undefined,
                    updateEntitlementsFromReceiptData: undefined,
                    saveToSteamCloud: undefined,
                    readFromSteamCloud: undefined,
                    deleteFromSteamCloud: undefined,
                    dismissExpansionNotOwned2: undefined,
                    remindLaterExpansionNotOwned2: undefined,
                    viewOtherExpansions: undefined,
                    isBirthdayEvent2023Active: undefined,
                    toggleDevMode: undefined,
                    isDevModeEnabled: undefined
                },
            },
            { name: "COMBAT_TRIANGLE_IDS", data: COMBAT_TRIANGLE_IDS },
            { name: "combatTriangle", data: combatTriangle },
            { name: "numberMultiplier", data: numberMultiplier },

            { name: "burnEffect", data: burnEffect },
            { name: "poisonEffect", data: poisonEffect },
            { name: "rageEffect", data: rageEffect },
            { name: "shockEffect", data: shockEffect },
            { name: "dualityEffect", data: dualityEffect },
            { name: "deadlyPoisonEffect", data: deadlyPoisonEffect },
            { name: "afflictionEffect", data: afflictionEffect },
            { name: "frostBurnEffect", data: frostBurnEffect },
            { name: "bleedReflectEffect", data: bleedReflectEffect },
            {
                name: "decreasedEvasionStackingEffect",
                data: decreasedEvasionStackingEffect,
            },
            { name: "absorbingSkinEffect", data: absorbingSkinEffect },
            { name: "darkBladeEffect", data: darkBladeEffect },
            { name: "assassinEffect", data: assassinEffect },
            { name: "growingMadnessEffect", data: growingMadnessEffect },
            { name: "momentInTimeEffect", data: momentInTimeEffect },
            { name: "reignOverTimeEffect", data: reignOverTimeEffect },
            { name: "shadowCloakEffect", data: shadowCloakEffect },
            { name: "increased5DROnHitEffect", data: increased5DROnHitEffect },
            { name: "elementalEffects", data: elementalEffects },

            { name: "effectMedia", data: {} },
            { name: "combatMenus", data: {} },
            { name: "loadingOfflineProgress", data: undefined },
            { name: "DATA_VERSION", data: DATA_VERSION },
            {
                name: "equipmentSlotData",
                data: this.cloner.equipmentSlotData(),
            },
            { name: "modifierData", data: this.cloner.modifierData() },
            { name: "ModifierID", data: ModifierID, },
            { name: 'setLang', data: setLang },
            { name: "SlayerTierID", data: SlayerTierID },
            { name: "AttackTypeID", data: AttackTypeID },
            { name: "ArchaicSpellTypeID", data: ArchaicSpellTypeID },
            { name: "RaidStats", data: RaidStats },
        ];
        [
            // these objects are copied from the game
            "CombatAreaType",
            "EnemyState",
            "EquipmentSlots",
            "RaidDifficulty",
            "AmmoTypeID",
            "RaidState",
            "SpellTypes",
            "SpellTiers",
            "CombatStats",
            "MonsterStats",
            "ItemStats",
            "GeneralStats",
            "PrayerStats",
            "SlayerStats",
            "HerbloreStats",
            "SummoningStats",
            "StatCategories",
            "DotTypeIDs",
            // these objects are implicitly set to undefined
            "smithingSelectionTabs",
            "fletchingSelectionTabs",
            "craftingSelectionTabs",
            "runecraftingSelectionTabs",
            "herbloreSelectionTabs",
            "summoningSelectionTabs",
        ].forEach((constant: any) =>
            constantNames.push({ name: constant, data: window[constant] })
        );
        // process constants
        const constants: { [name: string]: string } = {};
        constantNames.forEach(
            (constant) => (constants[constant.name] = constant.data)
        );
        // functions
        const functionNames: {
            name: string;
            data: any;
        }[] = [];
        // these functions are spoofed
        [
            ["createElement", () => {}],
            ["tippy", () => undefined],
        ].forEach((func: any) =>
            functionNames.push({ name: func[0], data: func[1] })
        );
        // these functions are copied from the game
        [
            "constructDamageFromData",
            "getLangString",
            "imageNotify",
            "applyModifier",
            "readNamespacedReject",
            "multiplyByNumberMultiplier",
            "milliToSeconds",
            "divideByNumberMultiplier",
            "isSkillEntry",
            "clampValue",
            "roundToTickInterval",
            //"loadGameData",
            "constructEffectFromData",
            "damageReducer",
            "rollPercentage",
            "getDamageRoll",
            "rollInteger",
            "readAttackEffect",
            "getRandomArrayElement",
            "sortRecipesByCategoryAndLevel",
            "checkBooleanCondition",
            "checkValueCondition",
            "selectFromWeightedArray",
            "getItemSpecialAttackInformation",
            "describeModifierData",
            "getSpansFromModifierObject",
            "getModifierDataSpans",
            "isSkillKey",
            "formatModifiers",
            "printPlayerModifier",
            "disableModifierPass",
            "isDisabledModifier",
            "checkFileVersion"
        ].forEach((func: any) => {
            if (window[func] === undefined) {
                this.micsr.error(`window[${func}] is undefined`);
            }
            functionNames.push({ name: func, data: window[func] });
        });
        // these functions are copied from the simulator
        // process functions
        const functions: { [name: string]: string } = {};
        functionNames.forEach((func) => {
            let fstring = func.data.toString();
            if (!fstring.startsWith("function ") && !fstring.includes("=>")) {
                fstring = "function " + fstring;
            }
            fstring = fstring.replace(`function ${func.name}`, "function");
            functions[func.name] = `self['${func.name}'] = ${fstring}`;
        });
        // classes
        // order matters when classes extend another class
        const classNames: {
            name: string;
            data: any;
        }[] = [];
        // these classes are empty for the simulation
        // contains empty functions to make the classes work
        const emptyClass = class {
            rootItems: any;
            constructor(public _namespace: DataNamespace, public _localID: string) {
                this.rootItems = [];
            }

            get namespace() {
                return this._namespace?.name;
            }
            get id() {
                return `${this._namespace?.name}:${this._localID}`;
            }
            get localID() {
                return this._localID;
            }

            addDummyItemOnLoad() {}

            registerSortOrder() {}

            registerItemUpgrades() {}

            getQty() {
                return 0;
            }

            setLevel() {}

            encode() {}

            decode() {}

            registerSoftDependencies() {}

            assignHandler() {
                return () => {};
            }
        };
        [
            CombatQuickEquipMenu,
            Minibar,
            Settings,
            MasteryLevelUnlock,
            ItemUpgrade,

            // RenderQueues
            SkillRenderQueue,
            MasterySkillRenderQueue,
            GatheringSkillRenderQueue,
            AltMagicRenderQueue,
            PrayerRenderQueue,
            ArtisanSkillRenderQueue,
            WoodcuttingRenderQueue,
            FishingRenderQueue,
            FiremakingRenderQueue,
            CookingRenderQueue,
            MiningRenderQueue,
            ThievingRenderQueue,
            FarmingRenderQueue,
            AgilityRenderQueue,
            SummoningRenderQueue,
            AstrologyRenderQueue,
            TownshipRenderQueue,
            BankRenderQueue,
            TutorialRenderQueue,
            ShopRenderQueue,

            FarmingHarvestActionEventMatcher,
            FarmingPlantActionEventMatcher,
            FiremakingActionEventMatcher,
            FishingActionEventMatcher,
            FletchingActionEventMatcher,
            MiningActionEventMatcher,
            ThievingActionEventMatcher,
            WoodcuttingActionEventMatcher,
            BonfireLitEventMatcher,
            CookingActionEventMatcher,
            CraftingActionEventMatcher,
            RunecraftingActionEventMatcher,
            SmithingActionEventMatcher,
            // @ts-ignore
            CartographyPaperMakingEventMatcher,
            // @ts-ignore
            CartographyMapUpgradeEventMatcher,
            // @ts-ignore
            CartographyMapRefinementEventMatcher,
            // @ts-ignore
            ArchaeologyActionEventMatcher,
            // @ts-ignore
            TownshipTaskCompletedEventMatcher,
            // @ts-ignore
            CartographySurveyEventMatcher,
            // @ts-ignore
            ArchaeologyTool,
            // @ts-ignore
            ArchaeologyMuseumReward,

            // Township
            TownshipTasks,
            TownshipData,
            FarmingPlot,
            ThievingNPC,
            ThievingArea,
            MiningRock,
            WoodcuttingTree,
            Fish,
            FishingArea,
            FarmingCategory,
            FarmingRecipe,
            FletchingRecipe,
            TownshipTask,
            TownshipTaskGoals,
            TownshipTaskRewards,
            // @ts-ignore
            TownshipCasualTask,
            TownshipBiome,
            TownshipBuilding,
            TownshipResource,
            TownshipBuildingProvides,

            // Milestones
            CustomSkillMilestone,
            SlayerAreaMilestone,
            AgilityObstacleMilestone,
            AgilityPillarMilestone,
            AgilityElitePillarMilestone,
            SkillMasteryMilestone,
            AgilityObstacleMilestone,
            EquipItemMilestone,

            // @ts-expect-error
            NotificationsManager,
        ].forEach((clas: any) =>
            classNames.push({ name: clas.name, data: emptyClass })
        );

        // these classes are copied from the game
        [
            // @ts-expect-error
            Telemetry,

            Bank,
            BankItem,

            SparseNumericMap,
            CompletionMap,
            CompletionRenderQueue,
            CompletionProgress,
            Completion,
            NamespaceMap,
            NamespaceRegistry,
            NamespacedObject,
            NamespacedArray,
            ItemRegistry,
            CharacterStats,
           // NormalDamage,
            Gamemode,
            Page,
            Skill,
            SkillWithMastery,
            CombatSkill,
            GatheringSkill,
            CraftingSkill,
            ArtisanSkill,

            // Skills
            Attack,
            Strength,
            Defence,
            Hitpoints,
            Ranged,
            AltMagic,
            Prayer,
            Slayer,
            Woodcutting,
            Fishing,
            Firemaking,
            Cooking,
            Mining,
            Smithing,
            Thieving,
            Farming,
            Fletching,
            Crafting,
            Runecrafting,
            Herblore,
            Agility,
            Summoning,
            Astrology,
            Township,
            // @ts-ignore
            Cartography,
            // @ts-ignore
            Archaeology,

            // Attacks
            SpecialAttack,

            ItemEffectAttack,
            StackingEffect,
           // SlowEffect,
           // BurnEffect,
           // PoisonEffect,
            ItemEffect,
           // DeadlyPoisonEffect,
            CurseEffect,
           // EndOfTurnEvasionEffect,
           // StickyWebs,

            // Items
            Item,
            EquipmentItem,
            WeaponItem,
            FoodItem,
            BoneItem,
            OpenableItem,
            PotionItem,
            ReadableItem,
            CompostItem,
            TokenItem,
            CombatLoot,
            DropTable,

            // Modifiers
            AstrologyModifier,
            MappedModifiers,
            TargetModifiers,
            CombatModifiers,
            PlayerModifiers,

            // Main
            // @ts-ignore
            GameEventEmitter,
            MasteryAction,
            DummyMasteryAction,
            Lore,
            EventManager,
            CombatArea,
            Dungeon,
            Currency,
            DataReader,
            Equipment,
            EquipmentSet,
            EquipmentStats,
            EquippedFood,
            EquipSlot,
            GP,
            ItemCharges,
            ExperienceCalculator,
            NotificationQueue,
            PlayerStats,
            PetManager,
            PotionManager,
            SlayerCoins,
            RaidCoins,
            SpellSelection,
            Timer,
            Tutorial,
            BinaryWriter,
            SaveWriter,
            Shop,
            SlayerTask,
            SplashManager,
            BaseManager,
            CombatManager,
            // @ts-ignore
            DoublyLinkedList,
            // @ts-ignore
            LinkQueue,
            // @ts-ignore
            CharacterRenderQueue,
            // @ts-ignore
            EnemyRenderQueue,
            // @ts-ignore
            PlayerRenderQueue,
            // @ts-ignore
            CartographyRenderQueue,
            // @ts-ignore
            ArchaeologyRenderQueue,
            // @ts-ignore
            ArchaeologyMuseum,
            Character,
            Player,
            RaidPlayer,
            Enemy,
            // @ts-ignore
            ClueHunt,
            // @ts-ignore
            KeyboardInputManager,
            // @ts-ignore
            GameEventSystem,
            Game,
            Golbin,
            // @ts-expect-error TS(2304): Cannot find name 'GolbinRaidBank'.
            GolbinRaidBank,
            RaidManager,
            TownshipWorship,
            // @ts-expect-error
            TownshipCasualTasks,
            CombatPassive,
            Pet,
            AttackStyle,
            ConditionalModifier,
            BaseSpell,
            CombatSpell,
            StandardSpell,
            CurseSpell,
            AncientSpell,
            ArchaicSpell,
            AuroraSpell,
            AltMagicSpell,
            Monster,
            ShopCategory,
            ShopPurchase,
            ShopUpgradeChain,
            DummyShopPurchase,
            SlayerArea,
            StatTracker,
            MappedStatTracker,
            Statistics,
            DummyItem,
            DummyMonster,
            ControlledAffliction,
            ActivePrayer,
            ItemSynergy,
            BaseAgilityObject,
            AgilityObstacle,
            AgilityPillar,

            // Events
            GameEvent,
            // @ts-ignore
            IntervaledGameEvent,
            //PlayerAttackEvent,
            //EnemyAttackEvent,
            // @ts-ignore
            CharacterAttackEvent,
            // @ts-ignore
            HitpointRegenerationEvent,
            CombatEvent,
            PlayerSummonAttackEvent,
            GameEventMatcher,
            // @ts-ignore
            NonRaidGameEventMatcher,
            // @ts-ignore
            CharacterGameEventMatcher,
            SkillActionEvent,
            MonsterKilledEvent,
            MonsterDropEvent,
            // @ts-ignore
            MonsterSpawnedEvent,
            // @ts-ignore
            DungeonCompletedEvent,
            // @ts-ignore
            MonsterKilledWithEquipmentEvent,
            // @ts-ignore
            MonsterKilledWithPlayerRequirementsEvent,
            FoodEatenEvent,
            PotionUsedEvent,
            RuneConsumptionEvent,
            PrayerPointConsumptionEvent,
            SummonTabletUsedEvent,
            // @ts-ignore
            CartographyPaperMakingEvent,
            // @ts-ignore
            CartographyMapUpgradeEvent,
            // @ts-ignore
            CartographyMapRefinementEvent,
            // @ts-ignore
            ArchaeologyActionEvent,
            // @ts-ignore
            RandomTravelEvent,
            // @ts-ignore
            RequirementChangedEvent,
            // @ts-ignore
            TownshipTaskCompletedEvent,

            // Matchers
            SkillActionEventMatcher,

            AgilityActionEventMatcher,
            AltMagicActionEventMatcher,
            AstrologyActionEventMatcher,
            //BonfireLitEventMatcher,
            //CookingActionEventMatcher,
            //CraftingActionEventMatcher,
            EnemyAttackEventMatcher,
            // FarmingHarvestActionEventMatcher,
            // FarmingPlantActionEventMatcher,
            // FiremakingActionEventMatcher,
            // FishingActionEventMatcher,
            // FletchingActionEventMatcher,
            FoodEatenEventMatcher,
            FoodEquippedEventMatcher,
            HerbloreActionEventMatcher,
            ItemEquippedEventMatcher,
            // MiningActionEventMatcher,
            MonsterDropEventMatcher,
            MonsterKilledEventMatcher,
            // @ts-ignore
            MonsterSpawnedEventMatcher,
            PlayerAttackEventMatcher,
            PlayerHitpointRegenerationMatcher,
            PlayerSummonAttackEventMatcher,
            PotionChargeUsedEvent,
            PotionChargeUsedEventMatcher,
            PotionUsedEventMatcher,
            PrayerPointConsumptionEventMatcher,
            RuneConsumptionEventMatcher,
            //RunecraftingActionEventMatcher,
            ShopPurchaseMadeEventMatcher,
            //SmithingActionEventMatcher,
            SummoningActionEventMatcher,
            SummonTabletUsedEventMatcher,
            //ThievingActionEventMatcher,
            //WoodcuttingActionEventMatcher,

            BasicSkillRecipe,
            ArtisanSkillRecipe,
            SingleProductRecipe,
            CategorizedArtisanRecipe,
            SingleProductArtisanSkillRecipe,
            // CookingRecipe,
            SkillCategory,
            CookingCategory,
            // CookingCategory,
            HerbloreRecipe,
            SummoningRecipe,
            SummoningSynergy,
            AstrologyRecipe,
            DummyAstrologyRecipe,
            DummySummoningRecipe,
            CookingRecipe,
            FiremakingLog,
            // @ts-ignore
            ArchaeologyDigSite,
            // @ts-ignore
            DummyArchaeologyDigSite,
            // @ts-ignore
            WorldMap,
            // @ts-ignore
            DummyWorldMap,
            // @ts-ignore
            Point,
            // @ts-ignore
            HexCoords,
            // @ts-ignore
            Hex,
            // @ts-ignore
            DummyHex,
            // @ts-ignore
            FastTravelGroup,
            // @ts-ignore
            PointOfInterest,
            // @ts-ignore
            DigSitePOI,
            // @ts-ignore
            DigSiteMap,
            // @ts-ignore
            PortalPOI,
            // @ts-ignore
            MapFilterSettings,
            // @ts-ignore
            FixedCosts,
            // @ts-ignore
            PaperMakingRecipe,
            // @ts-ignore
            WorldMapMasteryBonus,
            // @ts-ignore
            AncientRelic,

            UnregisteredConstructionError,

            // Combat sim classes
            MICSR,
            ShowModifiers,
            SimManager,
            SimPlayer,
            SimEnemy,
            SimGame,
            Simulator,
            CloneData,
            CustomEventMatcher,
        ].forEach((clas: any) =>
            classNames.push({ name: clas.name, data: clas })
        );
        const classes: { [name: string]: string } = {};
        classNames.forEach((clas) => {
            const s = clas.data
                .toString()
                // remove class name
                .replace(`class ${clas.name}`, "class")
                // remove logging from CombatManager constructor
                .replace(`console.log('Combat Manager Built...');`, "")
                // fix Character bug
                //TODO: remove this when Character.applyDOT no longer refers to the global combatManager object
                .replace("combatManager", "this.manager");
            classes[clas.name] = `self['${clas.name}'] = ${s}`;
        });

        // Stringify and store both namespaces and gamemodes to pass to the webWorkers
        const namespaces: { [key: string]: string } = {};
        const gamemodes: { [key: string]: string } = {};
        const agilityActions: { [key: string]: string } = {};
        const agilityPillars: { [key: string]: string } = {};
        const agilityElitePillars: { [key: string]: string } = {};

        game.registeredNamespaces.forEach((ns: DataNamespace) => {
            if (ns.isModded) {
                namespaces[ns.name] = JSON.stringify(ns);
            }
        });

        game.gamemodes.forEach((gm: Gamemode) => {
            if (gm.isModded) {
                const gmNamespace: string = gm.namespace;
                const gmName: string = gm.name;
                const gmIsModded: boolean = gm.isModded;
                const gmData: GamemodeData = this.micsr.gamemodeToData(gm);

                gamemodes[gm.id] = JSON.stringify([{ name: gmNamespace, displayName: gmName, isModded: gmIsModded }, gmData]);
            }
        });

        game.agility.actions.forEach(action => {
            if (action.isModded) {
                agilityActions[action.id] = JSON.stringify([{ name: action.namespace, displayName: action.name, isModded: true }, this.micsr.obstacleToData(action)]);
            }
        });

        game.agility.pillars.forEach(action => {
            if (action.isModded) {
                agilityPillars[action.id] = JSON.stringify([{ name: action.namespace, displayName: action.name, isModded: true }, this.micsr.pillarToData(action)]);
            }
        });

        game.agility.elitePillars.forEach(action => {
            if (action.isModded) {
                agilityElitePillars[action.id] = JSON.stringify([{ name: action.namespace, displayName: action.name, isModded: true }, this.micsr.pillarToData(action)]);
            }
        });

        // debugger;
        worker.postMessage({
            action: "RECEIVE_GAMEDATA",
            // constants
            constantNames: constantNames.map((x) => x.name),
            constants: constants,
            // functions
            functionNames: functionNames.map((x) => x.name),
            functions: functions,
            // classes
            classNames: classNames.map((x) => x.name),
            classes: classes,
            // TODO: This might also be sent with the MICSR object
            slayerTaskData: SlayerTask.data,
            dataPackage: this.micsr.dataPackage,
            SummoningMarkLevels: Summoning.markLevels,
            // Extra gamemode stuff
            namespaces,
            gamemodes,
            agilityActions,
            agilityPillars,
            agilityElitePillars
        });
    }

    /**
     * Iterate through all the combatAreas and this.micsr.dungeons to create a set of monsterSimData and dungeonSimData
     */
    async simulateCombat(single: boolean) {
        this.setupCurrentSim(single);
        // Start simulation workers
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        document.getElementById(
            "MCS Simulate All Button"
        ).textContent = `Cancel (0/${this.simulationQueue.length})`;
        await this.initializeSimulationJobs();
    }

    initCurrentSim() {
        return {
            options: {
                trials: this.micsr.trials,
            },
        };
    }

    simID(monsterID: string, dungeonID?: string) {
        if (dungeonID === undefined) {
            return monsterID;
        }
        return `${dungeonID}-${monsterID}`;
    }

    pushMonsterToQueue(monsterID: string, dungeonID?: string) {
        const simID = this.simID(monsterID, dungeonID);
        if (!this.monsterSimData[simID].inQueue) {
            this.monsterSimData[simID].inQueue = true;
            this.simulationQueue.push({
                monsterID: monsterID,
                dungeonID: dungeonID
            });
        }
    }

    resetSingleSimulation() {
        // clear queue
        this.simulationQueue = [];
        this.resetSimDone();
        // check selection
        if (!this.parent.barSelected && !this.parent.isViewingDungeon) {
            this.parent.notify("There is nothing selected!", "danger");
            return {};
        }
        // area monster
        if (
            !this.parent.isViewingDungeon &&
            this.parent.barIsMonster(this.parent.selectedBar)
        ) {
            const monsterID =
                this.parent.barMonsterIDs[this.parent.selectedBar];
            if (this.monsterSimFilter[monsterID]) {
                this.pushMonsterToQueue(monsterID, undefined);
            } else {
                this.parent.notify(
                    "The selected monster is filtered!",
                    "danger"
                );
            }
            return {};
        }
        // dungeon
        let dungeonID: string | undefined = undefined;
        if (
            !this.parent.isViewingDungeon &&
            this.parent.barIsDungeon(this.parent.selectedBar)
        ) {
            dungeonID = this.parent.barMonsterIDs[this.parent.selectedBar];
        } else if (
            this.parent.isViewingDungeon &&
            this.micsr.isDungeonID(this.parent.viewedDungeonID)
        ) {
            dungeonID = this.parent.viewedDungeonID;
        }
        if (dungeonID !== undefined) {
            if (this.dungeonSimFilter[dungeonID]) {
                if (this.parent.isViewingDungeon && this.parent.barSelected) {
                    this.pushMonsterToQueue(
                        this.parent.getSelectedDungeonMonsterID(),
                        dungeonID
                    );
                    return { dungeonID: dungeonID };
                }
                this.micsr.dungeons
                    .getObjectByID(dungeonID)!
                    .monsters.forEach((monster) => {
                        this.pushMonsterToQueue(monster.id, dungeonID);
                    });
                return { dungeonID: dungeonID };
            }
            this.parent.notify("The selected dungeon is filtered!", "danger");
            return {};
        }
        // slayer area
        let taskID = undefined;
        if (
            !this.parent.isViewingDungeon &&
            this.parent.barIsTask(this.parent.selectedBar)
        ) {
            taskID = this.parent.barMonsterIDs[this.parent.selectedBar];
        } else if (
            this.parent.isViewingDungeon &&
            this.micsr.isDungeonID(this.parent.viewedDungeonID)
        ) {
            taskID = this.parent.viewedDungeonID;
        }
        if (taskID !== undefined) {
            if (this.slayerSimFilter[taskID]) {
                this.queueSlayerTask(taskID);
                return { taskID: taskID };
            }
            this.parent.notify("The selected task list is filtered!", "danger");
            return {};
        }
        // can't be reached
        return {};
    }

    queueSlayerTask(taskName: string) {
        const task = this.micsr.slayerTaskData.find(
            (t) => t.display == taskName
        );
        if (!task) {
            throw new Error(`Could not find task: ${taskName}`);
        }
        this.slayerTaskMonsters[taskName] = [];
        if (!this.slayerSimFilter[taskName]) {
            return;
        }
        const minLevel = task.minLevel;
        const maxLevel = task.maxLevel === -1 ? 6969 : task.maxLevel;
        this.micsr.monsters.forEach((monster: any) => {
            // check if it is a slayer monster
            if (!monster.canSlayer) {
                return;
            }
            // check if combat level fits the current task type
            const cbLevel = monster.combatLevel;
            if (cbLevel < minLevel || cbLevel > maxLevel) {
                return;
            }
            // check if the area is accessible, this only works for auto slayer
            // without auto slayer you can get some tasks for which you don't wear/own the gear
            let area = this.micsr.game.getMonsterArea(monster.id);
            if (!this.parent.game.checkRequirements(area.entryRequirements)) {
                return;
            }
            // all checks passed
            this.pushMonsterToQueue(monster.id, undefined);
            this.slayerTaskMonsters[taskName].push(monster);
        });
    }

    resetSimulationData(single: boolean) {
        // Reset the simulation status of all enemies
        this.resetSimDone();
        // Set up simulation queue
        this.simulationQueue = [];
        if (single) {
            this.currentSim.ids = this.resetSingleSimulation();
            return;
        }
        // Queue simulation of monsters in combat areas
        this.micsr.combatAreas.forEach((area) => {
            area.monsters.forEach((monster) => {
                if (this.monsterSimFilter[monster.id]) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            });
        });
        // Wandering Bard
        if (this.monsterSimFilter[this.micsr.bardID]) {
            this.pushMonsterToQueue(this.micsr.bardID, undefined);
        }
        // Queue simulation of monsters in slayer areas
        this.micsr.slayerAreas.forEach((area) => {
            if (!this.micsr.game.checkRequirements(area.entryRequirements)) {
                const tryToSim = area.monsters.reduce(
                    (sim, monster) =>
                        (this.monsterSimFilter[monster.id] &&
                            !this.monsterSimData[monster.id].inQueue) ||
                        sim,
                    false
                );
                if (tryToSim) {
                    this.parent.notify(`Can't access ${area.name}`, "danger");
                    area.monsters.forEach((monster) => {
                        this.monsterSimData[monster.id].reason =
                            "cannot access area";
                    });
                }
                return;
            }
            area.monsters.forEach((monster) => {
                if (this.monsterSimFilter[monster.id]) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            });
        });
        // Queue simulation of monsters in dungeons
        this.micsr.dungeons.forEach((dungeon) => {
            if (this.dungeonSimFilter[dungeon.id]) {
                for (let j = 0; j < dungeon.monsters.length; j++) {
                    const monster = dungeon.monsters[j];
                    this.pushMonsterToQueue(monster.id, dungeon.id);
                }
            }
        });
        // Queue simulation of monsters in slayer tasks
        this.micsr.taskIDs.forEach((taskID) => {
            this.queueSlayerTask(taskID);
        });
    }

    /**
     * Setup currentsim variables
     */
    setupCurrentSim(single: boolean) {
        this.simStartTime = performance.now();
        this.simCancelled = false;
        this.currentSim = this.initCurrentSim();
        // reset and setup sim data
        this.resetSimulationData(single);
    }

    combineReasons(data: any, monsters: any, dungeonID: any) {
        let reasons: any = [];
        monsters.forEach((monster: any) => {
            const simID = this.simID(monster.id, dungeonID);
            if (!this.monsterSimData[simID].simSuccess) {
                data.simSuccess = false;
            }
            const reason = this.monsterSimData[simID].reason;
            if (reason && !reasons.includes(reason)) {
                reasons.push(reason);
            }
        });
        if (reasons.length) {
            data.reason = reasons.join(", ");
            return true;
        }
        data.reason = undefined;
        return false;
    }

    computeAverageSimData(
        filter: boolean,
        averageData: ISimData,
        monsters: Monster[],
        isSlayerTask: boolean,
        dungeonID?: string
    ) {
        // check filter
        if (!filter) {
            averageData.simSuccess = false;
            averageData.reason = "entity filtered";
            return;
        }
        // combine failure reasons, if any
        if (isSlayerTask) {
            averageData.reason = "";
        } else {
            this.combineReasons(averageData, monsters, dungeonID);
        }

        averageData.simSuccess = true;
        averageData.tickCount = 0;

        // not time-weighted averages
        averageData.deathRate = 0;
        averageData.highestDamageTaken = 0;
        averageData.lowestHitpoints = Number.MAX_SAFE_INTEGER;
        averageData.killTimeS = 0;
        averageData.simulationTime = 0;

        monsters.forEach((monster) => {
            const simID = this.simID(monster.id, dungeonID);
            const monsterData = this.monsterSimData[simID];
            if (monsterData.simSuccess) {
                if (!isSlayerTask) {
                    averageData.simSuccess &&= monsterData.simSuccess;
                }
                averageData.deathRate = 1 - (1 - averageData.deathRate) * (1 - monsterData.deathRate);
                averageData.highestDamageTaken = Math.max(
                    averageData.highestDamageTaken,
                    monsterData.highestDamageTaken
                );
                averageData.lowestHitpoints = Math.min(
                    averageData.lowestHitpoints,
                    monsterData.lowestHitpoints
                );
                averageData.killTimeS += monsterData.killTimeS;
                averageData.simulationTime += monsterData.simulationTime;
                averageData.tickCount = Math.max(
                    averageData.tickCount,
                    monsterData.tickCount
                );
            }
        });
        averageData.killsPerSecond = 1 / averageData.killTimeS;

        // time-weighted averages
        const computeAvg = (tag: string) => {
            averageData[tag] =
                monsters
                    .map(
                        (monster) =>
                            this.monsterSimData[
                                this.simID(monster.id, dungeonID)
                            ]
                    )
                    .reduce((avgData, mData) => {
                        if (!mData.simSuccess) {
                            return avgData;
                        }
                        return avgData + mData[tag] * mData.killTimeS;
                    }, 0) / averageData.killTimeS;
        };
        [
            // xp rates
            "xpPerSecond",
            "hpXpPerSecond",
            "slayerXpPerSecond",
            "prayerXpPerSecond",
            "summoningXpPerSecond",
            // consumables
            "ppConsumedPerSecond",
            "ammoUsedPerSecond",
            "runesUsedPerSecond",
            "combinationRunesUsedPerSecond",
            "usedConsumablesPerSecond",
            "potionsUsedPerSecond",
            "tabletsUsedPerSecond",
            "atePerSecond",
            // survivability
            // 'deathRate',
            // 'highestDamageTaken',
            // 'lowestHitpoints',
            // kill time
            // 'killTimeS',
            // 'killsPerSecond',
            // loot gains
            "baseGpPerSecond",
            "dropChance",
            "signetChance",
            "petChance",
            "slayerCoinsPerSecond",
            // unsorted
            "dmgPerSecond",
            "attacksMadePerSecond",
            "attacksTakenPerSecond",
            // 'simulationTime',
        ].forEach((tag) => computeAvg(tag));

        // average rune breakdown
        averageData.usedRunesBreakdown = {};
        monsters
            .map(
                (monster) =>
                    this.monsterSimData[this.simID(monster.id, dungeonID)]
            )
            .forEach((mData) => {
                for (const runeID in mData.usedRunesBreakdown) {
                    if (averageData.usedRunesBreakdown[runeID] === undefined) {
                        averageData.usedRunesBreakdown[runeID] = 0;
                    }
                    averageData.usedRunesBreakdown[runeID] +=
                        (mData.usedRunesBreakdown[runeID] * mData.killTimeS) /
                        averageData.killTimeS;
                }
            });
    }

    /** Performs all data analysis post queue completion */
    performPostSimAnalysis(isNewRun = false) {
        // Perform calculation of dungeon stats
        this.micsr.dungeons.allObjects.forEach((dungeon: Dungeon) => {
            this.computeAverageSimData(
                this.dungeonSimFilter[dungeon.id],
                this.dungeonSimData[dungeon.id],
                dungeon.monsters,
                false,
                dungeon.id
            );
        });
        this.micsr.slayerTaskData.forEach((task: SlayerTaskData) => {
            this.computeAverageSimData(
                this.slayerSimFilter[task.display],
                this.slayerSimData[task.display],
                this.slayerTaskMonsters[task.display],
                true
            );
        });
        // Update other data
        this.parent.loot.update();
        // scale
        this.parent.consumables.update();
        // log time and save result
        if (isNewRun) {
            this.micsr.log(
                `Elapsed Simulation Time: ${
                    performance.now() - this.simStartTime
                }ms`
            );
            if (this.parent.trackHistory) {
                this.saveResult();
            }
        }
    }

    saveResult() {
        // store simulation
        const save: ISimSave = {
            settings: this.parent.import.exportSettings(),
            monsterSimData: JSON.parse(JSON.stringify(this.monsterSimData)),
            dungeonSimData: JSON.parse(JSON.stringify(this.dungeonSimData)),
            slayerSimData: JSON.parse(JSON.stringify(this.slayerSimData)),
        };
        this.parent.savedSimulations.push(save);
        this.parent.createCompareCard();
    }

    /** Starts processing simulation jobs */
    async initializeSimulationJobs() {
        if (!this.simInProgress) {
            if (this.simulationQueue.length > 0) {
                this.simInProgress = true;
                this.currentJob = 0;
                for (let i = 0; i < this.simulationWorkers.length; i++) {
                    this.simulationWorkers[i].selfTime = 0;
                    if (i < this.simulationQueue.length) {
                        await this.startJob(i);
                    } else {
                        break;
                    }
                }
            } else {
                this.performPostSimAnalysis(true);
                this.parent.updateDisplayPostSim();
            }
        }
    }

    /** Starts a job for a given worker
     * @param {number} workerID
     */
    async startJob(workerID: any) {
        if (
            this.currentJob < this.simulationQueue.length &&
            !this.simCancelled
        ) {
            const monsterID = this.simulationQueue[this.currentJob].monsterID;
            const dungeonID = this.simulationQueue[this.currentJob].dungeonID;
            const saveString = this.micsr.game.generateSaveStringSimple();
            // debugger;
            this.simulationWorkers[workerID].worker.postMessage({
                action: "START_SIMULATION",
                monsterID: monsterID,
                dungeonID: dungeonID,
                saveString: saveString,
                trials: this.micsr.trials,
                maxTicks: this.micsr.maxTicks
            });
            this.simulationWorkers[workerID].inUse = true;
            this.currentJob++;
        } else {
            // Check if none of the workers are in use
            let allDone = true;
            this.simulationWorkers.forEach((simWorker: any) => {
                if (simWorker.inUse) {
                    allDone = false;
                }
            });
            if (allDone) {
                this.simInProgress = false;
                this.performPostSimAnalysis(true);
                this.parent.updateDisplayPostSim();
                if (this.isTestMode) {
                    this.testCount++;
                    if (this.testCount < this.testMax) {
                        await this.simulateCombat(false);
                    } else {
                        this.isTestMode = false;
                    }
                }
                // this.micsr.log(this.simulationWorkers);
            }
        }
    }

    /**
     * Attempts to cancel the currently running simulation and sends a cancelation message to each of the active workers
     */
    cancelSimulation() {
        this.simCancelled = true;
        this.simulationWorkers.forEach((simWorker: any) => {
            if (simWorker.inUse) {
                simWorker.worker.postMessage({ action: "CANCEL_SIMULATION" });
            }
        });
    }

    /**
     * Processes a message received from one of the simulation workers
     * @param {MessageEvent} event The event data of the worker
     * @param {number} workerID The ID of the worker that sent the message
     */
    processWorkerMessage(event: any, workerID: any, resolve: (result?: any) => void) {
        // this.micsr.log(`Received Message ${event.data.action} from worker: ${workerID}`);
        if (event.data.simResult?.simSuccess === false) {
            this.micsr.log({ ...event.data.simResult });
        }
        switch (event.data.action) {
            case "SCRIPTS_DONE":
                if (event.data.error) {
                    this.micsr.error(event.data.error);
                }
                resolve();
                break;
            case "FINISHED_SIM":
                // Send next job in queue to worker
                this.simulationWorkers[workerID].inUse = false;
                this.simulationWorkers[workerID].selfTime +=
                    event.data.selfTime;
                // Transfer data into monsterSimData
                const monsterID = event.data.monsterID;
                const dungeonID = event.data.dungeonID;
                const simID = this.simID(monsterID, dungeonID);
                Object.assign(this.monsterSimData[simID], event.data.simResult);
                this.monsterSimData[simID].simulationTime = event.data.selfTime;
                // @ts-expect-error TS(2531): Object is possibly 'null'.
                document.getElementById(
                    "MCS Simulate All Button"
                ).textContent = `Cancel (${this.currentJob - 1}/${
                    this.simulationQueue.length
                })`;
                // this.micsr.log(event.data.simResult);
                // Attempt to add another job to the worker
                this.startJob(workerID);
                break;
            case "ERR_SIM":
                this.micsr.error(event.data.error);
                break;
        }
    }

    /**
     * Resets the simulation status for each monster
     */
    resetSimDone() {
        for (let simID in this.monsterSimData) {
            this.monsterSimData[simID] = this.newSimData(true);
        }
        for (let simID in this.dungeonSimData) {
            this.dungeonSimData[simID] = this.newSimData(false);
        }
        for (let simID in this.slayerSimData) {
            this.slayerSimData[simID] = this.newSimData(false);
        }
    }

    /**
     * Extracts a set of data for plotting that matches the keyValue in monsterSimData and dungeonSimData
     * @param {string} keyValue
     * @return {number[]}
     */
    getDataSet(keyValue: any) {
        const dataSet = [];
        const isSignet = keyValue === "signetChance";
        if (!this.parent.isViewingDungeon) {
            // Compile data from monsters in combat zones
            this.micsr.monsterIDs.forEach((monsterID: any) => {
                dataSet.push(
                    this.getBarValue(
                        this.monsterSimFilter[monsterID],
                        this.monsterSimData[monsterID],
                        keyValue
                    )
                );
            });
            // Perform simulation of monsters in dungeons
            this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                dataSet.push(
                    this.getBarValue(
                        this.dungeonSimFilter[dungeonID],
                        this.dungeonSimData[dungeonID],
                        keyValue
                    )
                );
            });
            // Perform simulation of monsters in slayer tasks
            this.micsr.taskIDs.forEach((taskID) => {
                dataSet.push(
                    this.getBarValue(
                        this.slayerSimFilter[taskID],
                        this.slayerSimData[taskID],
                        keyValue
                    )
                );
            });
        } else if (this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            // dungeons
            const dungeonID = this.parent.viewedDungeonID;
            this.micsr.dungeons
                .getObjectByID(dungeonID!)!
                .monsters.forEach((monster: any) => {
                    const simID = this.simID(monster.id, dungeonID);
                    if (!isSignet) {
                        dataSet.push(
                            this.getBarValue(
                                true,
                                this.monsterSimData[simID],
                                keyValue
                            )
                        );
                    } else {
                        dataSet.push(0);
                    }
                });
            if (isSignet) {
                const monsters = this.micsr.dungeons.getObjectByID(
                    dungeonID!
                )!.monsters;
                const boss = monsters[monsters.length - 1];
                const simID = this.simID(boss.id, dungeonID);
                dataSet[dataSet.length - 1] = this.getBarValue(
                    true,
                    this.monsterSimData[simID],
                    keyValue
                );
            }
        } else if (this.parent.viewedDungeonID) {
            // slayer tasks
            const taskID = this.parent.viewedDungeonID;
            this.slayerTaskMonsters[taskID].forEach((monsterID: any) => {
                if (!isSignet) {
                    dataSet.push(
                        this.getBarValue(
                            true,
                            this.monsterSimData[monsterID],
                            keyValue
                        )
                    );
                } else {
                    dataSet.push(0);
                }
            });
        }
        return dataSet;
    }

    getValue(filter: any, data: any, keyValue: any, scale: any) {
        if (filter && data.simSuccess) {
            return (
                this.getAdjustedData(data, keyValue) *
                this.getTimeMultiplier(data, keyValue, scale)
            );
        }
        return NaN;
    }

    getBarValue(filter: any, data: any, keyValue: any) {
        return this.getValue(filter, data, keyValue, this.selectedPlotScales);
    }

    getTimeMultiplier(data: any, keyValue: any, scale: any) {
        let dataMultiplier = 1;
        if (scale) {
            dataMultiplier = this.parent.timeMultiplier;
        }
        if (this.parent.timeMultiplier === -1 && scale) {
            dataMultiplier = this.getAdjustedData(data, "killTimeS");
        }
        if (keyValue === "petChance") {
            dataMultiplier = 1;
        }
        return dataMultiplier;
    }

    getAdjustedData(data: any, tag: any) {
        if (this.parent.consumables.applyRates) {
            if (data.adjustedRates[tag] !== undefined) {
                return data.adjustedRates[tag];
            }
        }
        return data[tag];
    }

    getRawData() {
        const dataSet: any[] = [];
        if (!this.parent.isViewingDungeon) {
            // Compile data from monsters in combat zones
            this.micsr.monsterIDs.forEach((monsterID: any) => {
                dataSet.push(this.monsterSimData[monsterID]);
            });
            // Perform simulation of monsters in dungeons
            this.micsr.dungeonIDs.forEach((dungeonID: any) => {
                dataSet.push(this.dungeonSimData[dungeonID]);
            });
            // Perform simulation of monsters in slayer tasks
            this.micsr.taskIDs.forEach((taskID) => {
                dataSet.push(this.slayerSimData[taskID]);
            });
        } else if (this.micsr.isDungeonID(this.parent.viewedDungeonID)) {
            // dungeons
            const dungeonID = this.parent.viewedDungeonID;
            this.micsr.dungeons
                .getObjectByID(dungeonID!)!
                .monsters.forEach((monster: any) => {
                    dataSet.push(
                        this.monsterSimData[this.simID(monster.id, dungeonID)]
                    );
                });
        } else if (this.parent.viewedDungeonID) {
            // slayer tasks
            const taskID = this.parent.viewedDungeonID;
            this.slayerTaskMonsters[taskID].forEach((monsterID: any) => {
                dataSet.push(this.monsterSimData[monsterID]);
            });
        }
        return dataSet;
    }

    /**
     * Finds the monsters/dungeons you can currently fight
     * @return {boolean[]}
     */
    getEnterSet() {
        const enterSet = [];
        // Compile data from monsters in combat zones
        for (const area of this.micsr.combatAreas.allObjects) {
            for (const monster of area.monsters) {
                enterSet.push(true);
            }
        }
        // Wandering Bard
        enterSet.push(true);
        // Check which slayer areas we can access with current stats and equipment
        for (const area of this.micsr.slayerAreas.allObjects) {
            // push `canEnter` for every monster in this zone
            for (const monster of area.monsters) {
                enterSet.push(
                    this.parent.game.checkRequirements(area.entryRequirements)
                );
            }
        }
        // Perform simulation of monsters in dungeons and auto slayer
        this.micsr.dungeonIDs.forEach((_: string) => {
            enterSet.push(true);
        });
        this.micsr.taskIDs.forEach((taskID) =>
            this.slayerTaskMonsters[taskID].forEach((_: string) => {
                enterSet.push(true);
            })
        );
        return enterSet;
    }
}

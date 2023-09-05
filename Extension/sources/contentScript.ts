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

async function loadScripts(ctx: Modding.ModContext) {
    const injectableNames = [
        // MICSR object
        "MICSR",
        // common
        "util",
        "modifierNames",
        // class files
        "AgilityCourse",
        "Card",
        "CombatData",
        "CloneData",
        "Consumables",
        "DataExport",
        "Import",
        "ExportCheat",
        "Loot",
        "Plotter",
        "Menu",
        "Simulator",
        "SimGame",
        "SimEnemy",
        "SimManager",
        "SimPlayer",
        "TabCard",
        // uses the other classes
        "App",
    ];
    for (let i = 0; i < injectableNames.length; i++) {
        const scriptPath = `built/injectable/${injectableNames[i]}.js`;
        await ctx.loadScript(scriptPath);
    }
    // await ctx.loadScript('built/workers/simulator.js');
}

export function setup(setupContext: Modding.ModContext) {
    const isDeveloper =
        false &&
        // @ts-expect-error
        cloudManager.accountInfo.TitleInfo.DisplayName === "MyPickle";
    loadScripts(setupContext);
    let general: any = null;
    // Hide settings for now until we have some real settings
    if (isDeveloper) {
        general = setupContext.settings.section("General");
        general.add({
            type: "switch",
            name: "development-mode",
            label: "Development Mode Enabled",
            default: false,
        } as unknown as Modding.Settings.SettingConfig);
    }

    setupContext.onCharacterSelectionLoaded(() => {
        try {
            if (isDeveloper) {
                console.clear();
                // Load character
                $("#save-slot-display-3")
                    .find("button.btn-gamemode-standard")
                    .trigger("click");
                // Accept warning
                $("button.swal2-confirm").trigger("click");
            }
        } catch (error) {
            // Do nothing, developer stuff
        }
    });

    setupContext.onInterfaceReady(async (characterContext) => {
        sidebar.category("Modding").item("Combat Simulator", {
            icon: "assets/media/skills/combat/combat.png",
            itemClass: "micsr-open-button",
            onRender: (elements) => {
                const itemElement = $(elements.itemEl);
                itemElement.attr("data-toggle", "modal");
                itemElement.attr("data-target", "#mcsModal");
            },
        });

        const urls = {
            crossedOut: characterContext.getResourceUrl("icons/crossedOut.svg"),
            simulationWorker: characterContext.getResourceUrl(
                "built/workers/simulator.js"
            ),
        };
        let isDev = false;
        if (general && isDeveloper) {
            isDev = general.get("development-mode") as boolean;
        }
        const micsr = new MICSR(isDev);
        if (isDev) {
            localStorage.setItem("MICSR-gameVersion", gameVersion);
        }
        // localStorage.removeItem("MICSR-gameVersion");

        const modalID = "mcsModal";
        const modal = Menu.addModal(`${micsr.name} ${micsr.version}`, modalID);

        // micsr.log('Loading sim with provided URLS');
        let tryLoad = micsr.tryLoad();
        if (tryLoad) {
            try {
                const saveString = game.generateSaveString();
                const reader = new SaveWriter("Read", 1);
                const saveVersion = reader.setDataFromSaveString(saveString);
                const simGame = new SimGame(micsr, false);

                await micsr.fetchData();
                await micsr.initialize(simGame, game);

                simGame.decode(reader, saveVersion);
                simGame.onLoad();
                simGame.resetToBlankState();

                const app = new App(game, simGame);
                await app.initialize(urls, modal);
                if (micsr.wrongVersion) {
                    micsr.log(
                        `${micsr.name} ${micsr.version} loaded, but simulation results may be inaccurate due to game version incompatibility.`
                    );
                    micsr.log(
                        `No further warnings will be given when loading the simulator in Melvor ${gameVersion}`
                    );
                    localStorage.setItem("MICSR-gameVersion", gameVersion);
                } else {
                    micsr.log(`${micsr.name} ${micsr.version} loaded.`);
                }
                // @ts-expect-error
                window.micsr_app = app;
                if (micsr.isDev) {
                    // Auto open the combat sim menu
                    $(".micsr-open-button").trigger("click");
                    // Import set
                    $("[id='MCS 1 Button']").trigger("click");
                    // $("[id='MCS 2 Button']").trigger("click");

                    // Select Agility tab
                    // $("#mcs-mcsmaintab-agility-tab").trigger("click");
                    // Select Astrology tab
                    // $("#mcs-mcsmaintab-astrology-tab-image").trigger("click");

                    // Specific test
                    // const settings = app.import.exportSettings();
                    // settings.levels.forEach((v, k, m) => {
                    //     m.set(k, 120);
                    // });
                    // settings.foodSelected = "melvorF:Apple_Pie";
                    const settings = app.import.convertStringToObject(
                        JSON.stringify({
                            version: "v2.0.0",
                            astrologyModifiers: [],
                            course: [],
                            courseMastery: [],
                            equipment: [
                                "melvorTotH:Slayer_Wizard_Hat_Mythical",
                                "melvorTotH:Vorloran_Devastator_Platebody",
                                "melvorTotH:Vorloran_Devastator_Platelegs",
                                "melvorTotH:Vorloran_Devastator_Boots",
                                "melvorF:Cloudburst_Staff",
                                "melvorF:Cloudburst_Staff",
                                "melvorD:Fury_of_the_Elemental_Zodiac",
                                "melvorF:Ring_Of_Wealth",
                                "melvorTotH:Vorloran_Devastator_Gauntlets",
                                "melvorD:Empty_Equipment",
                                "melvorTotH:Superior_Cape_Of_Completion",
                                "melvorD:Empty_Equipment",
                                "melvorF:Summoning_Familiar_Witch",
                                "melvorF:Summoning_Familiar_Dragon",
                                "melvorD:Empty_Equipment",
                            ],
                            levels: {
                                dataType: "Map",
                                value: [
                                    ["melvorD:Attack", 120],
                                    ["melvorD:Strength", 120],
                                    ["melvorD:Defence", 120],
                                    ["melvorD:Hitpoints", 120],
                                    ["melvorD:Ranged", 120],
                                    ["melvorD:Magic", 120],
                                    ["melvorD:Prayer", 120],
                                    ["melvorD:Slayer", 120],
                                    ["melvorD:Woodcutting", 120],
                                    ["melvorD:Fishing", 120],
                                    ["melvorD:Firemaking", 120],
                                    ["melvorD:Cooking", 120],
                                    ["melvorD:Mining", 120],
                                    ["melvorD:Smithing", 120],
                                    ["melvorD:Thieving", 120],
                                    ["melvorD:Farming", 120],
                                    ["melvorD:Fletching", 120],
                                    ["melvorD:Crafting", 120],
                                    ["melvorD:Runecrafting", 120],
                                    ["melvorD:Herblore", 120],
                                    ["melvorD:Agility", 120],
                                    ["melvorD:Summoning", 120],
                                    ["melvorD:Astrology", 120],
                                    ["melvorD:Township", 120],
                                ],
                            },
                            petUnlocked: [
                                "melvorD:PuddingDuckie",
                                "melvorD:Pyro",
                                "melvorD:Cris",
                                "melvorD:CoolRock",
                                "melvorD:PuffTheBabyDragon",
                                "melvorD:LarryTheLonelyLizard",
                                "melvorD:Bruce",
                                "melvorD:LilRon",
                                "melvorD:Leonardo",
                                "melvorD:FinnTheCat",
                                "melvorD:Ty",
                                "melvorD:Chick",
                                "melvorD:Zarrah",
                                "melvorD:Chio",
                                "melvorD:BouncingBob",
                                "melvorD:Rosey",
                                "melvorD:Ayyden",
                                "melvorD:ArcticYeti",
                                "melvorD:Mac",
                                "melvorD:FestiveCoolRock",
                                "melvorD:FestiveChio",
                                "melvorF:Snek",
                                "melvorF:Quill",
                                "melvorF:Gunter",
                                "melvorF:Gronk",
                                "melvorF:Marahute",
                                "melvorF:Salem",
                                "melvorF:Monkey",
                                "melvorF:Asura",
                                "melvorF:Peri",
                                "melvorF:Otto",
                                "melvorF:JellyJim",
                                "melvorF:Harley",
                                "melvorF:Singe",
                                "melvorF:Aquarias",
                                "melvorF:Norman",
                                "melvorF:Erran",
                                "melvorF:Ren",
                                "melvorF:Sam",
                                "melvorF:Mark",
                                "melvorF:Astro",
                                "melvorF:B",
                                "melvorF:Marcy",
                                "melvorF:Roger",
                                "melvorF:Ace",
                                "melvorF:Layla",
                                "melvorF:MisterFuzzbutt",
                                "melvorF:OctaviusLepidus",
                                "melvorF:Saki",
                            ],
                            styles: {
                                magic: "melvorD:Magic",
                                melee: "melvorD:Slash",
                                ranged: "melvorD:Rapid",
                            },
                            prayerSelected: [
                                "melvorF:Augury",
                                "melvorF:Mystic_Mastery",
                            ],
                            spells: {
                                ancient: "",
                                archaic: "",
                                aurora: "melvorF:FuryII",
                                curse: "melvorF:AnguishIII",
                                standard: "melvorD:WaterSurge",
                            },
                            autoEatTier: 2,
                            cookingMastery: true,
                            cookingPool: true,
                            currentGamemodeID: "melvorD:Standard",
                            foodSelected: "melvorF:Apple_Pie",
                            healAfterDeath: true,
                            isManualEating: false,
                            isSlayerTask: false,
                            pillarID: "melvorF:PillarofCombat",
                            pillarEliteID: "",
                            potionID: "melvorF:Damage_Reduction_Potion_IV",
                            useCombinationRunes: false,
                        })
                    );
                    // app.import.importSettings(settings);

                    // var slayer = true;
                    // if (slayer) {
                    // Enable slayer
                    $("[id='MCS Slayer Task Radio Yes']").trigger("click");
                    // }

                    // Start sim all
                    // Low trial count for fast simulate all
                    // micsr.trials = 1e2;
                    // $("[id='MCS # Trials Input'").val(micsr.trials);
                    // $("[id='MCS Simulate All Button']").trigger("click");

                    // High trial count for development for consistent numbers
                    // micsr.trials = 2e4;
                    // $("[id='MCS # Trials Input'").val(micsr.trials);
                    // Click monster
                    // const imageID = app.barMonsterIDs.findIndex(
                    //     (v) => v === "melvorD:Plant"
                    // );
                    // const imageID = app.barMonsterIDs.findIndex(
                    //     (v) => v === "melvorD:GiantCrab"
                    // );
                    const imageID = app.barMonsterIDs.findIndex(
                        (v) => v === "Easy"
                    );
                    // const imageID = app.barMonsterIDs.findIndex((v) => v === "melvorD:BlackDragon");
                    // const imageID = app.barMonsterIDs.findIndex((v) => v === "melvorTotH:IceHydra");
                    // if (slayer) {
                    // Filter slayer
                    $($(".mcsXAxisImageContainer")[imageID]).trigger("click");
                    // }

                    $($(".mcs-bar-container")[imageID]).trigger("click");
                    // Start sim selected
                    // $("[id='MCS Simulate Selected Button']").trigger("click");
                    // $("[id='MCS Simulate BLOCKING Button']").trigger("click");
                }
            } catch (error: any) {
                let baseString = `${micsr.name} ${micsr.version} was not loaded due to the following error:`;
                micsr.warn(baseString);
                micsr.error(error);
                const modalContent = $(modal).find(".modal-content");
                modalContent.append(`${baseString} ${error}`);
                if (error.stack) {
                    modalContent.append(
                        `Stacktrace: ${(error as Error).stack?.replace(
                            "\n",
                            "<br />"
                        )}`
                    );
                }
            }
        } else {
            micsr.warn(
                `${micsr.name} ${micsr.version} was not loaded due to game version incompatibility.`
            );
        }
    });
}

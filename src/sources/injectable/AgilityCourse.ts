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

interface IObstacle {
    [index: string]: any;
    category: ObstacleCategories | -1;
    index: number;
    id: string;
    description: string;
    media: string;
    modifiers: any;
    name: string;
    requirements: any;
}

interface IAgilityFilter {
    tag: string;
    text: string;
    media: string;
}

/**
 * Class for the cards in the bottom of the ui
 */
class AgilityCourse {
    agilityCategories: number;
    agilityObstacles: IObstacle[];
    agilityPillars: IObstacle[];
    eliteAgilityPillars: IObstacle[];
    player: SimPlayer;
    filter: IAgilityFilter;
    filters: IAgilityFilter[];
    id: any;
    media: any;
    parent: App;
    tmpModifiers: any;
    micsr: MICSR;
    blueprints?: AgilityBlueprints;
    blueprintDropdown?: HTMLDivElement;

    constructor(parent: App, player: SimPlayer, filters: IAgilityFilter[]) {
        this.parent = parent;
        this.micsr = parent.micsr;
        this.player = player;
        this.filters = filters;
        this.filter = this.filters[0];
        this.id = Date.now();
        this.tmpModifiers = new PlayerModifiers();

        // icons
        this.media = {
            combat: "assets/media/skills/combat/combat.svg",
            gp: "assets/media/main/coins.svg",
            mastery: "assets/media/main/mastery_header.svg",
            stamina: "assets/media/main/stamina.svg",
            statistics: "assets/media/main/statistics_header.svg",
        };

        // Copy obstacles
        this.agilityCategories = this.parent.game.agility.maxObstacles;
        const noObstacle: IObstacle = {
            category: -1,
            index: -1,
            id: "",
            description: "",
            media: this.media.stamina,
            modifiers: {},
            name: "None",
            requirements: {},
        };
        this.agilityObstacles = [
            noObstacle,
            ...this.parent.game.agility.actions.allObjects.map(
                (x, index) => {
                    const obstacle: IObstacle = {
                        category: x.category,
                        description: "",
                        index: index,
                        id: x.id,
                        media: x.media,
                        modifiers: x.modifiers,
                        name: x.name,
                        requirements: x.skillRequirements,
                    };
                    this.filters.forEach(
                        (filter) =>
                            (obstacle[filter.tag] =
                                this.micsr.showModifiersInstance.printRelevantModifiers(
                                    x.modifiers,
                                    filter.tag
                                ).length > 0)
                    );
                    return obstacle;
                }
            ),
        ];
        this.agilityPillars = [
            noObstacle,
            ...this.parent.game.agility.pillars.allObjects.map(
                (x, index) => {
                    const pillar: IObstacle = {
                        category: -1,
                        description: "",
                        index: index,
                        id: x.id,
                        media: [
                            this.media.combat,
                            this.media.statistics,
                            this.media.gp,
                            this.media.stamina,
                        ][index],
                        modifiers: x.modifiers,
                        name: x.name,
                        requirements: {},
                    };
                    this.filters.forEach(
                        (filter) =>
                            (pillar[filter.tag] =
                                this.micsr.showModifiersInstance.printRelevantModifiers(
                                    x.modifiers,
                                    filter.tag
                                ).length > 0)
                    );
                    return pillar;
                }
            ),
        ];
        this.eliteAgilityPillars = [
            noObstacle,
            ...this.parent.game.agility.elitePillars.allObjects.map(
                (x, index) => {
                    const pillar: IObstacle = {
                        category: -1,
                        description: "",
                        index: index,
                        id: x.id,
                        media: [
                            this.media.combat,
                            this.media.statistics,
                            this.media.gp,
                            this.media.stamina,
                        ][index],
                        modifiers: x.modifiers,
                        name: x.name,
                        requirements: {},
                    };
                    this.filters.forEach(
                        (filter: any) =>
                            (pillar[filter.tag] =
                                this.micsr.showModifiersInstance.printRelevantModifiers(
                                    x.modifiers,
                                    filter.tag
                                ).length > 0)
                    );
                    return pillar;
                }
            ),
        ];
    }

    updateBlueprints(blueprints: AgilityBlueprints) {
        this.blueprints = new Map(blueprints);
        this.createBlueprints();
    }

    selectBlueprint(event: Event) {
        const blueprint = this.blueprints?.get(parseInt((<any>event.target)!.value));

        if (!blueprint) {
            return;
        }

        const chosenAgilityObstacles = new Array(this.parent.agilityCourse.agilityCategories).fill(-1);
        const courseMastery = new Array(this.parent.agilityCourse.agilityCategories).fill(false);

        const builtObstacles = Array.from(blueprint.obstacles.values());

        this.parent.actualGame.agility.actions.allObjects.forEach(
            (obstacle, i) => {
                const builtObstacle = builtObstacles.find(builtObstacle => builtObstacle.id === obstacle.id);
                if (builtObstacle) {
                    chosenAgilityObstacles[obstacle.category] = i;

                    if (this.parent.actualGame.agility.getMasteryLevel(obstacle) >= 99) {
                        courseMastery[obstacle.category] = true;
                    }
                }
            }
        );

        this.importAgilityCourse(chosenAgilityObstacles, courseMastery, blueprint.pillar?.id ?? '', blueprint.elitePillar?.id ?? '');
        this.parent.agilityCourseCallback();
    }

    createBlueprints() {
        if (this.blueprintDropdown) {
            this.blueprintDropdown.remove();
            this.blueprintDropdown = undefined;
        }

        const text = this.blueprints ? Array.from(this.blueprints.values()).map(val => val.name) : ['Empty'];
        const values = this.blueprints ? Array.from(this.blueprints.keys()).map(id => id) : ['Empty'];

        this.blueprintDropdown = this.parent.agilitySelectCard.addDropdown(
            "Blueprints",
            text,
            values,
            (event: any) => this.selectBlueprint(event)
        ).container;

        this.parent.agilitySelectCard.container.firstChild.after(this.blueprintDropdown);
    }

    createAgilityCourseContainer(card: Card, filter: IAgilityFilter) {
        this.filter = filter;
        card.addSectionTitle("Agility Course");

        this.createBlueprints();

        for (let i = 0; i < this.agilityCategories + 2; i++) {
            let category: number | "pillar" | "elite" = i;
            if(i === this.agilityCategories + 1){
                category = "elite";
            }
            else if (i === this.agilityCategories){
                category = "pillar";
            }
            const obstacleSelectionContainer = card.createCCContainer();
            // Mastery button
            if (typeof category === "number" && category < this.agilityCategories) {
                const masteryButton = card.createImageButton(
                    this.media.mastery,
                    `Agility Mastery ${category} ${this.id} Toggle`,
                    (event) => this.agilityMasteryOnClick(event, category as number),
                    "Small",
                    "99 Mastery"
                );
                masteryButton.className += " col-3";
                obstacleSelectionContainer.appendChild(masteryButton);
            }
            else {
                const emptyDiv = document.createElement("div");
                emptyDiv.className += " col-3";
                obstacleSelectionContainer.appendChild(emptyDiv);
            }
            // popup
            card.addMultiAgilityPopupMenu(
                [this.media.stamina],
                [`MICSR Obstacle ${category} ${this.id} Image`],
                [this.createAgilityPopup(category, filter)],
                ["None"],
                obstacleSelectionContainer
            );
            // label
            const labelDiv = document.createElement("div");
            labelDiv.className = "col-6";
            labelDiv.setAttribute(
                "style",
                "display: table; text-align: center;"
            );
            const label = document.createElement("label");
            label.id = `MICSR Obstacle ${category} ${this.id} Label`;
            label.textContent = "None";
            label.setAttribute(
                "style",
                "display: table-cell; vertical-align: middle;"
            );
            labelDiv.appendChild(label);
            obstacleSelectionContainer.appendChild(labelDiv);
            // add selection container to card
            card.container.appendChild(obstacleSelectionContainer);
        }
    }

    /** Adds a multi-button with agility obstacle to the agility obstacle select popup
     * @param {Card} card The parent card
     * @param {number} category The obstacle index
     */
    addObstacleMultiButton(
        card: Card,
        title: string,
        category: number | "pillar" | "elite",
        filter: string,
        isProp: boolean
    ) {
        let menuItems: IObstacle[] = [];
        if (category === "elite") {
            menuItems = this.eliteAgilityPillars;
        } else if (category === "pillar") {
            menuItems = this.agilityPillars;
        } else {
            menuItems = this.agilityObstacles.filter(
                (x) =>
                    x.category === -1 ||
                    (x[filter] === isProp && x.category === category)
            );
        }
        if (menuItems.length <= 1) {
            return;
        }
        const buttonMedia = menuItems.map((obstacle) => obstacle.media);
        const buttonIds = menuItems.map(
            (obstacle) => `${obstacle.name} ${this.id}`
        );
        const buttonCallbacks = menuItems.map((obstacle) => () => {
            this.selectObstacle(category, obstacle);
            this.parent.agilityCourseCallback();
        });
        const tooltips = menuItems.map((obstacle) =>
            this.getObstacleTooltip(category, obstacle)
        );
        card.addSectionTitle(title);
        card.addImageButtons(
            buttonMedia,
            buttonIds,
            "Small",
            buttonCallbacks,
            tooltips,
            "100%"
        );
    }

    getObstacleTooltip(
        category: number | "pillar" | "elite",
        obstacle: IObstacle
    ) {
        let passives = `<div class="text-center">${obstacle.name}</div>`;
        let negativeMultiplier = 1;

        if(typeof category === "number"){
            negativeMultiplier = this.player.courseMastery[category] ? 0.5 : 1;
        }

        if ((<any>this.micsr.game.agility).hasMasterRelic) {
            negativeMultiplier = 0;
        }

        this.tmpModifiers.addModifiers(
            obstacle.modifiers,
            negativeMultiplier
        );
        this.micsr.showModifiersInstance
            .printRelevantModifiers(this.tmpModifiers, this.filter.tag)
            .forEach((toPrint: any) => {
                passives += `<div class="${toPrint[1]}">${toPrint[0]}</div>`;
            });
        this.tmpModifiers.reset();
        return passives;
    }

    createAgilityPopup(
        category: number | "pillar" | "elite",
        filter: IAgilityFilter
    ) {
        const obstacleSelectPopup = document.createElement("div");
        obstacleSelectPopup.className = "mcsPopup";
        obstacleSelectPopup.setAttribute("style", "width:350px;");
        const obstacleSelectCard = new Card(
            this.micsr,
            obstacleSelectPopup,
            "",
            "600px"
        );
        if (category === "pillar") {
            this.addObstacleMultiButton(
                obstacleSelectCard,
                "Pillars",
                category,
                filter.tag,
                true
            );
        } else if (category === "elite") {
            this.addObstacleMultiButton(
                obstacleSelectCard,
                "Elite Pillars",
                category,
                filter.tag,
                true
            );
        } else {
            this.addObstacleMultiButton(
                obstacleSelectCard,
                `${filter.text} Obstacles`,
                category,
                filter.tag,
                true
            );
            this.addObstacleMultiButton(
                obstacleSelectCard,
                "Other Obstacles",
                category,
                filter.tag,
                false
            );
        }
        return obstacleSelectPopup;
    }

    selectObstacle(category: number | "pillar" | "elite", obstacle: IObstacle) {
        const label = document.getElementById(
            `MICSR Obstacle ${category} ${this.id} Label`
        )!;
        label.textContent = obstacle.name;
        this.setObstacleImage(category, obstacle);
        if (category === "pillar") {
            this.player.pillarID = obstacle.id;
        } else if (category === "elite") {
            this.player.pillarEliteID = obstacle.id;
        } else {
            const existingObstacle = this.parent.game.agility.actions.allObjects.find((_, i) => i === this.player.course[category])!;

            if (obstacle.category === -1) {
                // deselecting, remove from mastery regardless of being enabled
                if (existingObstacle) {
                    this.parent.game.agility['actionMastery'].set(existingObstacle, { level: 1, xp: 1 });
                }
                this.player.course[category] = -1;
            } else {
                // remove any existing obstacle
                if (existingObstacle) {
                    this.parent.game.agility['actionMastery'].set(existingObstacle, { level: 1, xp: 1 });
                }

                const realObstacle = this.parent.game.agility.actions.allObjects.find((_, i) => i === obstacle.index)!;

                // add obstacle to mastery if enabled
                if (this.player.courseMastery[category] && realObstacle) {
                    this.parent.game.agility['actionMastery'].set(realObstacle, { level: 99, xp: 13100000 });
                }

                this.player.course[category] = obstacle.index;
            }
        }
    }

    /**
     * Change the obstacle image
     */
    setObstacleImage(
        category: number | "pillar" | "elite",
        obstacle: IObstacle
    ) {
        const img = document.getElementById(
            `MICSR Obstacle ${category} ${this.id} Image`
        );
        (img as any).src = obstacle.media;
        (img as any)._tippy.setContent(
            this.getObstacleTooltip(category, obstacle)
        );
    }

    updateAgilityTooltips(category: number) {
        this.agilityObstacles.forEach((obstacle) => {
            if (obstacle.category !== category) {
                return;
            }
            const button = document.getElementById(`MCS ${obstacle.name} ${this.id} Button`);
            (button as any)?._tippy?.setContent(this.getObstacleTooltip(category, obstacle));
        });
        const obstacle = this.agilityObstacles[this.player.course[category] + 1];
        const img = document.getElementById(`MICSR Obstacle ${category} ${this.id} Image`);
        (img as any)?._tippy?.setContent(this.getObstacleTooltip(category, obstacle));
    }

    updateAllAgilityTooltips() {
        this.player.course.forEach((_, category) => {
            this.updateAgilityTooltips(category);
        });

        this.agilityObstacles.forEach((obstacle) => {
            const button = document.getElementById(`MCS ${obstacle.name} ${this.id} Button`);
            (button as any)?._tippy?.setContent(this.getObstacleTooltip(obstacle.category, obstacle));
        });
    }

    agilityMasteryOnClick(event: MouseEvent, category: number) {
        const obstacle = this.parent.game.agility.actions.allObjects.find((_, i) => i === this.parent.player.course[category])!;

        // toggle
        if (this.player.courseMastery[category]) {
            this.player.courseMastery[category] = false;
            if (obstacle) {
                this.parent.game.agility['actionMastery'].set(obstacle, { level: 1, xp: 1 });
            }
            this.parent.unselectButton(
                event.currentTarget as HTMLButtonElement
            );
        } else {
            this.player.courseMastery[category] = true;
            if(obstacle) {
                this.parent.game.agility['actionMastery'].set(obstacle, { level: 99, xp: 13100000 });
            }
            this.parent.selectButton(event.currentTarget as HTMLButtonElement);
        }
        // update tool tips
        this.updateAgilityTooltips(category);
        // callback
        this.parent.agilityCourseCallback();
    }

    importAgilityCourse(
        courseObstacles: number[],
        masteries: boolean[],
        pillarID: string,
        elitePillarID: string
    ) {
        // clear current values
        this.player.course = Array(this.agilityCategories).fill(-1);
        this.player.courseMastery = Array(this.agilityCategories).fill(false);
        // import settings
        this.player.course.forEach((_, category) => {
            let obstacleID = courseObstacles[category];
            if (obstacleID === undefined) {
                obstacleID = -1;
            }
            this.selectObstacle(
                category,
                this.agilityObstacles[obstacleID + 1]
            );
            if (masteries[category]) {
                this.player.courseMastery[category] = true;
                const obstacle = this.parent.game.agility.actions.allObjects.find((_, i) => i === this.parent.player.course[category])!;
                if(obstacle) {
                    this.parent.game.agility['actionMastery'].set(obstacle, { level: 99, xp: 13100000 });
                }
            }
        });
        this.player.pillarID = pillarID;
        if (pillarID !== undefined) {
            this.selectObstacle(
                "pillar",
                this.agilityPillars[
                    this.player.game.agility.pillars.allObjects.findIndex(
                        (v) => v.id === pillarID
                    ) + 1
                ]
            );
        }
        this.player.pillarEliteID = elitePillarID;
        if (elitePillarID !== undefined) {
            this.selectObstacle(
                "elite",
                this.eliteAgilityPillars[
                    this.player.game.agility.elitePillars.allObjects.findIndex(
                        (v) => v.id === elitePillarID
                    ) + 1
                ]
            );
        }
        // set image selection
        this.player.courseMastery.forEach((m, i) => {
            const elt = document.getElementById(
                `MCS Agility Mastery ${i} ${this.id} Toggle Button`
            );
            if (elt) {
                if (m) {
                    this.parent.selectButton(elt);
                } else {
                    this.parent.unselectButton(elt);
                }
            }
        });

        this.updateAllAgilityTooltips();
    }
}

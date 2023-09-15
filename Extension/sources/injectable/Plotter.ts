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
 * A Card Class that creates a bar plot
 */
class Plotter {
    barBottomBrackets: any;
    barBottomDivs: any;
    barBottomLength: any;
    barBottomNames: any;
    barGap: any;
    barImageSrc: any;
    barNames: any;
    barTooltips: any;
    barWidth: any;
    bars: any;
    gridLine: any;
    inspectButton: any;
    maskImageFile: any;
    parent: App;
    petSkillDropdown: any;
    plotBox: any;
    plotContainer: any;
    plotHeader: any;
    plotID: any;
    plotTopContainer: any;
    plotType: any;
    stopInspectButton: any;
    tickText: any;
    timeDropdown: any;
    toggleDungeonButton: any;
    toggleMonsterButton: any;
    toggleSlayerButton: any;
    xAxis: any;
    xAxisContainers: any;
    xAxisCrosses: any;
    xAxisImages: any;
    yAxis: any;
    micsr: MICSR;

    /**
     * Consctructs an instance of the plotting class
     * @param {McsApp} parent Reference to container class
     * @param {string} crossedOutURL URL from content script
     */
    constructor(parent: App, crossedOutURL: any) {
        this.micsr = parent.micsr;
        this.parent = parent;
        this.barWidth = 20;
        this.barGap = 1;
        this.barImageSrc = [];
        this.barNames = [];
        this.barBottomNames = [];
        this.barBottomLength = [];
        this.barBottomBrackets = [];
        this.plotType = "xpPerSecond";
        this.plotID = 0;
        this.maskImageFile = crossedOutURL;

        let totBars = 0;

        this.micsr.combatAreas.forEach((area) => {
            totBars += area.monsters.length;
            this.barBottomNames.push(area.name);
            this.barBottomLength.push(area.monsters.length);
            area.monsters.forEach((monster) => {
                this.barNames.push(monster.name);
                this.barImageSrc.push(monster.media);
            });
        });
        totBars += 1;
        this.barBottomNames.push("");
        this.barBottomLength.push(1);
        this.barNames.push(this.parent.getMonsterName(this.micsr.bardID));
        this.barImageSrc.push(
            this.micsr.monsters.getObjectByID(this.micsr.bardID)!.media
        );
        this.micsr.slayerAreas.forEach((area) => {
            totBars += area.monsters.length;
            this.barBottomNames.push(area.name);
            this.barBottomLength.push(area.monsters.length);
            area.monsters.forEach((monster) => {
                this.barNames.push(monster.name);
                this.barImageSrc.push(monster.media);
            });
        });

        this.barBottomNames.push("Dungeons");
        this.barBottomLength.push(this.micsr.dungeons.allObjects.length);
        totBars += this.micsr.dungeons.allObjects.length;
        for (const area of this.micsr.dungeons.allObjects) {
            this.barNames.push(this.parent.getDungeonName(area));
            this.barImageSrc.push(area.media);
        }

        this.barBottomNames.push("Auto Slayer");
        this.barBottomLength.push(this.micsr.slayerTaskData.length);
        totBars += this.micsr.slayerTaskData.length;
        for (const slayerTask of this.micsr.slayerTaskData) {
            this.barNames.push(slayerTask.display);
            this.barImageSrc.push(this.micsr.game.slayer.media);
        }

        this.plotContainer = document.createElement("div");
        this.plotContainer.className =
            "mcsPlotContainer mcsOuter block block-rounded border-top border-combat border-4x bg-combat-inner-dark";
        this.plotContainer.id = "MCS Plotter";

        this.plotHeader = document.createElement("div");
        this.plotHeader.className = "mcsPlotHeader";
        this.parent.plotHeaderContent = this.plotHeader;

        const plotHeaderSelects = document.createElement("div");
        plotHeaderSelects.className = "d-flex mr-auto";
        this.plotHeader.appendChild(plotHeaderSelects);

        const test = new Card(
            this.micsr,
            plotHeaderSelects,
            "",
            "150px",
            false,
            '',
            'plot-type-header-container'
        );

        const { dropdown: skillTypeSelect } = test.addDropdown(
            "Pets",
            this.parent.skillKeys,
            this.parent.skillKeys,
            (event: any) => this.parent.petSkillDropdownOnChange(event)
        );

        this.petSkillDropdown = skillTypeSelect;

        const { dropdown: plotTypeSelect } = test.addDropdown(
            "PlotType",
            this.parent.plotTypes.map((t: any) => t.option),
            this.parent.plotTypes.map((t: any)=> t.value),
            (event: any) => this.parent.plottypeDropdownOnChange(event)
        );

        const { dropdown: timeDropdown } = test.addDropdown(
            "Time",
            this.parent.timeOptions.map((t: any) => t),
            this.parent.timeOptions.map((t: any, index: number) => this.parent.timeMultipliers[index]),
            (event: any) => this.parent.timeUnitDropdownOnChange(event)
        );

        this.timeDropdown = timeDropdown;

        this.plotTopContainer = document.createElement("div");
        this.plotTopContainer.className = "mcsPlotTopContainer";
        this.plotTopContainer.id = "MCS Plotter Top Container";
        this.plotContainer.appendChild(this.plotTopContainer);

        this.yAxis = document.createElement("div");
        this.yAxis.id = "MCS Plotter Y-Axis";
        this.yAxis.className = "mcsYAxis";
        this.plotTopContainer.appendChild(this.yAxis);

        this.plotBox = document.createElement("div");
        this.plotBox.className = "mcsPlotBox";
        this.plotTopContainer.appendChild(this.plotBox);

        this.xAxis = document.createElement("div");
        this.xAxis.className = "mcsXAxis";
        this.xAxis.id = "MCS Plotter X-Axis";
        this.plotContainer.appendChild(this.xAxis);

        // Do Gridlines
        this.gridLine = [];
        for (let i = 0; i < 20; i++) {
            this.gridLine.push(document.createElement("div"));
            this.gridLine[i].className = "mcsGridline";
            this.gridLine[i].setAttribute("style", `bottom: ${(i + 1) * 5}%;`);
            this.plotBox.appendChild(this.gridLine[i]);
        }

        // Do Bars and images
        this.xAxisImages = [];
        this.xAxisCrosses = [];
        this.xAxisContainers = [];
        this.bars = [];
        for (let i = 0; i < totBars; i++) {
            const bar = document.createElement("div");
            bar.className = "mcsBar";
            bar.style.height = "0";
            const barContainer = document.createElement("div");
            barContainer.className = "mcs-bar-container";
            barContainer.appendChild(bar);
            this.bars.push(bar);
            this.plotBox.appendChild(barContainer);

            const imageContainer = document.createElement("div");
            imageContainer.className = "mcsXAxisImageContainer";
            imageContainer.onclick = () => this.parent.barImageOnClick(i);
            this.xAxisContainers.push(imageContainer);

            this.xAxisImages.push(document.createElement("img"));
            this.xAxisImages[i].className = "mcsXAxisImage";
            this.xAxisImages[i].src = this.barImageSrc[i];

            const newCross = document.createElement("img");
            newCross.src = this.maskImageFile;
            newCross.className = "mcsCross";
            // if (this.micsr.isDev) {
            //     newCross.style.display = 'none';
            // }
            this.xAxisCrosses.push(newCross);

            imageContainer.appendChild(this.xAxisImages[i]);
            imageContainer.appendChild(newCross);
            this.xAxis.appendChild(imageContainer);
        }

        // Do Second descriptions
        let botLength = 0;
        this.barBottomDivs = [];
        let divi = 0;
        for (let i = this.barBottomNames.length - 1; i > -1; i--) {
            this.barBottomDivs.push(document.createElement("div"));
            this.barBottomDivs[divi].appendChild(
                document.createTextNode(this.barBottomNames[i])
            );
            this.barBottomDivs[divi].className = "mcsPlotLabel";
            this.barBottomDivs[divi].style.right = `${
                (100 * botLength) / totBars +
                (50 * this.barBottomLength[i]) / totBars
            }%`;
            this.xAxis.appendChild(this.barBottomDivs[divi]);
            const newSect = document.createElement("div");
            newSect.className = "mcsXAxisSection";
            newSect.style.width = `${
                (100 * this.barBottomLength[i]) / totBars
            }%`;
            newSect.style.right = `${(100 * botLength) / totBars}%`;
            if (i === 0) {
                newSect.style.borderLeftStyle = "solid";
            }
            this.barBottomBrackets.push(newSect);
            this.xAxis.appendChild(newSect);
            botLength += this.barBottomLength[i];
            divi++;
        }

        // Do ticktext
        this.tickText = [];
        for (let i = 0; i < 21; i++) {
            this.tickText.push(document.createElement("div"));
            this.tickText[i].className = "mcsTicktext";
            this.tickText[i].setAttribute(
                "style",
                `height: 5%; bottom: ${i * 5 - 2.5}%;`
            );
            this.tickText[i].appendChild(
                document.createTextNode(Util.mcsFormatNum(i * 0.05, 4))
            );
            this.yAxis.appendChild(this.tickText[i]);
        }

        this.parent.botContent.appendChild(this.plotContainer);
    }

    // Add plot buttons
    addToggles(card: any) {
        // Add inspection buttons
        this.inspectButton = card.addButton("Inspect Dungeon", () => {
            this.parent.inspectDungeonOnClick();
        });
        this.inspectButton.style.display = "none";
        this.stopInspectButton = card.addButton("Stop Inspecting", () => {
            this.parent.stopInspectOnClick();
        });
        this.stopInspectButton.style.display = "none";
        // Add toggle buttons
        this.toggleMonsterButton = card.addButton("Toggle Monsters", () => {
            this.parent.toggleMonsterSims();
        });
        this.toggleDungeonButton = card.addButton("Toggle Dungeons", () => {
            this.parent.toggleDungeonSims(
                !this.parent.dungeonToggleState,
                false
            );
        });
        this.toggleSlayerButton = card.addButton("Toggle Auto Slayer", () => {
            this.parent.toggleSlayerSims(!this.parent.slayerToggleState, false);
        });
    }

    /**
     * Toggles the display of a bar tooltip on
     * @param {number} id The ID of the bar
     */
    barOnMouseOver(id: any) {
        this.barTooltips[id].style.display = "block";
    }

    /**
     * Toggles the display of a bar tooltip off
     * @param {number} id The ID of the bar
     */
    barOnMouseOut(id: any) {
        this.barTooltips[id].style.display = "none";
    }

    colourGradient(x: any, base = [70, 130, 180], death = [220, 20, 60]) {
        return base.map((_, i) => (1 - x) * base[i] + x * death[i]);
    }

    /**
     * Changes the displayed data
     * @param {number[]} barData The new data to diplay
     */
    updateBarData(barData: any, rawData: any) {
        const enterSet = this.parent.simulator.getEnterSet();
        let barMax = 0;
        for (let i = 0; i < this.bars.length; i++) {
            this.bars[i].className = "mcsBar";
            if (isNaN(barData[i]) || !isFinite(barData[i])) {
                continue;
            }
            if (i < barData.length && barData[i] > barMax) {
                barMax = barData[i];
            }
        }
        const maxBars = [];
        if (!this.parent.isViewingDungeon) {
            for (let i = 0; i < barData.length; i++) {
                if (Math.abs(barData[i] - barMax) < 0.0000001) {
                    maxBars.push(i);
                }
            }
        }

        let Ndivs = 10;
        let divMax = 1;
        let divPower = 0;
        let closestRatio = 0.1;
        let divDecimals = 1;
        if (barMax !== 0) {
            const divRatio =
                barMax / Math.pow(10, Math.floor(Math.log10(barMax)) + 1);
            if (divRatio >= 0.5) {
                closestRatio = 0.5;
            } else if (divRatio >= 0.25) {
                closestRatio = 0.25;
                divDecimals = 2;
            } else if (divRatio >= 0.2) {
                closestRatio = 0.2;
            } else if (divRatio >= 0.1) {
                closestRatio = 0.1;
            }
            divPower = Math.floor(Math.log10(barMax));
            const division = closestRatio * Math.pow(10, divPower);
            Ndivs = Math.ceil(barMax / division);
            divMax = Ndivs * division;
        }
        // Modify in reverse
        const numBars = this.bars.length;
        const numData = barData.length;
        for (let i = 0; i < numData; i++) {
            const dataIndex = numData - i - 1;
            const barIndex = numBars - i - 1;
            let tooltipText;
            if (isNaN(barData[dataIndex]) || !isFinite(barData[dataIndex])) {
                this.bars[barIndex].style.height = `0%`;
                tooltipText = "N/A";
            } else {
                this.bars[barIndex].style.height = `${
                    (barData[dataIndex] / divMax) * 100
                }%`;
                tooltipText = Util.mcsFormatNum(barData[dataIndex], 4);
            }

            let barName = "";
            if (this.parent.isViewingDungeon) {
                const selection = this.parent.getMonsterList(
                    this.parent.viewedDungeonID
                );
                const monster =
                    selection[barIndex + selection.length - this.bars.length];
                barName = monster.name;
            } else {
                if (this.parent.barIsDungeon(barIndex)) {
                    barName = this.micsr.dungeons.getObjectByID(
                        this.parent.barMonsterIDs[barIndex]
                    )!.name;
                } else if (this.parent.barIsTask(barIndex)) {
                    barName = `${this.parent.barMonsterIDs[barIndex]} Tasks`;
                } else {
                    barName = this.micsr.monsters.getObjectByID(
                        this.parent.barMonsterIDs[barIndex]
                    )!.name;
                }
            }
            // open tooltip and set tooltip title
            let tooltip = `<div class="text-center">${barName}`;
            // set value if available
            if (tooltipText !== "N/A") {
                tooltip += `<br><span class="text-info">${tooltipText}</span>`;
            }
            // set failure text, if any
            const failureText = this.parent.getSimFailureText(
                rawData[dataIndex]
            );
            if (failureText) {
                tooltip += `<br><span style="color:red;">${failureText}</span>`;
            }
            // close tooltip
            tooltip += "</div>";
            // set tooltip content
            this.bars[barIndex]._tippy.setContent(tooltip);
            // color the bar based on death rate
            const base = maxBars.includes(barIndex)
                ? [215, 180, 0]
                : [70, 130, 180];
            const gradient = this.colourGradient(
                rawData[dataIndex].deathRate,
                base
            ).join(",");
            this.bars[barIndex].style.backgroundColor = `rgb(${gradient})`;
        }
        for (let i = 0; i < 20; i++) {
            if (i < Ndivs - 1) {
                this.gridLine[i].style.display = "block";
                this.gridLine[i].style.bottom = `${((i + 1) * 100) / Ndivs}%`;
            } else {
                this.gridLine[i].style.display = "none";
            }
        }
        let formatEnd = "";
        // Use toFixed for tick marks
        if (divPower > 2) {
            formatEnd = ["k", "M", "B", "T"][Math.floor(divPower / 3) - 1];
        }
        if (divPower >= 0) {
            const powerLeft = divPower % 3;
            closestRatio *= Math.pow(10, powerLeft);
        } else {
            closestRatio *= Math.pow(10, divPower);
            divDecimals -= divPower;
        }

        for (let i = 0; i < 21; i++) {
            if (i < Ndivs + 1) {
                this.tickText[i].style.display = "block";
                this.tickText[i].style.bottom = `${(i * 100) / Ndivs - 2.5}%`;
                this.tickText[i].textContent = `${(
                    i * closestRatio
                ).toLocaleString(undefined, {
                    maximumFractionDigits: divDecimals,
                    minimumFractionDigits: divDecimals,
                })}${formatEnd}`;
            } else {
                this.tickText[i].style.display = "none";
            }
        }
    }

    /**
     * Changes the plot display to non-dungeon monsters and dungeon summary
     */
    displayGeneral() {
        for (let i = 0, numBars = this.bars.length; i < numBars; i++) {
            // Change image source
            this.xAxisContainers[i].style.display = "";
            this.xAxisImages[i].setAttribute("src", this.barImageSrc[i]);
            this.bars[i].style.display = "";
        }
        this.showZoneLabels();
        this.crossImagesPerSetting();
        this.stopInspectButton.style.display = "none";
        this.toggleMonsterButton.style.display = "";
        this.toggleDungeonButton.style.display = "";
        this.toggleSlayerButton.style.display = "";
    }

    /**
     * Changes the plot display to individual dungeon monsters
     * @param {number} dungeonID The index of this.micsr.dungeons
     */
    displayDungeon(dungeonID: any) {
        // Loop through each bar and enable/disable as required
        // Change Images at bottom
        // Toggle Zone Labels
        // Toggle display of bars
        // Remove the white border stuff
        const monsters = this.parent.getMonsterList(dungeonID);
        for (let i = 0; i < this.bars.length; i++) {
            if (i < monsters.length) {
                // Change image source
                this.xAxisContainers[i].style.display = "";
                this.xAxisImages[i].setAttribute("src", monsters[i].media);
                this.bars[this.bars.length - i - 1].style.display = "";
            } else {
                // Disable Bar and images
                this.xAxisContainers[i].style.display = "none";
                this.bars[this.bars.length - i - 1].style.display = "none";
            }
        }
        this.hideZoneLabels();
        this.unCrossAllImages();
        this.inspectButton.style.display = "none";
        this.stopInspectButton.style.display = "";
        this.toggleMonsterButton.style.display = "none";
        this.toggleDungeonButton.style.display = "none";
        this.toggleSlayerButton.style.display = "none";
    }

    /**
     * Turns the crossout overlay on for a monster/dungeon image
     * @param {number} imageID the index of the cross
     */
    crossOutBarImage(imageID: any) {
        this.xAxisCrosses[imageID].style.display = "";
    }

    /**
     * Turns the crossout overlay off for a monster/dungeon image
     * @param {number} imageID The index of the cross
     */
    unCrossOutBarImage(imageID: any) {
        this.xAxisCrosses[imageID].style.display = "none";
    }

    /**
     * Toggles the display of the area/dungeon labels off
     */
    hideZoneLabels() {
        this.barBottomDivs.forEach((bottomDiv: any) => {
            bottomDiv.style.display = "none";
        });
        this.barBottomBrackets.forEach((bracket: any) => {
            bracket.style.display = "none";
        });
    }

    /**
     * Toggles the display of the area/dungeon labels on
     */
    showZoneLabels() {
        this.barBottomDivs.forEach((bottomDiv: any) => {
            bottomDiv.style.display = "";
        });
        this.barBottomBrackets.forEach((bracket: any) => {
            bracket.style.display = "";
        });
    }

    /**
     * Toggles the crossout overlay off for all images
     */
    unCrossAllImages() {
        this.xAxisCrosses.forEach((cross: any) => {
            cross.style.display = "none";
        });
    }

    /**
     * Toggles the crossout overlay on/off depending on whether it is simulated or not
     */
    crossImagesPerSetting() {
        for (let i = 0; i < this.parent.barType.length; i++) {
            if (
                this.parent.barIsMonster(i) &&
                !this.parent.simulator.monsterSimFilter[
                    this.parent.barMonsterIDs[i]
                ]
            ) {
                this.xAxisCrosses[i].style.display = "";
            } else if (
                this.parent.barIsDungeon(i) &&
                !this.parent.simulator.dungeonSimFilter[
                    this.parent.barMonsterIDs[i]
                ]
            ) {
                this.xAxisCrosses[i].style.display = "";
            } else if (
                this.parent.barIsTask(i) &&
                !this.parent.simulator.slayerSimFilter[
                    this.parent.barMonsterIDs[i]
                ]
            ) {
                this.xAxisCrosses[i].style.display = "";
            } else {
                this.xAxisCrosses[i].style.display = "none";
            }
        }
    }
}

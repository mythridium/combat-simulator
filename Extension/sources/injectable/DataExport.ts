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
 * Class to handle data exporting
 */
class DataExport {
    app: App;
    exportOptions: any;
    header: any;
    simulator: Simulator;
    micsr: MICSR;

    constructor(app: App) {
        this.app = app;
        this.micsr = app.micsr;
        this.simulator = this.app.simulator;
        // Data Export Settings
        this.exportOptions = {
            dungeonMonsters: true,
            nonSimmed: false,
        };
        // this.header = Object.getOwnPropertyNames(this.app.manager.convertSlowSimToResult(this.app.manager.getSimStats())).filter(prop =>
        //     ![
        //         'simSuccess',
        //         'reason',
        //         'inQueue',
        //     ].includes(prop)
        // );
    }

    skip(filter: any, data: any) {
        if (this.exportOptions.nonSimmed) {
            return false;
        }
        return !filter || !data.simSuccess;
    }

    exportEntity(
        exportData: any,
        exportIdx: any,
        filter: any,
        info: any,
        data: any
    ) {
        if (this.skip(filter, data)) {
            return;
        }
        exportData[exportIdx] = {
            ...info,
            data: this.header.map((prop: any) => this.round(data[prop])),
        };
    }

    round(x: any) {
        if (x === undefined || x === null) {
            return x;
        }
        if (x.toString() === "[object Object]") {
            const result = {};
            Object.getOwnPropertyNames(x).forEach(
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                (prop) => (result[prop] = this.round(x[prop]))
            );
            return result;
        } else if (!isNaN) {
            return x;
        }
        return Math.round(x * 1e4) / 1e4;
    }

    exportData() {
        // result
        const exportData = {
            header: this.header,
            // monsters in zones, or tasks
            monsters: {},
            // dungeons
            dungeons: {},
            dungeonMonsters: {},
            // auto slayer
            autoSlayer: {},
        };

        // export Combat Areas, Wandering Bard, and Slayer Areas
        this.micsr.monsterIDs.forEach((monsterID: any) =>
            this.exportEntity(
                exportData.monsters,
                monsterID,
                this.simulator.monsterSimFilter[monsterID],
                {
                    name: this.app.getMonsterName(monsterID),
                    monsterID: monsterID,
                },
                this.simulator.monsterSimData[monsterID]
            )
        );

        // export dungeons
        this.micsr.dungeons.forEach((dungeon: any, dungeonID: any) => {
            if (
                this.skip(
                    this.simulator.dungeonSimFilter[dungeonID],
                    this.simulator.dungeonSimData[dungeonID]
                )
            ) {
                return;
            }
            // dungeon
            this.exportEntity(
                exportData.dungeons,
                dungeonID,
                this.simulator.dungeonSimFilter[dungeonID],
                {
                    name: this.app.getDungeonName(dungeonID),
                    dungeonID: dungeonID,
                },
                this.simulator.dungeonSimData[dungeonID]
            );
            // dungeon monsters
            if (this.exportOptions.dungeonMonsters) {
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                (exportData.dungeonMonsters[dungeonID] = {}),
                    dungeon.monsters.forEach((monsterID: any) =>
                        this.exportEntity(
                            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                            exportData.dungeonMonsters[dungeonID],
                            monsterID,
                            this.simulator.dungeonSimFilter[dungeonID],
                            {
                                name: this.app.getMonsterName(monsterID),
                                dungeonID: dungeonID,
                                monsterID: monsterID,
                            },
                            this.simulator.monsterSimData[
                                this.simulator.simID(monsterID, dungeonID)
                            ]
                        )
                    );
            }
        });

        // export slayer tasks
        SlayerTask.data.forEach((task: any, taskID: any) => {
            if (
                this.skip(
                    this.simulator.slayerSimFilter[taskID],
                    this.simulator.slayerSimData[taskID]
                )
            ) {
                return;
            }
            // task list
            this.exportEntity(
                exportData.autoSlayer,
                taskID,
                this.simulator.slayerSimFilter[taskID],
                {
                    name: task.display,
                    taskID: taskID,
                    monsterList: this.simulator.slayerTaskMonsters[taskID],
                },
                this.simulator.slayerSimData[taskID]
            );
            // task monsters
            this.simulator.slayerTaskMonsters[taskID].forEach(
                (monsterID: any) => {
                    this.exportEntity(
                        exportData.monsters,
                        monsterID,
                        true,
                        {
                            name: this.app.getMonsterName(monsterID),
                            monsterID: monsterID,
                        },
                        this.simulator.monsterSimData[monsterID]
                    );
                }
            );
        });
        return JSON.stringify(exportData);
    }
}

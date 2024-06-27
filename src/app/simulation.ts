import { SimulateRequest, SimulateResponse } from 'src/shared/transport/type/simulate';
import { Simulator } from './worker/simulator';
import { SimulationResult, SimulationStats } from 'src/shared/simulator/sim-manager';
import { Global } from './global';
import { Lookup } from 'src/shared/utils/lookup';
import { PlotKey, PlotType } from './stores/plotter.store';
import { Notify } from './utils/notify';
import { SettingsController } from './settings-controller';
import { HistoryController } from './user-interface/pages/configuration/history/history-controller';
import { Drops } from './drops';
import { Bugs } from './user-interface/bugs/bugs';

export interface SimulationRecord {
    settings: string;
    monsterSimData: { [index: string]: SimulationData };
    dungeonSimData: { [index: string]: SimulationData };
    slayerSimData: { [index: string]: SimulationData };
    depthSimData: { [index: string]: SimulationData };
    strongholdSimData: { [index: string]: SimulationData };
}

export interface SimulationData extends SimulationStats, SimulationResult {
    inQueue?: boolean;
    adjustedRates: any;
    isSkipped?: boolean;
}

interface Queue {
    monsterId: string;
    entityId: string;
}

type Callback = (current: number, total: number) => void;

export class Simulation {
    /** Simulator is responsible for actually running the simulation. */
    public readonly simulator = new Simulator();

    public get notSimulatedReason() {
        return 'entity not simulated';
    }

    public monsterSimData: { [index: string]: SimulationData } = {};
    public monsterSimIds: string[] = [];
    public monsterSimFilter: { [index: string]: boolean } = {};
    public slayerSimData: { [index: string]: SimulationData } = {};
    public slayerSimFilter: { [index: string]: boolean } = {};
    public slayerTaskMonsters: { [index: string]: Monster[] } = {};
    public dungeonSimData: { [index: string]: SimulationData } = {};
    public dungeonSimFilter: { [index: string]: boolean } = {};
    public strongholdSimData: { [index: string]: SimulationData } = {};
    public strongholdSimFilter: { [index: string]: boolean } = {};
    public depthSimData: { [index: string]: SimulationData } = {};
    public depthSimFilter: { [index: string]: boolean } = {};

    private current = 0;
    private queue: Queue[] = [];
    private error?: string;

    private queueCallbacks = new Set<Callback>();

    constructor() {
        for (const monster of Lookup.monsters.allObjects) {
            this.monsterSimData[monster.id] = this.newSimDataEntry(true);
            this.monsterSimIds.push(monster.id);
            this.monsterSimFilter[monster.id] = true;
        }

        for (const dungeon of Lookup.combatAreas.dungeons) {
            this.dungeonSimData[dungeon.id] = this.newSimDataEntry(false);
            this.dungeonSimFilter[dungeon.id] = false;

            for (const monster of dungeon.monsters) {
                const simId = this.simId(monster.id, dungeon.id);

                if (!this.monsterSimData[simId]) {
                    this.monsterSimData[simId] = this.newSimDataEntry(true);
                    this.monsterSimIds.push(simId);
                }
            }
        }

        for (const stronghold of Lookup.combatAreas.strongholds) {
            this.strongholdSimData[stronghold.id] = this.newSimDataEntry(false);
            this.strongholdSimFilter[stronghold.id] = false;

            for (const monster of stronghold.monsters) {
                const simId = this.simId(monster.id, stronghold.id);

                if (!this.monsterSimData[simId]) {
                    this.monsterSimData[simId] = this.newSimDataEntry(true);
                    this.monsterSimIds.push(simId);
                }
            }
        }

        for (const depth of Lookup.combatAreas.depths) {
            this.depthSimData[depth.id] = this.newSimDataEntry(false);
            this.depthSimFilter[depth.id] = false;

            for (const monster of depth.monsters) {
                const simId = this.simId(monster.id, depth.id);

                if (!this.monsterSimData[simId]) {
                    this.monsterSimData[simId] = this.newSimDataEntry(true);
                    this.monsterSimIds.push(simId);
                }
            }
        }

        for (const task of Lookup.tasks.allObjects.map(task => task.id)) {
            this.slayerTaskMonsters[task] = [];
            this.slayerSimData[task] = this.newSimDataEntry(false);
            this.slayerSimFilter[task] = false;
        }
    }

    public onQueue(callback: Callback) {
        if (this.queueCallbacks.has(callback)) {
            return;
        }

        this.queueCallbacks.add(callback);
    }

    public offQueue(callback: Callback) {
        this.queueCallbacks.delete(callback);
    }

    public newSimDataEntry(isMonster: boolean): SimulationData {
        const data: any = {
            simSuccess: false,
            reason: this.notSimulatedReason,
            adjustedRates: {}
        };

        if (isMonster) {
            data.inQueue = false;
            data.petRolls = {};
        }

        return data;
    }

    public simId(monsterId: string, entityId?: string) {
        if (entityId === undefined) {
            return monsterId;
        }

        return `${entityId}-${monsterId}`;
    }

    public getSimFailureText(data: SimulationData, includeHints = false) {
        const prefix = 'No valid simulation data';

        if (includeHints && Lookup.isDungeon(data.dungeonId)) {
            if (data.dungeonId === 'melvorTotH:Lair_of_the_Spider_Queen') {
                return `This dungeons results are not accurate.<br /><a class="mcs-monster-note-hint">Hover for more information.</a>
                <div data-mcsTooltipContent>
                    Lair of the Spider Queen contains randomly generated monsters and bosses. Inspect the dungeon to see all possible monsters you may fight, however this is not reflective of the actual dungeon.
                </div>`;
            }

            if (data.dungeonId === 'melvorF:Into_the_Mist') {
                return `This dungeons results are not accurate.<br /><a class="mcs-monster-note-hint">Hover for more information.</a>
                <div data-mcsTooltipContent>
                    Into the Mists contains randomly generated monsters before the final boss. Inspect the dungeon to see all possible monsters you may fight, however this is not reflective of the actual dungeon.
                </div>`;
            }

            if (data.dungeonId === 'melvorF:Impending_Darkness') {
                return `This dungeons results are not accurate.<br /><a class="mcs-monster-note-hint">Hover for more information.</a>
                <div data-mcsTooltipContent>
                   Impending Darkness contains randomly selected modifiers which cannot be accounted for, in addition the boss attack style is randomly chosen. Inspect the dungeon to see all possible attack styles of the boss, however this is not reflective of the actual dungeon.
                </div>`;
            }
        }

        if (data.reason) {
            if (data.tickCount >= Global.stores.simulator.state.ticks * Global.stores.simulator.state.trials) {
                if (includeHints) {
                    return `
                    Insufficient simulation time: ${data.reason}.<br /><a class="mcs-monster-note-hint">Hover for more information.</a>
                    <div data-mcsTooltipContent>
                        This failure means that the results may not be accurate because you did not kill the target fast enough.<br /><br />Try increasing trials and ticks in Settings or improve your skills/gear.
                    </div>`;
                } else {
                    return `Insufficient simulation time: ${data.reason}.`;
                }
            }

            return `${prefix}: ${data.reason}.`;
        }

        if (!data.simSuccess) {
            return `${prefix}: unknown simulation error.`;
        }

        return '';
    }

    public getDataSet() {
        const dataSet: number[] = [];
        const isSignet = key === PlotKey.Signet;

        if (!Global.stores.plotter.state.isInspecting) {
            // Compile data from monsters in combat zones
            for (const monsterId of Global.stores.game.state.monsterIds) {
                dataSet.push(this.getBarValue(this.monsterSimFilter[monsterId], this.monsterSimData[monsterId]));
            }

            // Perform simulation of monsters in dungeons
            for (const dungeonId of Global.stores.game.state.dungeonIds) {
                dataSet.push(this.getBarValue(this.dungeonSimFilter[dungeonId], this.dungeonSimData[dungeonId]));
            }

            // Perform simulation of monsters in strongholds
            for (const strongholdId of Global.stores.game.state.strongholdIds) {
                dataSet.push(
                    this.getBarValue(this.strongholdSimFilter[strongholdId], this.strongholdSimData[strongholdId])
                );
            }

            // Perform simulation of monsters in depths
            for (const depthId of Global.stores.game.state.depthIds) {
                dataSet.push(this.getBarValue(this.depthSimFilter[depthId], this.depthSimData[depthId]));
            }

            // Perform simulation of monsters in slayer tasks
            for (const taskId of Global.stores.game.state.taskIds) {
                dataSet.push(this.getBarValue(this.slayerSimFilter[taskId], this.slayerSimData[taskId]));
            }
        } else if (
            Lookup.isDungeon(Global.stores.plotter.state.inspectedId) ||
            Lookup.isStronghold(Global.stores.plotter.state.inspectedId) ||
            Lookup.isDepth(Global.stores.plotter.state.inspectedId)
        ) {
            const entity = Lookup.getEntity(Global.stores.plotter.state.inspectedId);
            for (const monster of (<Dungeon | Stronghold | AbyssDepth>entity).monsters) {
                const simId = this.simId(monster.id, Global.stores.plotter.state.inspectedId);

                if (!isSignet) {
                    dataSet.push(this.getBarValue(true, this.monsterSimData[simId]));
                } else {
                    dataSet.push(0);
                }
            }

            if (isSignet) {
                const monsters = Lookup.dungeons.getObjectByID(Global.stores.plotter.state.inspectedId).monsters;
                const boss = monsters[monsters.length - 1];
                const simId = this.simId(boss.id, Global.stores.plotter.state.inspectedId);

                dataSet[dataSet.length - 1] = this.getBarValue(true, this.monsterSimData[simId]);
            }
        } else if (Global.stores.plotter.state.inspectedId) {
            // slayer tasks
            for (const monster of Lookup.getSlayerTaskMonsters(Global.stores.plotter.state.inspectedId)) {
                if (!isSignet) {
                    dataSet.push(this.getBarValue(true, this.monsterSimData[monster.id]));
                } else {
                    dataSet.push(0);
                }
            }
        }

        return dataSet;
    }

    public getRawData() {
        const dataSet: SimulationData[] = [];

        if (!Global.stores.plotter.state.isInspecting) {
            // Compile data from monsters in combat zones
            for (const monsterId of Global.stores.game.state.monsterIds) {
                dataSet.push(this.monsterSimData[monsterId]);
            }

            // Perform simulation of monsters in dungeons
            for (const dungeonId of Global.stores.game.state.dungeonIds) {
                dataSet.push(this.dungeonSimData[dungeonId]);
            }

            // Perform simulation of monsters in strongholds
            for (const strongholdId of Global.stores.game.state.strongholdIds) {
                dataSet.push(this.strongholdSimData[strongholdId]);
            }

            // Perform simulation of monsters in depths
            for (const depthId of Global.stores.game.state.depthIds) {
                dataSet.push(this.depthSimData[depthId]);
            }

            // Perform simulation of monsters in slayer tasks
            for (const taskId of Global.stores.game.state.taskIds) {
                dataSet.push(this.slayerSimData[taskId]);
            }
        } else if (
            Lookup.isDungeon(Global.stores.plotter.state.inspectedId) ||
            Lookup.isStronghold(Global.stores.plotter.state.inspectedId) ||
            Lookup.isDepth(Global.stores.plotter.state.inspectedId)
        ) {
            const entity = Lookup.getEntity(Global.stores.plotter.state.inspectedId);

            for (const monster of (<Dungeon | Stronghold | AbyssDepth>entity).monsters) {
                dataSet.push(this.monsterSimData[this.simId(monster.id, Global.stores.plotter.state.inspectedId)]);
            }
        } else if (Global.stores.plotter.state.inspectedId) {
            for (const monster of Lookup.getSlayerTaskMonsters(Global.stores.plotter.state.inspectedId)) {
                dataSet.push(this.monsterSimData[monster.id]);
            }
        }

        return dataSet;
    }

    public getValue(filter: boolean, data: SimulationData, key: PlotKey, scale: boolean) {
        if (filter && data.simSuccess) {
            return data[key] * this.getTimeMultiplier(data, key, scale);
        }

        return NaN;
    }

    public getBarValue(filter: boolean, data: SimulationData) {
        let key = Global.stores.plotter.plotType.key;

        if (Global.stores.plotter.plotType.isRealmed) {
            const realm = Global.game.realms.getObjectByID(data.realmId);
            key = `${key}${realm?.localID}` as PlotKey;
        }

        return this.getValue(filter, data, key, Global.stores.plotter.plotType.scale);
    }

    public getTimeMultiplier(data: SimulationData, key: PlotKey, scale: boolean) {
        let dataMultiplier = 1;

        if (scale) {
            dataMultiplier = Global.stores.plotter.timeMultiplier;
        }

        if (Global.stores.plotter.timeMultiplier === -1 && scale) {
            dataMultiplier = data['killTimeS'];
        }

        if (key === PlotKey.Pet || key === PlotKey.Mark) {
            dataMultiplier = 1;
        }

        return dataMultiplier;
    }

    public saveSimulation() {
        const record: SimulationRecord = {
            settings: SettingsController.exportAsString(),
            monsterSimData: JSON.parse(JSON.stringify(this.monsterSimData)),
            dungeonSimData: JSON.parse(JSON.stringify(this.dungeonSimData)),
            slayerSimData: JSON.parse(JSON.stringify(this.slayerSimData)),
            depthSimData: JSON.parse(JSON.stringify(this.depthSimData)),
            strongholdSimData: JSON.parse(JSON.stringify(this.strongholdSimData))
        };

        HistoryController.record(record);
    }

    public loadSimulation(record: SimulationRecord) {
        SettingsController.importFromString(record.settings); // TODO Retain synergy = true

        for (const id in record.monsterSimData) {
            this.monsterSimData[id] = {
                ...record.monsterSimData[id]
            };
        }

        this.analyse();
    }

    public async cancel() {
        Global.cancelStatus = true;
        return this.simulator.cancel();
    }

    public async startSimulation(selected: boolean) {
        this.setupSimulator(selected);

        for (const callback of this.queueCallbacks) {
            try {
                callback(0, this.queue.length);
            } catch (exception) {
                Global.logger.error(`Failed to call onQueue callback.`, exception);
            }
        }

        return this.initializeQueue();
    }

    private setupSimulator(selected: boolean) {
        Global.cancelStatus = false;
        Global.stores.simulator.set({ startTime: performance.now() });

        this.resetSimulation();

        // Set up simulation queue
        this.queue = [];

        if (selected) {
            this.resetSelectedSimulation();
            return;
        }

        // if viewing a dungeon when simulating all, only simulate the dungeon
        if (Global.stores.plotter.state.isInspecting) {
            const monsters = Lookup.getMonsterList(Global.stores.plotter.state.inspectedId);

            if (
                Lookup.isDungeon(Global.stores.plotter.state.inspectedId) ||
                Lookup.isDepth(Global.stores.plotter.state.inspectedId) ||
                Lookup.isStronghold(Global.stores.plotter.state.inspectedId)
            ) {
                if (Lookup.isStronghold(Global.stores.plotter.state.inspectedId)) {
                    const stronghold = Lookup.strongholds.getObjectByID(Global.stores.plotter.state.inspectedId);

                    if (!Global.game.combat.canFightInStrongholdTier(stronghold, stronghold.mcsTier)) {
                        for (const monster of monsters) {
                            this.monsterSimData[
                                this.simId(monster.id, Global.stores.plotter.state.inspectedId)
                            ].reason = 'You do not meet the requirements to start the stronghold';
                        }

                        return;
                    }
                }

                for (const monster of monsters) {
                    this.pushMonsterToQueue(monster.id, Global.stores.plotter.state.inspectedId);
                }
            } else {
                const task = Lookup.tasks.allObjects.find(task => task.id == Global.stores.plotter.state.inspectedId);

                for (const monster of monsters) {
                    this.queueSlayerMonster(task, monster);
                }
            }

            return;
        }

        // Queue simulation of monsters in combat areas
        for (const area of Lookup.combatAreas.combatAreas) {
            for (const monster of area.monsters) {
                if (this.monsterSimFilter[monster.id] && this.validateSlayerMonster(monster)) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            }
        }

        // Wandering Bard
        if (this.monsterSimFilter[Global.stores.game.state.bardId]) {
            this.pushMonsterToQueue(Global.stores.game.state.bardId, undefined);
        }

        let someAreaNotSimulated = false;

        // Queue simulation of monsters in slayer areas
        for (const area of Lookup.combatAreas.slayer) {
            if (
                !Global.game.checkRequirements(
                    area.entryRequirements,
                    undefined,
                    area.slayerLevelRequired,
                    area instanceof SlayerArea
                )
            ) {
                const tryToSim = area.monsters.reduce(
                    (sim, monster) =>
                        (this.monsterSimFilter[monster.id] && !this.monsterSimData[monster.id].inQueue) || sim,
                    false
                );

                if (tryToSim) {
                    someAreaNotSimulated = true;

                    for (const monster of area.monsters) {
                        this.monsterSimData[monster.id].reason = 'cannot access area';
                    }
                }

                continue;
            }

            for (const monster of area.monsters) {
                if (this.monsterSimFilter[monster.id] && this.validateSlayerMonster(monster)) {
                    this.pushMonsterToQueue(monster.id, undefined);
                }
            }
        }

        // Queue simulation of monsters in dungeons
        for (const dungeon of Lookup.combatAreas.dungeons) {
            if (this.dungeonSimFilter[dungeon.id]) {
                for (let j = 0; j < dungeon.monsters.length; j++) {
                    const monster = dungeon.monsters[j];
                    this.pushMonsterToQueue(monster.id, dungeon.id);
                }
            }
        }

        // Queue simulation of monsters in strongholds
        for (const stronghold of Lookup.combatAreas.strongholds) {
            if (this.strongholdSimFilter[stronghold.id]) {
                if (!Global.game.combat.canFightInStrongholdTier(stronghold, stronghold.mcsTier)) {
                    continue;
                }

                for (let j = 0; j < stronghold.monsters.length; j++) {
                    const monster = stronghold.monsters[j];
                    this.pushMonsterToQueue(monster.id, stronghold.id);
                }
            }
        }

        // Queue simulation of monsters in strongholds
        for (const depth of Lookup.combatAreas.depths) {
            if (this.depthSimFilter[depth.id]) {
                for (let j = 0; j < depth.monsters.length; j++) {
                    const monster = depth.monsters[j];
                    this.pushMonsterToQueue(monster.id, depth.id);
                }
            }
        }

        // Queue simulation of monsters in slayer tasks
        for (const taskId of Global.stores.game.state.taskIds) {
            const didSimulate = this.queueSlayerTask(taskId, true);

            if (didSimulate === false) {
                someAreaNotSimulated = true;
            }
        }

        if (someAreaNotSimulated) {
            Notify.message(`Some slayer areas could not be simulated as you cannot access the area.`, 'danger');
        }
    }

    private resetSimulation() {
        for (let simId in this.monsterSimData) {
            this.monsterSimData[simId] = this.newSimDataEntry(true);
        }

        for (let simId in this.dungeonSimData) {
            this.dungeonSimData[simId] = this.newSimDataEntry(false);
        }

        for (let simId in this.slayerSimData) {
            this.slayerSimData[simId] = this.newSimDataEntry(false);
        }

        for (let simId in this.strongholdSimData) {
            this.strongholdSimData[simId] = this.newSimDataEntry(false);
        }

        for (let simId in this.depthSimData) {
            this.depthSimData[simId] = this.newSimDataEntry(false);
        }
    }

    private resetSelectedSimulation() {
        if (!Global.stores.plotter.state.isBarSelected && !Global.stores.plotter.state.isInspecting) {
            Notify.message('There is nothing selected!', 'danger');
            return;
        }

        // area monster
        if (
            !Global.stores.plotter.state.isInspecting &&
            Global.stores.plotter.barIsMonster(Global.stores.plotter.state.selectedBar)
        ) {
            const monster = Lookup.getEntity(Global.stores.plotter.selectedMonsterId) as Monster;

            if (this.validateSlayerMonster(monster)) {
                this.pushMonsterToQueue(Global.stores.plotter.selectedMonsterId, undefined);
            } else {
                Notify.message('You do not have the requirements to fight this monster.', 'danger');
                return;
            }

            if (this.monsterSimFilter[Global.stores.plotter.selectedMonsterId]) {
                this.pushMonsterToQueue(Global.stores.plotter.selectedMonsterId, undefined);
            } else {
                Notify.message('The selected monster is filtered!', 'danger');
            }

            return;
        }

        const didHandle = this._resetSelectedEntity();

        if (didHandle) {
            return;
        }

        // slayer area
        let taskId: string = undefined;

        if (
            !Global.stores.plotter.state.isInspecting &&
            Global.stores.plotter.barIsTask(Global.stores.plotter.state.selectedBar)
        ) {
            taskId = Global.stores.plotter.selectedMonsterId;
        } else if (
            Global.stores.plotter.state.isInspecting &&
            Lookup.isSlayerTask(Global.stores.plotter.state.inspectedId)
        ) {
            taskId = Global.stores.plotter.state.inspectedId;
        }

        if (taskId !== undefined) {
            if (Global.stores.plotter.state.isInspecting || this.slayerSimFilter[taskId]) {
                if (Global.stores.plotter.barIsSlayerMonster(Global.stores.plotter.state.selectedBar)) {
                    const task = Lookup.tasks.allObjects.find(task => task.id === taskId);
                    const monster = Lookup.monsters.getObjectByID(Global.stores.plotter.selectedMonsterId);

                    if (!task) {
                        throw new Error(`Could not find task: ${taskId}`);
                    }

                    this.queueSlayerMonster(task, monster);
                } else {
                    this.queueSlayerTask(taskId, false);
                }
                return;
            }

            Notify.message('The selected task is filtered!', 'danger');

            return;
        }
    }

    private _resetSelectedEntity() {
        let entityId: string | undefined = undefined;

        if (
            !Global.stores.plotter.state.isInspecting &&
            (Global.stores.plotter.barIsDungeon(Global.stores.plotter.state.selectedBar) ||
                Global.stores.plotter.barIsStronghold(Global.stores.plotter.state.selectedBar) ||
                Global.stores.plotter.barIsDepth(Global.stores.plotter.state.selectedBar))
        ) {
            entityId = Global.stores.plotter.selectedMonsterId;
        } else if (
            Global.stores.plotter.state.isInspecting &&
            (Lookup.isDungeon(Global.stores.plotter.state.inspectedId) ||
                Lookup.isStronghold(Global.stores.plotter.state.inspectedId) ||
                Lookup.isDepth(Global.stores.plotter.state.inspectedId))
        ) {
            entityId = Global.stores.plotter.state.inspectedId;
        }

        if (entityId !== undefined) {
            let filter: { [index: string]: boolean };

            if (Lookup.isDungeon(entityId)) {
                filter = this.dungeonSimFilter;
            }

            if (Lookup.isStronghold(entityId)) {
                filter = this.strongholdSimFilter;

                if (filter[entityId]) {
                    const stronghold = Lookup.strongholds.getObjectByID(entityId);

                    if (!Global.game.combat.canFightInStrongholdTier(stronghold, stronghold.mcsTier)) {
                        const sim =
                            Global.stores.plotter.state.isInspecting && Global.stores.plotter.state.isBarSelected
                                ? this.monsterSimData[this.simId(Global.stores.plotter.selectedMonsterId, entityId)]
                                : this.strongholdSimData[this.simId(entityId)];

                        sim.isSkipped = true;
                        sim.reason = 'You do not meet the requirements to start the stronghold';

                        Notify.message(`You do not meet the requirements to start the stronghold.`, 'danger');
                        return true;
                    }
                }
            }

            if (Lookup.isDepth(entityId)) {
                filter = this.depthSimFilter;
            }

            if (!filter) {
                throw new Error(`Could not locate filter for ${entityId}.`);
            }

            if (Global.stores.plotter.state.isInspecting || filter[entityId]) {
                if (
                    Global.stores.plotter.state.isInspecting &&
                    Global.stores.plotter.state.isBarSelected &&
                    (Global.stores.plotter.barIsDungeonMonster(Global.stores.plotter.state.selectedBar) ||
                        Global.stores.plotter.barIsStrongholdMonster(Global.stores.plotter.state.selectedBar) ||
                        Global.stores.plotter.barIsDepthMonster(Global.stores.plotter.state.selectedBar))
                ) {
                    this.pushMonsterToQueue(Global.stores.plotter.selectedMonsterId, entityId);
                    return true;
                }

                for (const monster of Lookup.getMonsterList(entityId)) {
                    this.pushMonsterToQueue(monster.id, entityId);
                }

                return true;
            }

            Notify.message('The selected entity is filtered!', 'danger');

            return true;
        }

        return false;
    }

    private pushMonsterToQueue(monsterId: string, entityId?: string) {
        const simId = this.simId(monsterId, entityId);

        if (!this.monsterSimData[simId].inQueue) {
            this.monsterSimData[simId].inQueue = true;
            this.queue.push({ monsterId, entityId });
        }
    }

    private queueSlayerTask(taskId: string, isAll: boolean) {
        const task = Lookup.tasks.allObjects.find(task => task.id == taskId);

        if (!task) {
            throw new Error(`Could not find task: ${taskId}`);
        }

        this.slayerTaskMonsters[taskId] = [];

        if (!Global.stores.plotter.state.isInspecting && !this.slayerSimFilter[taskId]) {
            return;
        }

        let didQueueAnyMonsters = false;

        for (const monster of Lookup.monsters.allObjects) {
            const didQueue = this.queueSlayerMonster(task, monster);

            if (didQueue) {
                didQueueAnyMonsters = true;
                this.slayerTaskMonsters[taskId].push(monster);
            }
        }

        if (!didQueueAnyMonsters && !isAll) {
            this.slayerSimData[taskId].isSkipped = true;
            this.slayerSimData[taskId].reason =
                'You do not have the requirements to fight any monster in this slayer task.';

            Notify.message('You do not have the requirements to fight any monster in this slayer task.', 'danger');
        }

        return didQueueAnyMonsters;
    }

    private queueSlayerMonster(task: SlayerTaskCategory, monster: Monster) {
        if (!monster.canSlayer) {
            return false;
        }

        const categoryFilter = task.getMonsterFilter();

        // check if the area is accessible, this only works for auto slayer
        // without auto slayer you can get some tasks for which you don't wear/own the gear
        const area = Global.game.getMonsterArea(monster);

        if (!(area instanceof SlayerArea) && !this.validateSlayerMonster(monster)) {
            this.monsterSimData[monster.id].reason = 'cannot access area';
            return false;
        }

        if (area.realm.id !== task.realm.id || area.id === 'melvorD:UnknownArea' || !categoryFilter(monster)) {
            this.monsterSimData[monster.id].reason = 'cannot access area';
            return false;
        }

        if (!Global.game.combat.checkDamageTypeRequirementsForMonster(monster, false)) {
            this.monsterSimData[monster.id].reason = 'This monster is immune to your current Damage Type';
            return false;
        }

        if (
            !Global.game.checkRequirements(
                area.entryRequirements,
                undefined,
                area instanceof SlayerArea ? area.slayerLevelRequired : undefined,
                area instanceof SlayerArea
            )
        ) {
            this.monsterSimData[monster.id].reason = 'cannot access area';
            return false;
        }

        // all checks passed
        this.pushMonsterToQueue(monster.id);
        return true;
    }

    private validateSlayerMonster(monster: Monster) {
        if (!monster.canSlayer) {
            return true;
        }

        const area = Global.game.getMonsterArea(monster);

        const requirements = area.entryRequirements.filter(requirement => requirement.type === 'AbyssDepthCompletion');

        return Global.game.checkRequirements(requirements, undefined, undefined, true);
    }

    private async initializeQueue() {
        if (Global.stores.simulator.state.isRunning) {
            return false;
        }

        if (this.queue.length > 0) {
            Global.stores.simulator.set({ isRunning: true });
            this.current = 0;
            this.error = undefined;
            return this.startQueue();
        } else {
            try {
                this.analyse(true);
            } catch (error) {
                Bugs.report(true, error);
            }

            return true;
        }
    }

    private async startQueue(): Promise<boolean> {
        if (this.current < this.queue.length && !Global.cancelStatus) {
            const monsterId = this.queue[this.current].monsterId;
            const entityId = this.queue[this.current].entityId;
            const saveString = Global.game.generateSaveStringSimple();

            this.current++;

            const response = await Global.simulation.simulate({
                monsterId: monsterId,
                entityId: entityId,
                saveString: saveString,
                trials: Global.stores.simulator.state.trials,
                maxTicks: Global.stores.simulator.state.ticks
            });

            if (response.result.stack) {
                this.error = response.result.stack;
            }

            const simId = this.simId(response.monsterId, response.entityId);
            Object.assign(this.monsterSimData[simId], response.result, {
                monsterId: response.monsterId,
                entityId: response.entityId
            });

            for (const callback of this.queueCallbacks) {
                try {
                    callback(this.current - 1, this.queue.length);
                } catch (exception) {
                    Global.logger.error(`Failed to call onQueue callback.`, exception);
                }
            }

            return this.startQueue();
        } else {
            if (this.error) {
                Bugs.report(true, { stack: this.error } as any);
            }

            // Check if none of the workers are in use
            Global.stores.simulator.set({ isRunning: false });

            try {
                this.analyse(true);
            } catch (error) {
                Bugs.report(true, error);
            }

            return true;
        }
    }

    private analyse(isNewRun = false) {
        // Perform calculation of dungeon stats
        for (const dungeon of Lookup.combatAreas.dungeons) {
            this.compute(
                this.dungeonSimFilter[dungeon.id],
                this.dungeonSimData[dungeon.id],
                dungeon.monsters,
                false,
                dungeon.id
            );
        }

        for (const stronghold of Lookup.combatAreas.strongholds) {
            this.compute(
                this.strongholdSimFilter[stronghold.id],
                this.strongholdSimData[stronghold.id],
                stronghold.monsters,
                false,
                stronghold.id
            );
        }

        for (const depth of Lookup.combatAreas.depths) {
            this.compute(this.depthSimFilter[depth.id], this.depthSimData[depth.id], depth.monsters, false, depth.id);
        }

        for (const task of Lookup.tasks.allObjects) {
            this.compute(
                this.slayerSimFilter[task.id],
                this.slayerSimData[task.id],
                this.slayerTaskMonsters[task.id],
                true,
                task.id
            );
        }

        Drops.update();

        if (isNewRun) {
            Global.logger.log(
                `Elapsed Simulation Time: ${performance.now() - Global.stores.simulator.state.startTime} ms`
            );

            if (Global.stores.simulator.state.trackHistory) {
                this.saveSimulation();
            }
        }
    }

    private compute(
        filter: boolean,
        averageData: SimulationData,
        monsters: Monster[],
        isSlayerTask: boolean,
        entityId?: string
    ) {
        // check filter
        if (!filter) {
            averageData.simSuccess = false;
            averageData.reason = 'entity filtered';
            return;
        }

        // combine failure reasons, if any
        if (isSlayerTask) {
            averageData.reason = '';
        } else {
            if (!averageData.isSkipped) {
                this.combineReasons(averageData, monsters, entityId);
            }
        }

        averageData.entityId = entityId;
        averageData.simSuccess = true;
        averageData.tickCount = 0;

        // not time-weighted averages
        averageData.deathRate = 0;
        averageData.highestDamageTaken = 0;
        averageData.highestReflectDamageTaken = 0;
        averageData.lowestHitpoints = Number.MAX_SAFE_INTEGER;
        averageData.killTimeS = 0;

        for (const monster of monsters) {
            const simId = this.simId(monster.id, isSlayerTask ? undefined : entityId);
            const monsterData = this.monsterSimData[simId];

            if (monsterData.simSuccess) {
                if (!isSlayerTask && !monsterData.isSkipped) {
                    averageData.simSuccess &&= monsterData.simSuccess;
                }

                averageData.realmId ??= monsterData.realmId;
                averageData.deathRate = 1 - (1 - averageData.deathRate) * (1 - monsterData.deathRate);
                averageData.highestDamageTaken = Math.max(
                    averageData.highestDamageTaken,
                    monsterData.highestDamageTaken
                );
                averageData.highestReflectDamageTaken = Math.max(
                    averageData.highestReflectDamageTaken,
                    monsterData.highestReflectDamageTaken
                );

                averageData.lowestHitpoints = Math.min(averageData.lowestHitpoints, monsterData.lowestHitpoints);
                averageData.killTimeS += monsterData.killTimeS;
                averageData.tickCount = Math.max(averageData.tickCount, monsterData.tickCount);
            }
        }

        averageData.killsPerSecond = 1 / averageData.killTimeS;

        // time-weighted averages
        const computeAvg = (type: PlotType) => {
            let realms = [type.key];

            if (type.isRealmed) {
                realms = Global.game.realms.allObjects.map(realm => `${type.key}${realm.localID}` as PlotKey);
            }

            for (const key of realms) {
                averageData[key] =
                    monsters
                        .map(
                            monster => this.monsterSimData[this.simId(monster.id, isSlayerTask ? undefined : entityId)]
                        )
                        .reduce((avgData, mData) => {
                            if (!mData.simSuccess) {
                                return avgData;
                            }

                            return avgData + mData[key] * mData.killTimeS;
                        }, 0) / averageData.killTimeS;
            }
        };

        Global.stores.plotter.state.plotTypes
            .filter(
                type =>
                    ![
                        PlotKey.DeathRate,
                        PlotKey.HighestHitTaken,
                        PlotKey.HighestReflectTaken,
                        PlotKey.LowestHitpoints,
                        PlotKey.KillTime,
                        PlotKey.Kills
                    ].includes(type.key)
            )
            .map(type => computeAvg(type));

        // average rune breakdown
        averageData.usedRunesBreakdown = {};
        averageData.markRolls = {};

        for (const monster of monsters) {
            const data = this.monsterSimData[this.simId(monster.id, isSlayerTask ? undefined : entityId)];

            for (const runeId in data.usedRunesBreakdown) {
                if (averageData.usedRunesBreakdown[runeId] === undefined) {
                    averageData.usedRunesBreakdown[runeId] = 0;
                }

                averageData.usedRunesBreakdown[runeId] +=
                    (data.usedRunesBreakdown[runeId] * data.killTimeS) / averageData.killTimeS;
            }

            for (const skillId in data.markRolls) {
                if (averageData.markRolls[skillId] === undefined) {
                    averageData.markRolls[skillId] = 0;
                }

                averageData.markRolls[skillId] += (data.markRolls[skillId] * data.killTimeS) / averageData.killTimeS;
            }
        }

        if (isSlayerTask) {
            averageData.killTimeS = 0;
            averageData.killsPerSecond = 0;
            averageData.markRolls = {};

            for (const monster of monsters) {
                const simId = this.simId(monster.id);
                const monsterData = this.monsterSimData[simId];

                if (monsterData.simSuccess) {
                    averageData.killTimeS += monsterData.killTimeS;
                    averageData.killsPerSecond += 1 / monsterData.killTimeS;

                    for (const skillId in monsterData.markRolls) {
                        if (averageData.markRolls[skillId] === undefined) {
                            averageData.markRolls[skillId] = 0;
                        }

                        averageData.markRolls[skillId] += monsterData.markRolls[skillId];
                    }
                }
            }

            averageData.killTimeS = averageData.killTimeS / (monsters.length || 1);
            averageData.killsPerSecond = averageData.killsPerSecond / (monsters.length || 1);

            for (const skillId in averageData.markRolls) {
                if (averageData.markRolls[skillId] === undefined) {
                    averageData.markRolls[skillId] = 0;
                }

                averageData.markRolls[skillId] = averageData.markRolls[skillId] / (monsters.length || 1);
            }
        }
    }

    private combineReasons(data: SimulationData, monsters: Monster[], entityId: string) {
        let reasons: any = [];

        for (const monster of monsters) {
            const simId = this.simId(monster.id, entityId);

            if (!this.monsterSimData[simId].simSuccess) {
                data.simSuccess = false;
            }

            const reason = this.monsterSimData[simId].reason;

            if (reason && !reasons.includes(reason)) {
                reasons.push(reason);
            }
        }

        if (reasons.length) {
            data.reason = reasons.join(', ');
            return true;
        }

        data.reason = undefined;
        return false;
    }

    public async init() {
        try {
            await this.simulator.init();
        } catch (error) {
            Global.logger.error(error);
            Bugs.report(true, error);
        }
    }

    private async simulate(request: SimulateRequest) {
        try {
            return await this.simulator.simulate(request);
        } catch (error) {
            const response: SimulateResponse = {
                monsterId: request.monsterId,
                entityId: request.entityId,
                time: 0,
                result: { simSuccess: false, reason: error?.message ?? 'An error was thrown during simulation.' }
            };

            return response;
        }
    }
}

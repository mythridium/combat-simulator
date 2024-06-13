import { Drops } from 'src/app/drops';
import { Lookup } from 'src/shared/utils/lookup';
import { BaseStore } from './_base.store';

export enum BarType {
    Monster = 0,
    Dungeon = 1,
    Task = 2,
    Depth = 3,
    Stronghold = 4
}

export interface PlotType {
    key: PlotKey;
    text: string;
    isTime: boolean;
    scale: boolean;
    isRealmed: boolean;
}

export enum PlotKey {
    XP = 'xpPerSecond',
    HpXP = 'hpXpPerSecond',
    PrayerXP = 'prayerXpPerSecond',
    SlayerXP = 'slayerXpPerSecond',
    SummoningXP = 'summoningXpPerSecond',
    CorruptionXP = 'corruptionXpPerSecond',
    PrayerPointsGained = 'ppGainedPerSecond',
    PrayerPointsUsed = 'ppConsumedPerSecond',
    AmmoUsed = 'ammoUsedPerSecond',
    RunesUsed = 'runesUsedPerSecond',
    CombinationRunesUsed = 'combinationRunesUsedPerSecond',
    PotionsUsed = 'potionsUsedPerSecond',
    ConsumablesUsed = 'usedConsumablesPerSecond',
    TabletsUsed = 'tabletsUsedPerSecond',
    FoodUsed = 'atePerSecond',
    DeathRate = 'deathRate',
    HighestHitTaken = 'highestDamageTaken',
    HighestReflectTaken = 'highestReflectDamageTaken',
    LowestHitpoints = 'lowestHitpoints',
    KillTime = 'killTimeS',
    Kills = 'killsPerSecond',
    GP = 'gpPerSecond',
    RawGP = 'baseGpPerSecond',
    Drops = 'dropChance',
    Signet = 'signetChance',
    Pet = 'petChance',
    Mark = 'markChance',
    SlayerCoins = 'slayerCoinsPerSecond'
}

export interface PlotterState {
    selectedBar?: number;
    selectedPlotType: number;
    selectedTimeType: number;
    isBarSelected: boolean;
    isInspecting: boolean;
    scrollLeft: number;
    smallPlotter: boolean;
    filterTargetDropdown: boolean;
    inspectedId?: string;
    inspectedBar?: number;
    bars: {
        total: number;
        types: BarType[];
        monsterIds: string[];
        dungeonIds: { [index: string]: number };
        taskIds: { [index: string]: number };
        depthIds: { [index: string]: number };
        strongholdIds: { [index: string]: number };
    };
    plotTypes: PlotType[];
    timeOptions: string[];
    timeShorthand: string[];
    timeMultipliers: number[];
    onlySelectedTarget: boolean;
    onlyUndiscovered: boolean;
    selectedDrop: string;
    shardsToChests: boolean;
    selectedSkill: string;
}

export class PlotterStore extends BaseStore<PlotterState> {
    constructor() {
        super({
            selectedPlotType: 0,
            selectedTimeType: 3,
            isBarSelected: false,
            isInspecting: false,
            scrollLeft: 0,
            smallPlotter: false,
            filterTargetDropdown: false,
            bars: { total: 0, types: [], monsterIds: [], dungeonIds: {}, taskIds: {}, depthIds: {}, strongholdIds: {} },
            plotTypes: [
                { key: PlotKey.XP, text: 'XP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.HpXP, text: 'HP XP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.PrayerXP, text: 'Prayer XP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.SlayerXP, text: 'Slayer XP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.SummoningXP, text: 'Summoning XP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.CorruptionXP, text: 'Corruption XP per', isTime: true, scale: true, isRealmed: false },
                {
                    key: PlotKey.PrayerPointsGained,
                    text: 'Prayer P. Gained per',
                    isTime: true,
                    scale: true,
                    isRealmed: true
                },
                {
                    key: PlotKey.PrayerPointsUsed,
                    text: 'Prayer P. Used per',
                    isTime: true,
                    scale: true,
                    isRealmed: true
                },
                { key: PlotKey.AmmoUsed, text: 'Ammo per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.RunesUsed, text: 'Runes per', isTime: true, scale: true, isRealmed: false },
                {
                    key: PlotKey.CombinationRunesUsed,
                    text: 'Combination Runes per',
                    isTime: true,
                    scale: true,
                    isRealmed: false
                },
                { key: PlotKey.ConsumablesUsed, text: 'Consumables per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.PotionsUsed, text: 'Potions per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.TabletsUsed, text: 'Tablets per type per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.FoodUsed, text: 'Food per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.DeathRate, text: 'Estimated Death Rate', isTime: false, scale: false, isRealmed: false },
                {
                    key: PlotKey.HighestHitTaken,
                    text: 'Highest Hit Taken',
                    isTime: false,
                    scale: false,
                    isRealmed: false
                },
                {
                    key: PlotKey.HighestReflectTaken,
                    text: 'Highest Reflect Taken',
                    isTime: false,
                    scale: false,
                    isRealmed: false
                },
                {
                    key: PlotKey.LowestHitpoints,
                    text: 'Lowest Hitpoints',
                    isTime: false,
                    scale: false,
                    isRealmed: false
                },
                { key: PlotKey.KillTime, text: 'Average Kill Time (s)', isTime: false, scale: false, isRealmed: false },
                { key: PlotKey.Kills, text: 'Kills per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.GP, text: 'GP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.RawGP, text: 'Raw GP per', isTime: true, scale: true, isRealmed: true },
                { key: PlotKey.Drops, text: 'Drops per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.Signet, text: 'Signet Part B (%) per', isTime: true, scale: false, isRealmed: false },
                { key: PlotKey.Pet, text: 'Pet (%) per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.Mark, text: 'Mark (%) per', isTime: true, scale: true, isRealmed: false },
                { key: PlotKey.SlayerCoins, text: 'Slayer Coins per', isTime: true, scale: true, isRealmed: true }
            ],
            timeOptions: ['Kill', 'Second', 'Minute', 'Hour', 'Day'],
            timeShorthand: ['kill', 's', 'm', 'h', 'd'],
            timeMultipliers: [-1, 1, 60, 3600, 3600 * 24],
            onlySelectedTarget: true,
            onlyUndiscovered: false,
            selectedDrop: Drops.noneItem,
            shardsToChests: false,
            selectedSkill: 'Attack'
        });
    }

    public get plotType() {
        return this._state.plotTypes[this._state.selectedPlotType];
    }

    public get timeOption() {
        return this._state.timeOptions[this._state.selectedTimeType];
    }

    public get timeShorthand() {
        return this._state.timeShorthand[this._state.selectedTimeType];
    }

    public get timeMultiplier() {
        return this._state.timeMultipliers[this._state.selectedTimeType];
    }

    public get selectedMonsterId() {
        if (!this._state.isInspecting) {
            return this._state.bars.monsterIds[this._state.selectedBar];
        }

        const monsters = Lookup.getMonsterList(this._state.inspectedId);

        if (Lookup.isSlayerTask(this._state.inspectedId)) {
            const monsterIndices = monsters.map(monster =>
                this._state.bars.monsterIds.findIndex(monsterId => monsterId === monster.id)
            );
            const index = monsterIndices.findIndex(index => index === this._state.selectedBar);

            return monsters[index]?.id;
        } else {
            return monsters[this._state.selectedBar + monsters.length - this._state.bars.total]?.id;
        }
    }

    public barIsDungeonMonster(index: number) {
        if (!this._state.isInspecting) {
            return false;
        }

        if (!Lookup.isDungeon(this._state.inspectedId)) {
            return false;
        }

        const monsters = Lookup.getMonsterList(this._state.inspectedId);

        return monsters[index + monsters.length - this._state.bars.total] !== undefined;
    }

    public barIsSlayerMonster(index: number) {
        if (!this._state.isInspecting) {
            return false;
        }

        if (!Lookup.isSlayerTask(this._state.inspectedId)) {
            return false;
        }

        const monsters = Lookup.getMonsterList(this._state.inspectedId);
        const monsterIndices = monsters.map(monster =>
            this._state.bars.monsterIds.findIndex(monsterId => monsterId === monster.id)
        );

        return monsterIndices.includes(index);
    }

    public barIsDepthMonster(index: number) {
        if (!this._state.isInspecting) {
            return false;
        }

        if (!Lookup.isDepth(this._state.inspectedId)) {
            return false;
        }

        const monsters = Lookup.getMonsterList(this._state.inspectedId);

        return monsters[index + monsters.length - this._state.bars.total] !== undefined;
    }

    public barIsStrongholdMonster(index: number) {
        if (!this._state.isInspecting) {
            return false;
        }

        if (!Lookup.isStronghold(this._state.inspectedId)) {
            return false;
        }

        const monsters = Lookup.getMonsterList(this._state.inspectedId);

        return monsters[index + monsters.length - this._state.bars.total] !== undefined;
    }

    public barIsMonster(index: number) {
        return this._state.bars.types[index] === BarType.Monster;
    }

    public barIsDungeon(index: number) {
        return this._state.bars.types[index] === BarType.Dungeon;
    }

    public barIsTask(index: number) {
        return this._state.bars.types[index] === BarType.Task;
    }

    public barIsDepth(index: number) {
        return this._state.bars.types[index] === BarType.Depth;
    }

    public barIsStronghold(index: number) {
        return this._state.bars.types[index] === BarType.Stronghold;
    }
}

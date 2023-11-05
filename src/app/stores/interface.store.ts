import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export enum Unit {
    Kill = 'kill',
    Second = 's',
    Minute = 'm',
    Hour = 'h',
    Day = 'd'
}

export enum PlotType {
    XP = 'xp',
    Hitpoints = 'hp-xp',
    Prayer = 'prayer-xp',
    Slayer = 'slayer-xp',
    Summoning = 'summoning-xp',
    PrayerPointsGained = 'prayer-points-gained',
    PrayerPointsUsed = 'prayer-points-used',
    Ammo = 'ammo',
    Runes = 'runes',
    CombinationRunes = 'combination-runes',
    Potions = 'potions',
    Consumables = 'consumables',
    Tablets = 'tablets',
    Food = 'food',
    Death = 'death-rate',
    HighestHit = 'highest-hit',
    LowestHitpoints = 'lowest-hitpoints',
    KillTime = 'kill-time',
    Kills = 'kills',
    GP = 'gp',
    RawGp = 'raw-gp',
    SC = 'slayer-coins',
    Drops = 'drops',
    Signet = 'signet',
    Pet = 'pet'
}

export const plotTypes: { [key in PlotType]: string } = {
    [PlotType.XP]: 'XP',
    [PlotType.Hitpoints]: 'HP XP',
    [PlotType.Prayer]: 'Prayer XP',
    [PlotType.Slayer]: 'Slayer XP',
    [PlotType.Summoning]: 'Summoning XP',
    [PlotType.PrayerPointsGained]: 'Prayer Points Gained',
    [PlotType.PrayerPointsUsed]: 'Prayer Points Used',
    [PlotType.Ammo]: 'Ammo',
    [PlotType.Runes]: 'Runes',
    [PlotType.CombinationRunes]: 'Combination Runes',
    [PlotType.Potions]: 'Potions',
    [PlotType.Consumables]: 'Consumables',
    [PlotType.Tablets]: 'Tablets per type',
    [PlotType.Food]: 'Food',
    [PlotType.Death]: 'Estimated Death Rate',
    [PlotType.HighestHit]: 'Highest Hit Taken',
    [PlotType.LowestHitpoints]: 'Lowest Hitpoints',
    [PlotType.KillTime]: 'Kill Time (s)',
    [PlotType.Kills]: 'Kills',
    [PlotType.GP]: 'GP',
    [PlotType.RawGp]: 'Raw GP',
    [PlotType.SC]: 'Slayer Coins',
    [PlotType.Drops]: 'Drops',
    [PlotType.Signet]: 'Signet (%)',
    [PlotType.Pet]: 'Pet (%)'
};

export interface InterfaceState extends SyncState {
    equipmentSets: number;
    unit: Unit;
    plotType: PlotType;
    skillId: string;
}

export class InterfaceStore extends SyncStore<InterfaceState> {
    constructor() {
        super({
            source: Source.Default,
            equipmentSets: 1,
            skillId: 'melvorD:Attack',
            unit: Unit.Hour,
            plotType: PlotType.XP
        });
    }
}

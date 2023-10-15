import { SimulateStats } from 'src/shared/messages/message-type/simulate';
import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export interface MonsterInformation {
    id: string;
    name: string;
    media: string;
}

export interface SelectedLoot {
    gp: number;
    signet: number;
    drops: number;
}

export enum BarType {
    Monster = 'monster',
    Dungeon = 'dungeon',
    Slayer = 'slayer'
}

export interface SelectedBar {
    monster: MonsterInformation;
    type: BarType;
    sim?: {
        stats: SimulateStats;
        loot: SelectedLoot;
        pet: { [index: string]: number };
        result: string;
    };
}

export interface SelectedBarState extends SyncState {
    selected?: SelectedBar;
}

export class SelectedBarStore extends SyncStore<SelectedBarState> {
    constructor() {
        super({ source: Source.Default });
    }
}

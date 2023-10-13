import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export enum Unit {
    Kill = 'kill',
    Second = 's',
    Minute = 'm',
    Hour = 'h',
    Day = 'd'
}

export interface InterfaceState extends SyncState {
    equipmentSets: number;
    unit: Unit;
    skillId?: string;
}

export class InterfaceStore extends SyncStore<InterfaceState> {
    constructor() {
        super({ source: Source.Default, equipmentSets: 1, unit: Unit.Hour });
    }
}

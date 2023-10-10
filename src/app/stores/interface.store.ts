import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export interface InterfaceState extends SyncState {
    equipmentSets: number;
}

export class InterfaceStore extends SyncStore<InterfaceState> {
    constructor() {
        super({ source: Source.Default, equipmentSets: 1 });
    }
}

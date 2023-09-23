import { Source, SyncState, SyncStore } from './sync.store';

export interface PlayerState extends SyncState {
    equipmentIds: string[];
}

export class PlayerStore extends SyncStore<PlayerState> {
    constructor() {
        super({ source: Source.Default, equipmentIds: [] });
    }
}

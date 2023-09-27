import { Source, SyncState, SyncStore } from './sync.store';

export interface EquipmentState extends SyncState {
    equipmentIds: string[];
}

export class EquipmentStore extends SyncStore<EquipmentState> {
    constructor() {
        super({ source: Source.Default, equipmentIds: [] });
    }
}

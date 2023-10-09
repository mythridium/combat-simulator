import { Source, SyncState, SyncStore } from './sync.store';

export interface EquipmentItemSlot {
    slot: SlotTypes;
    occupies: SlotTypes[];
    id: string;
}

export interface EquipmentState extends SyncState {
    equipment: EquipmentItemSlot[];
}

export class EquipmentStore extends SyncStore<EquipmentState> {
    constructor() {
        super({ source: Source.Default, equipment: [] });
    }
}

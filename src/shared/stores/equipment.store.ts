import { BaseStore } from './base.store';

export interface EquipmentState {
    passive?: string;
    helmet?: string;
    consumable?: string;
    cape?: string;
    amulet?: string;
    quiver?: string;
    weapon?: string;
    platebody?: string;
    shield?: string;
    gem?: string;
    platelegs?: string;
    gloves?: string;
    boots?: string;
    ring?: string;
    summon1?: string;
    summon2?: string;

    attackStyle: string;
}

export class EquipmentStore extends BaseStore<EquipmentState> {
    constructor() {
        super({ attackStyle: '' });
    }
}

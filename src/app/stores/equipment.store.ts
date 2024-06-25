import { BaseStore } from './_base.store';

export interface EquipmentState {
    isAlternateEquipmentSelector: boolean;
}

export class EquipmentStore extends BaseStore<EquipmentState> {
    constructor() {
        super({ isAlternateEquipmentSelector: false });
    }
}

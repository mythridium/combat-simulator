import { EquipmentStore } from 'src/shared/stores/equipment.store';
import { SummaryStore } from 'src/shared/stores/summary.store';

export class GameState {
    public summary = new SummaryStore();
    public equipment = new EquipmentStore();
}

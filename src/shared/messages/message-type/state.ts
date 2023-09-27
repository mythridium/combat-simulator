import { EquipmentState } from 'src/shared/stores/equipment.store';
import { SummaryState } from 'src/shared/stores/summary.store';

export interface StateRequest {
    equipment?: EquipmentState;
}

export interface StateResponse extends SummaryState {}

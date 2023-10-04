import { ConfigurationState } from 'src/shared/stores/configuration.store';
import { EquipmentState } from 'src/shared/stores/equipment.store';
import { SummaryState } from 'src/shared/stores/summary.store';

type State<TState> = Omit<TState, 'source'>;

export interface StateRequest {
    configuration?: State<ConfigurationState>;
    equipment?: State<EquipmentState>;
}

export interface StateResponse extends State<SummaryState> {}

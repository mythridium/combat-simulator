import { PlayerState } from 'src/shared/stores/player.store';
import { SummaryState } from 'src/shared/stores/summary.store';

export interface StateRequest {
    player?: PlayerState;
}

export interface StateResponse extends SummaryState {}

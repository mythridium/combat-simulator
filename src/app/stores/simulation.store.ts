import { SimulateResponse } from 'src/shared/messages/message-type/simulate';
import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export enum State {
    Stopped,
    Running,
    Cancelling
}

export interface Result extends SimulateResponse {
    monsterId: string;
    dungeonId: string;
}

export interface SimulationState extends SyncState {
    state: State;
    result: Result[];
}

export class SimulationStore extends SyncStore<SimulationState> {
    constructor() {
        super({ source: Source.Default, state: State.Stopped, result: [] });
    }
}

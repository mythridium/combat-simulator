import { SimulateResponse } from 'src/shared/messages/message-type/simulate';
import { Source, SyncState, SyncStore } from 'src/shared/stores/sync.store';

export interface ResultsState extends SyncState {
    results: Result[];
}

export interface Result extends SimulateResponse {
    monsterId: string;
    dungeonId: string;
}

export class ResultsStore extends SyncStore<ResultsState> {
    constructor() {
        super({ source: Source.Default, results: [] });
    }
}

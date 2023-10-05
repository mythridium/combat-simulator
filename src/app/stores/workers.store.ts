import { SyncStore, SyncState, Source } from 'src/shared/stores/sync.store';

export interface WorkerState extends SyncState {
    useMaxCPU: boolean;
    isLoading: boolean;
}

export class WorkersStore extends SyncStore<WorkerState> {
    constructor() {
        super({ source: Source.Default, useMaxCPU: false, isLoading: true });
    }
}

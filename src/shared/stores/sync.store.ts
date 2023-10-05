import { BaseStore, Subscription } from './base.store';

export enum Source {
    Default = 'default',
    Interface = 'interface',
    Worker = 'worker',
    Unknown = 'unknown'
}

export interface SyncState {
    source: Source;
}

/**
 * This store is specialised for handling a source on the state and for filtering
 * subscriptions based on a source. Useful for keeping models in bi directional sync.
 */
export class SyncStore<TState extends SyncState> extends BaseStore<TState> {
    public setState(state: Partial<TState>): void;
    public setState(source: Source, state: Omit<Partial<TState>, 'source'>): void;
    public setState(sourceOrState: Source | Partial<TState>, state?: Omit<Partial<TState>, 'source'>): void {
        let update: TState = this._state;

        if (this.isSource(sourceOrState)) {
            update = { ...update, ...state, source: sourceOrState } as TState;
        } else {
            update = { ...update, ...sourceOrState };
        }

        super.setState(update);
    }

    // @ts-ignore
    public getState(): Omit<TState, 'source'> {
        const state = super.getState();

        state.source = undefined;

        return state;
    }

    // @ts-ignore
    public get state(): Omit<TState, 'source'> {
        const state = this._state;

        state.source = undefined;

        return state;
    }

    public when(...source: [Source, ...Source[]]) {
        const subscription = new SyncSubscription<TState>();

        this.subscriptions.add(subscription);

        return subscription.when(...source);
    }

    private isSource(sourceOrState: Source | Partial<TState>): sourceOrState is Source {
        return Object.values<string>(Source).includes(<Source>sourceOrState);
    }
}

export class SyncSubscription<TState extends SyncState> extends Subscription<TState> {
    protected source: Source[];

    public emit(state: TState) {
        if (this.source.length && !this.source.includes(state.source)) {
            return;
        }

        state.source = undefined;

        super.emit(state);
    }

    public when(...source: [Source, ...Source[]]) {
        this.source = source;

        return {
            subscribe: (callback: (state: TState) => void) => this.subscribe(callback)
        };
    }
}

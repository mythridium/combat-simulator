import { ComponentSubscriptionManager } from 'src/app/modules/component-subscription-manager';
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
    // @ts-ignore
    public setState(source: Source, state: Omit<Partial<TState>, 'source'>): void {
        super.setState({ ...this._state, ...state, source });
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

        subscription.when(...source);

        return {
            subscribe: (callback: (state: Omit<TState, 'source'>) => void) => {
                const unsubscribe = subscription.subscribe(callback);
                this.subscriptions.add(subscription);

                const storeUnsubscribe = () => {
                    unsubscribe();
                    this.subscriptions.delete(subscription);
                };

                ComponentSubscriptionManager.register(storeUnsubscribe);

                return storeUnsubscribe;
            }
        };
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
    }
}

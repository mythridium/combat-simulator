import { cloneDeep } from 'lodash-es';

interface BaseState extends Object {
    [index: string | symbol]: any;
}

/**
 * Stores are immutable classes that hold state. The only way to modify the state
 * is by calling the `setState` function.
 *
 * `getState` will return an immutable reference to the state.
 *
 * Listeners can `subscribe` to changes made to the state of the store.
 *
 * On subscription, the current state is emitted.
 */
export class BaseStore<TState> {
    protected readonly subscriptions = new Set<Subscription<TState>>();

    constructor(protected state: TState) {}

    public setState(state: Partial<TState>) {
        this.state = { ...this.state, ...state };

        this.subscriptions.forEach(subscription => {
            subscription.emit(this.getState());
        });
    }

    public getState() {
        return cloneDeep(this.state);
    }

    public subscribe(callback: (state: TState) => void) {
        const subscription = new Subscription<TState>();
        const registration = subscription.subscribe(callback);

        this.subscriptions.add(subscription);

        subscription.emit(this.state);

        return registration;
    }
}

export class Subscription<TState extends BaseState> {
    public complete = false;
    public started = false;

    protected callback: (state: TState) => void;

    protected get canEmit() {
        return !this.complete && this.started;
    }

    public subscribe(callback: (state: TState) => void) {
        this.started = true;
        this.callback = callback;

        return {
            unsubscribe: () => this.unsubscribe()
        };
    }

    public emit(state: TState) {
        if (!this.canEmit) {
            return;
        }

        this.callback(state);
    }

    private unsubscribe() {
        this.complete = true;
    }
}

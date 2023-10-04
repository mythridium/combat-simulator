import { cloneDeep } from 'lodash-es';

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

    constructor(protected _state: TState) {}

    public setState(state: Partial<TState>) {
        this._state = { ...this._state, ...state };

        for (const subscription of this.subscriptions) {
            subscription.emit(this.getState());
        }
    }

    public getState() {
        return cloneDeep(this._state);
    }

    /**
     * THIS IS AN UNSAFE way to obtain the state, only use this if you want to avoid a deep clone,
     * and you are 100% not going to modify the value. If you don't know what you are doing, use
     * `getState` instead.
     */
    public get state() {
        return this._state;
    }

    public subscribe(callback: (state: TState) => void) {
        const subscription = new Subscription<TState>();
        const registration = subscription.subscribe(callback);

        this.subscriptions.add(subscription);

        subscription.emit(this.getState());

        return registration;
    }
}

export class Subscription<TState> {
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

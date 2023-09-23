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
        return this.construct(this.state) as TState;
    }

    /**
     * This function is not for regular use, this returns the raw mutable state with the root
     * root level reference broken. This is primarily used to send the object to between the
     * client and worker since Proxy's cannot be sent.
     */
    public raw(): TState {
        return { ...this.state };
    }

    public subscribe(callback: (state: TState) => void) {
        const subscription = new Subscription<TState>();
        const registration = subscription.subscribe(callback);

        this.subscriptions.add(subscription);

        subscription.emit(this.state);

        return registration;
    }

    /**
     * This function creates a proxy on the state and prevents properties on the object being set.
     *
     * In addition, getting a property will construct further proxies on the nested property if it is
     * an object giving us a deeply immutable object.
     *
     * Finally, we store an internal cache, so state can be compared by reference as being equal.
     *
     * ```ts
     * const state1 = store.getState();
     * const state2 = store.getState();
     *
     * state1 === state2 // true
     * ```
     */
    protected construct<TObject extends BaseState>(state: TObject) {
        const that = this;

        return new Proxy(state, {
            // @ts-ignore
            cache: {},
            get(target, prop) {
                if (prop === Symbol.for('ORIGINAL')) {
                    return target;
                }

                if (typeof target[prop] === 'object') {
                    if (!this.cache[prop]) {
                        this.cache[prop] = that.construct(target[prop]);
                    }

                    return this.cache[prop];
                }

                return target[prop];
            },
            set() {
                return false;
            }
        });
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

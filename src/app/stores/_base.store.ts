import { cloneDeep } from 'lodash-es';

/**
 * Stores are classes that hold state. The only way to modify the state
 * is by calling the `set` function.
 *
 * `state` will return a de-referenced version of the state.
 */
export class BaseStore<TState> {
    constructor(protected _state: TState) {}

    public set(state: Partial<TState>) {
        this._state = { ...this._state, ...cloneDeep(state) };
    }

    /**
     * Returns a reference to the state, best used for reading data. Do NOT modify state
     * through the reference. Use the `set` function instead.
     */
    public get state() {
        return this._state;
    }

    /**
     * Returns a de-referenced version of the state, safe to modify the result in any way as it
     * will not update the store.
     */
    public get safeState() {
        return cloneDeep(this._state);
    }
}

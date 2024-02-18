import { cloneDeep } from 'lodash-es';

export abstract class BaseStore<BaseState> {
    constructor(protected _state: BaseState) {}

    public get state() {
        return cloneDeep(this._state);
    }

    public update(state: Partial<BaseState>) {
        this._state = { ...this._state, ...state };
    }
}

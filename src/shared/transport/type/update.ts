import { OutOfCombatStats } from 'src/shared/_types/out-of-combat-stats';
import { Global } from 'src/shared/global';

export interface UpdateRequest<TKey extends keyof typeof Global.stores = any> {
    key: TKey;
    model: (typeof Global.stores)[TKey];
}

export interface UpdateResponse extends OutOfCombatStats {}

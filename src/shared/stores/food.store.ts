import { BaseStore } from './base.store';

export interface FoodState {
    foodId?: string;
    autoEatTier: number;
    cookingPool: boolean;
    cookingMastery: boolean;
    manualEating: boolean;
}

export class FoodStore extends BaseStore<FoodState> {
    constructor() {
        super({
            autoEatTier: 0,
            cookingPool: false,
            cookingMastery: false,
            manualEating: false
        });
    }
}

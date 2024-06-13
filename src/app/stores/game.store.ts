import { BaseStore } from './_base.store';

export interface GameState {
    dungeonIds: string[];
    depthIds: string[];
    strongholdIds: string[];
    monsterIds: string[];
    taskIds: string[];
    bardId: string;
}

export class GameStore extends BaseStore<GameState> {
    constructor() {
        super({
            dungeonIds: [],
            depthIds: [],
            strongholdIds: [],
            monsterIds: [],
            taskIds: [],
            bardId: 'melvorF:WanderingBard'
        });
    }
}

import { PlayerStore } from 'src/shared/stores/player.store';
import { SummaryStore } from 'src/shared/stores/summary.store';

export class GameState {
    public player = new PlayerStore();
    public summary = new SummaryStore();
}

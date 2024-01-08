import { SimGame } from 'src/worker/melvor/sim-game';

declare global {
    interface WorkerGlobalScope {
        game: SimGame;
    }
}

export {};

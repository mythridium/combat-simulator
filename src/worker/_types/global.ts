import { SimGame } from 'src/shared/simulator/sim-game';

declare global {
    interface WorkerGlobalScope {
        game: SimGame;
    }
}

export {};

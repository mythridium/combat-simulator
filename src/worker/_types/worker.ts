import { ModifierDataObject } from 'src/shared/_types/modifier-data';
import { SimGame } from 'src/worker/melvor/sim-game';

declare global {
    interface WorkerGlobalScope {
        game: SimGame;
        tempModifierData?: ModifierDataObject;
    }
}

export {};

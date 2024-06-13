import { SimulationRecord } from 'src/app/simulation';
import type { HistoryPage } from './history';

export interface HistoryRecord {
    id: number;
    name: string;
    record: SimulationRecord;
}

export abstract class HistoryController {
    private static historyPage: HistoryPage;
    private static history = new Map<number, HistoryRecord>();
    private static id = 0;

    public static init(historyPage: HistoryPage) {
        this.historyPage = historyPage;
    }

    public static record(record: SimulationRecord) {
        this.id++;

        const history: HistoryRecord = { id: this.id, name: `Simulation ${this.id}`, record };

        this.history.set(this.id, history);
        this.historyPage._record(history);
    }

    public static delete(id: number) {
        this.history.delete(id);
        this.historyPage._delete(id);
    }

    public static clear() {
        for (const id of this.history.keys()) {
            this.delete(id);
        }
    }
}

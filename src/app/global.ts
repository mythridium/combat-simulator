import { EquipmentStore } from 'src/shared/stores/equipment.store';
import { SummaryStore } from 'src/shared/stores/summary.store';
import { SimulationStore } from 'src/app/stores/simulation.store';
import { Color, Logger } from 'src/shared/logger';
import { ConfigurationStore } from 'src/shared/stores/configuration.store';

export abstract class Global {
    public static logger = new Logger('Client', Color.Green);

    public static summary = new SummaryStore();
    public static configuration = new ConfigurationStore();
    public static equipment = new EquipmentStore();
    public static simulation = new SimulationStore();
}

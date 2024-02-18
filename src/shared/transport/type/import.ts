import { OutOfCombatStats } from 'src/shared/_types/out-of-combat-stats';
import { ConfigurationState } from 'src/shared/stores/configuration.store';
import { EquipmentState } from 'src/shared/stores/equipment.store';
import { FoodState } from 'src/shared/stores/food.store';

export interface ImportRequest {
    configuration: ConfigurationState;
    equipment: EquipmentState;
    food: FoodState;
}

export interface ImportResponse extends OutOfCombatStats {}

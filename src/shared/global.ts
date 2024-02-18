import { ConfigurationStore } from './stores/configuration.store';
import { EquipmentStore } from './stores/equipment.store';
import { FoodStore } from './stores/food.store';

export abstract class Global {
    public static async time(callback: () => Promise<void>) {
        const start = performance.now();

        await callback();

        return Math.round(performance.now() - start);
    }

    public static stores = {
        configuration: new ConfigurationStore(),
        equipment: new EquipmentStore(),
        food: new FoodStore()
    };
}

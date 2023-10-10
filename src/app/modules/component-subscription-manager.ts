import { BaseComponent } from 'src/app/interface/components/blocks/base-component';

export abstract class ComponentSubscriptionManager {
    private static readonly registrations = new Map<BaseComponent, (() => void)[]>();
    private static instance?: BaseComponent;

    public static set(instance: BaseComponent) {
        this.instance = instance;
    }

    public static register(unsubscribe: () => void) {
        if (!this.instance) {
            return;
        }

        if (!this.registrations.has(this.instance)) {
            this.registrations.set(this.instance, []);
        }

        const registrations = this.registrations.get(this.instance);

        registrations.push(unsubscribe);

        this.registrations.set(this.instance, registrations);
    }

    public static destroy(instance: BaseComponent) {
        if (!this.registrations.has(instance)) {
            return;
        }

        const registrations = this.registrations.get(instance);

        for (const registration of registrations) {
            registration();
        }

        this.registrations.delete(instance);
    }
}

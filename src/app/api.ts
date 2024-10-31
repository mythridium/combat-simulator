import { clone } from 'lodash-es';
import { Global } from './global';
import { SettingsController, Settings } from './settings-controller';

export interface ModOptions {
    name: string;
    icon: string;
}

export interface ModDefinition extends ModOptions {
    header?: { title: string; description?: string };
    entitlements?: { toth?: boolean; aod?: boolean; ita?: boolean };
}

export abstract class Api {
    public static modDefinitions: Map<string, ModDefinition> = new Map();

    public static init() {
        return {
            isLoaded: Global.isLoaded,
            import: (settings: Settings) => SettingsController.import(settings),
            export: () => SettingsController.export(),
            registerNamespace: (namespace: string, options?: ModOptions) => this.register(namespace, options),
            registeredNamespaces: () => clone(Global.registeredNamespaces)
        };
    }

    public static register(namespace: string, options?: ModOptions) {
        if (namespace && typeof namespace === 'string') {
            Global.registeredNamespaces.push(namespace.toLowerCase());
        } else {
            throw new Error(`A namespace of type string is required to register with Combat Simulator.`);
        }

        if (options) {
            this.modDefinitions.set(namespace, { ...options });

            if (options.name !== undefined && (typeof options.name !== 'string' || options.name === '')) {
                throw new Error(`Name must be a string.`);
            }

            if (options.icon !== undefined && (typeof options.icon !== 'string' || options.icon === '')) {
                throw new Error(`Icon must be a string.`);
            }
        }

        if (Global.isLoadedSync) {
            const definition = this.modDefinitions.get(namespace);

            Global.userInterface.menu.addModDefinition(namespace, definition);
            Global.userInterface.mobileMenu.addModDefinition(namespace, definition);
            Global.userInterface.pages.addModDefinition(namespace, definition);
        }

        return {};
    }
}

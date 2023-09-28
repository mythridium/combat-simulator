import { InitRequest } from 'src/shared/messages/message-type/init';

export class Environment {
    public async init(data: InitRequest) {
        importScripts(...data.scripts);

        const cloudManager = {
            hasFullVersionEntitlement: data.entitlements.full,
            hasTotHEntitlement: data.entitlements.toth,
            hasAoDEntitlement: data.entitlements.aod,
            isTest: false,
            log: () => {},
            setStatus: () => {}
        };

        self.cloudManager = cloudManager;

        this.evalGlobal(`
            Minibar = class Minibar {};
            loadedLangJson = {};
        `);

        const { SimGame } = await import(/* webpackMode: "eager" */ 'src/worker/simulator/sim-game');

        (<any>self).game = new SimGame();

        this.evalGlobal(`game = self.game;`);

        await this.loadData(data.origin);
        this.loadModData(data.dataPackages, data.skills);
    }

    private async loadData(origin: string) {
        const url = (file: string) => `${origin}/assets/data/${file}.json?${DATA_VERSION}`;

        await game.fetchAndRegisterDataPackage(url('melvorDemo'));

        if (cloudManager.hasFullVersionEntitlement) {
            await game.fetchAndRegisterDataPackage(url('melvorFull'));

            if (cloudManager.hasTotHEntitlement) {
                await game.fetchAndRegisterDataPackage(url('melvorTotH'));
            }

            if (cloudManager.hasAoDEntitlement) {
                await game.fetchAndRegisterDataPackage(url('melvorExpansion2'));
            }
        }
    }

    private loadModData(dataPackages: [DataNamespace, GameDataPackage][], skills: [string, DataNamespace][]) {
        for (const [id, namespace] of skills) {
            try {
                this.registerNamespace(namespace);
                game.registerSkill(namespace, this.mockSkill(id));
            } catch (exception) {
                exception.message = `Failed to load register mod skill from: '${namespace.displayName}'\n\n${exception.message}`;
                throw exception;
            }
        }

        for (const [namespace, dataPackage] of dataPackages) {
            try {
                this.registerNamespace(namespace);
                game.registerDataPackage(dataPackage);
            } catch (exception) {
                exception.message = `Failed to load mod data from: '${namespace.displayName}'\n\n${exception.message}`;
                throw exception;
            }
        }
    }

    private registerNamespace(namespace: DataNamespace) {
        if (!game.registeredNamespaces.hasNamespace(namespace.name)) {
            game.registeredNamespaces.registerNamespace(namespace.name, namespace.displayName, namespace.isModded);
        }
    }

    /**
     * When calling eval in a module, eval executes in scope of the modal, by calling eval indirectly,
     * it shifts the scope to the global object.
     */
    private evalGlobal(script: string) {
        // @ts-ignore - needed to bind these to global scope and not the module
        (1, eval)(script);
    }

    private mockSkill(id: string) {
        class MockSkill extends Skill<any> {
            public _media = '';
            public renderQueue = new SkillRenderQueue();

            constructor(namespace: DataNamespace, game: Game) {
                super(namespace, id, game);
            }

            public activeTick() {}
        }

        return MockSkill;
    }
}

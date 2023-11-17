import { App } from './app/app';
import { MICSR } from './app/micsr';
import { Menu } from './app/menu';
import { SimClasses } from './app/sim';

export class Main {
    constructor(private readonly context: Modding.ModContext) {}

    public init() {
        this.context.onInterfaceReady(() => {
            this.sidebar();

            return this.load();
        });
    }

    private async load() {
        const urls = {
            crossedOut: this.context.getResourceUrl('assets/cross.svg'),
            simulationWorker: this.context.getResourceUrl('simulator.mjs')
        };

        await SimClasses.init();

        const micsr = new MICSR(this.context);
        const modalID = 'mcsModal';
        const modal = Menu.addModal(`${micsr.name} ${micsr.version}`, modalID);

        let tryLoad = micsr.tryLoad();

        if (tryLoad) {
            try {
                const saveString = game.generateSaveString();
                const reader = new SaveWriter('Read', 1);
                const saveVersion = reader.setDataFromSaveString(saveString);
                const simGame = new SimClasses.SimGame(micsr, game);

                await micsr.fetchData();
                await micsr.initialize(simGame, game);

                simGame.decode(reader, saveVersion);
                simGame.onLoad();
                simGame.resetToBlankState();

                const app = new App(game, simGame);
                await app.initialize(urls, modal);

                if (micsr.wrongVersion) {
                    micsr.logger.log(
                        `${micsr.name} ${micsr.version} loaded, but simulation results may be inaccurate due to game version incompatibility.`
                    );

                    micsr.logger.log(
                        `No further warnings will be given when loading the simulator in Melvor ${gameVersion}`
                    );

                    localStorage.setItem('MICSR-gameVersion', gameVersion);
                } else {
                    micsr.logger.log(`${micsr.name} ${micsr.version} loaded.`);
                }

                // @ts-expect-error
                window.micsr_app = app;
            } catch (error: any) {
                let baseString = `${micsr.name} ${micsr.version} was not loaded due to the following error:`;
                micsr.logger.warn(baseString);
                micsr.logger.error(error);
                const modalContent = $(modal).find('.modal-content');
                modalContent.append(`${baseString} ${error}`);
                if (error.stack) {
                    modalContent.append(`Stacktrace: ${(error as Error).stack?.replace('\n', '<br />')}`);
                }
            }
        } else {
            micsr.logger.warn(`${micsr.name} ${micsr.version} was not loaded due to game version incompatibility.`);
        }
    }

    private sidebar() {
        sidebar.category('Modding').item('Combat Simulator', {
            icon: 'assets/media/skills/combat/combat.png',
            itemClass: 'micsr-open-button',
            onRender: elements => {
                const itemElement = $(elements.itemEl);
                itemElement.attr('data-toggle', 'modal');
                itemElement.attr('data-target', '#mcsModal');
            }
        });
    }
}

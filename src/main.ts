import 'src/shared/constants';
import { Interface } from 'src/app/interface/interface';
import { MICSR } from './shared/micsr';
import { Menu } from 'src/app/interface/menu';
import { SimClasses } from 'src/shared/simulator/sim';
import { Global } from './app/global';

export abstract class Main {
    public static init(context: Modding.ModContext) {
        Global.context = context;

        Global.context.onInterfaceReady(() => {
            this.sidebar();

            return this.load();
        });
    }

    private static async load() {
        const urls = {
            crossedOut: Global.context.getResourceUrl('assets/cross.svg')
        };

        await SimClasses.init();

        Global.micsr = new MICSR(Global.context);
        const modalID = 'mcsModal';
        const modal = Menu.addModal(`${Global.micsr.name} ${Global.micsr.version}`, modalID);

        let tryLoad = Global.micsr.tryLoad();

        if (tryLoad) {
            try {
                const saveString = game.generateSaveString();
                const reader = new SaveWriter('Read', 1);
                const saveVersion = reader.setDataFromSaveString(saveString);
                const simGame = new SimClasses.SimGame(Global.micsr);

                await Global.micsr.fetchData();
                await Global.micsr.initialize(simGame, game);

                simGame.decode(reader, saveVersion);
                simGame.onLoad();
                simGame.resetToBlankState();

                const app = new Interface(game, simGame);
                await app.initialize(urls, modal);

                if (Global.micsr.wrongVersion) {
                    Global.micsr.logger.log(
                        `${Global.micsr.name} ${Global.micsr.version} loaded, but simulation results may be inaccurate due to game version incompatibility.`
                    );

                    Global.micsr.logger.log(
                        `No further warnings will be given when loading the simulator in Melvor ${gameVersion}`
                    );

                    localStorage.setItem('MICSR-gameVersion', gameVersion);
                } else {
                    Global.micsr.logger.log(`${Global.micsr.name} ${Global.micsr.version} loaded.`);
                }

                // @ts-expect-error
                window.micsr_app = app;
            } catch (error: any) {
                let baseString = `${Global.micsr.name} ${Global.micsr.version} was not loaded due to the following error:`;
                Global.micsr.logger.warn(baseString);
                Global.micsr.logger.error(error);
                const modalContent = $(modal).find('.modal-content');
                modalContent.append(`${baseString} ${error}`);
                if (error.stack) {
                    modalContent.append(`Stacktrace: ${(error as Error).stack?.replace('\n', '<br />')}`);
                }
            }
        } else {
            Global.micsr.logger.warn(
                `${Global.micsr.name} ${Global.micsr.version} was not loaded due to game version incompatibility.`
            );
        }
    }

    private static sidebar() {
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

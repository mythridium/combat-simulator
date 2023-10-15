import './gamemode.scss';
import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { Source } from 'src/shared/stores/sync.store';
import { DropdownComponent } from 'src/app/interface/components/blocks/dropdown-component';

declare global {
    interface Gamemode {
        requireLocalStorageKey?: string;
    }
}

export class GamemodeComponent extends BaseComponent {
    constructor() {
        super({ id: 'mcs-gamemode', tag: 'div', classes: ['w-100', 'my-1'] });
    }

    protected init() {
        Global.configuration.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        this.append(
            new DropdownComponent({
                id: 'mcs-gamemode-dropdown',
                classes: ['w-100'],
                options: game.gamemodes.allObjects
                    .filter(gamemode => this.isGamemodeAvailable(gamemode))
                    .map(gamemode => ({ text: gamemode.name, value: gamemode.id })),
                default: () => Global.configuration.state.gamemode,
                onChange: option => {
                    Global.configuration.setState(Source.Interface, { gamemode: option.value });
                }
            })
        );

        super.preRender(container);
    }

    private isGamemodeAvailable(gamemode: Gamemode) {
        if (gamemode.id === `melvorD:Unset`) {
            return false;
        }

        if (gamemode.startDate !== undefined && gamemode.startDate > Date.now()) {
            return false;
        }

        if (gamemode.endDate > 0 && Date.now() > gamemode.endDate) {
            return false;
        }

        if (
            gamemode.requireLocalStorageKey !== undefined &&
            (localStorage.getItem(gamemode.requireLocalStorageKey) === null ||
                localStorage.getItem(gamemode.requireLocalStorageKey) === undefined)
        ) {
            return false;
        }

        return true;
    }
}

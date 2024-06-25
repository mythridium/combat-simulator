import './settings.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Dropdown, DropdownOption } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import type { ImportDialog } from './import-dialog/import-dialog';
import type { ExportDialog } from './export-dialog/export-dialog';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { Plotter } from 'src/app/user-interface/pages/simulate/plotter/plotter';
import { StorageKey } from 'src/app/utils/account-storage';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-settings': SettingsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/settings/settings.html')
export class SettingsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _trials: HTMLInputElement;
    private readonly _ticks: HTMLInputElement;
    private readonly _alternateEquipmentSelector: Switch;
    private readonly _smallPlotter: Switch;
    private readonly _filterTargetDropdown: Switch;
    private readonly _importOnFirstOpen: Switch;
    private readonly _gamemode: Dropdown;
    private readonly _importButton: HTMLButtonElement;
    private readonly _importDialog: ImportDialog;
    private readonly _exportButton: HTMLButtonElement;
    private readonly _exportDialog: ExportDialog;
    private readonly _tooltipHint: HTMLDivElement;

    private _plotter: Plotter;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-settings-template'));

        this._trials = getElementFromFragment(this._content, 'mcs-settings-trials', 'input');
        this._ticks = getElementFromFragment(this._content, 'mcs-settings-ticks', 'input');
        this._alternateEquipmentSelector = getElementFromFragment(
            this._content,
            'mcs-settings-alternate-equipment-selector',
            'mcs-switch'
        );
        this._smallPlotter = getElementFromFragment(this._content, 'mcs-settings-small-plotter', 'mcs-switch');
        this._filterTargetDropdown = getElementFromFragment(
            this._content,
            'mcs-settings-filter-target-dropdown',
            'mcs-switch'
        );
        this._importOnFirstOpen = getElementFromFragment(
            this._content,
            'mcs-settings-import-on-first-open',
            'mcs-switch'
        );
        this._gamemode = getElementFromFragment(this._content, 'mcs-gamemode', 'mcs-dropdown');
        this._importButton = getElementFromFragment(this._content, 'mcs-settings-import', 'button');
        this._importDialog = getElementFromFragment(this._content, 'mcs-import-dialog', 'mcs-import-dialog');
        this._exportButton = getElementFromFragment(this._content, 'mcs-settings-export', 'button');
        this._exportDialog = getElementFromFragment(this._content, 'mcs-export-dialog', 'mcs-export-dialog');
        this._tooltipHint = getElementFromFragment(this._content, 'mcs-settings-tooltip-hint', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._plotter = Global.userInterface.main.querySelector('mcs-plotter');

        this._trials.oninput = event => this._onChange(event, 'trials');
        this._ticks.oninput = event => this._onChange(event, 'ticks');

        const isAlternateEquipmentSelector =
            Global.context.accountStorage.getItem(StorageKey.AlternateEquipmentSelector) ??
            Global.stores.equipment.state.isAlternateEquipmentSelector;

        this._alternateEquipmentSelector._toggle(isAlternateEquipmentSelector);

        Global.stores.equipment.set({ isAlternateEquipmentSelector });

        this._alternateEquipmentSelector._on(isChecked => {
            Global.stores.equipment.set({ isAlternateEquipmentSelector: isChecked });
            Global.context.accountStorage.setItem(StorageKey.AlternateEquipmentSelector, isChecked);
        });

        const isSmallPlotter =
            Global.context.accountStorage.getItem(StorageKey.SmallPlotter) ?? Global.stores.plotter.state.smallPlotter;

        this._plotter.classList.toggle('mcs-small-plotter', isSmallPlotter);
        this._smallPlotter._toggle(isSmallPlotter);

        Global.stores.plotter.set({ smallPlotter: isSmallPlotter });

        this._smallPlotter._on(isChecked => {
            Global.stores.plotter.set({ smallPlotter: isChecked });
            Global.context.accountStorage.setItem(StorageKey.SmallPlotter, isChecked);

            this._plotter.classList.toggle('mcs-small-plotter', isChecked);
            this._plotter._updateLabels();
        });

        const isFilterTargetDropdown =
            Global.context.accountStorage.getItem(StorageKey.FilterTargetDropdown) ??
            Global.stores.plotter.state.filterTargetDropdown;

        Global.stores.plotter.set({ filterTargetDropdown: isFilterTargetDropdown });

        this._filterTargetDropdown._toggle(isFilterTargetDropdown);
        this._filterTargetDropdown._on(isChecked => {
            Global.stores.plotter.set({ filterTargetDropdown: isChecked });
            Global.context.accountStorage.setItem(StorageKey.FilterTargetDropdown, isChecked);

            Global.userInterface.main.querySelector('mcs-simulate')._updateSelectTarget();
        });

        this._importOnFirstOpen._toggle(Global.context.accountStorage.getItem(StorageKey.ImportOnFirstOpen) ?? false);
        this._importOnFirstOpen._on(isChecked => {
            Global.context.accountStorage.setItem(StorageKey.ImportOnFirstOpen, isChecked);
        });

        this._gamemode._init({
            search: false,
            label: 'Gamemode',
            default: Global.game.currentGamemode.id,
            options: Global.game.gamemodes.allObjects.map(gamemode => ({
                text: gamemode.name,
                value: gamemode.id
            })),
            onChange: option => this._onGamemodeChange(option)
        });

        this._importButton.onclick = () => this._importDialog._open();
        this._exportButton.onclick = () => this._exportDialog._open();

        this._trials.value =
            Global.context.accountStorage.getItem(StorageKey.Trials) ?? Global.stores.simulator.state.trials.toString();

        this._ticks.value =
            Global.context.accountStorage.getItem(StorageKey.Ticks) ?? Global.stores.simulator.state.ticks.toString();

        Global.stores.simulator.set({ trials: parseInt(this._trials.value), ticks: parseInt(this._ticks.value) });

        if (nativeManager.isMobile) {
            this._tooltipHint.style.display = 'none';
        }
    }

    public _import(gamemodeId: string) {
        const gamemode = Global.game.gamemodes.getObjectByID(gamemodeId);

        if (!gamemode) {
            throw new Error(
                `Tried to import gamemode with id '${gamemodeId}', but that gamemode has not been registered.`
            );
        }

        this._gamemode._select(gamemode.id);
    }

    private _onChange(event: Event, key: string) {
        // @ts-ignore
        let value = parseInt(event.currentTarget.value);
        const input = event.currentTarget as HTMLInputElement;

        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (value < min) {
            input.value = min.toString();
            value = min;
        }

        if (value > max) {
            input.value = max.toString();
            value = max;
        }

        if (value >= min && value <= max) {
            const state: { [index: string]: number } = {};
            state[key] = value;
            Global.stores.simulator.set(state);
            Global.context.accountStorage.setItem(key, value);
        }
    }

    private _onGamemodeChange(option: DropdownOption) {
        const gamemode = Global.game.gamemodes.getObjectByID(option.value);

        // reset existing gamemode modifiers
        for (const modifier of Global.game.currentGamemode.disabledModifiers) {
            modifier.disabled = false;
        }

        Global.game.currentGamemode = gamemode;
        Global.game.combat.player.currentGamemodeID = gamemode.id;

        // disable new gamemode modifiers
        for (const modifier of Global.game.currentGamemode.disabledModifiers) {
            modifier.disabled = true;
        }

        this._toggleMenuItems('.mcs-ancient-relics-menu', Global.game.currentGamemode.allowAncientRelicDrops, () => {
            Global.userInterface.main.querySelector('mcs-ancient-relics')._import([]);
            this._importDialog._update();
        });

        StatsController.update();

        Global.userInterface.main.querySelector('mcs-equipment-page')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-potions')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-agility')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-pets')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-skill-trees')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-cartography')._updateTooltips();
        Global.userInterface.main.querySelector('mcs-astrology')._updateTooltips();
    }

    private _toggleMenuItems(selector: string, toggle: boolean, callback: () => void) {
        const menuItems = Global.userInterface.main.querySelectorAll<HTMLElement>(selector);

        if (menuItems.length) {
            for (const element of Array.from(menuItems)) {
                element.style.display = toggle ? '' : 'none';
            }
        }

        callback();
    }
}

customElements.define('mcs-settings', SettingsPage);

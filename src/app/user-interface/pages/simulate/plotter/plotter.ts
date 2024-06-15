import './plotter.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Format } from 'src/app/utils/format';
import { PlotterGridLine } from './grid-line/grid-line';
import { PlotterBar } from './bar/bar';
import { PlotterXAxisLabel } from './x-axis-label/x-axis-label';
import { PlotterYAxisLabel } from './y-axis-label/y-axis-label';
import { Util } from 'src/shared/util';
import { Lookup } from 'src/shared/utils/lookup';
import { BarType } from 'src/app/stores/plotter.store';
import { SimulationData } from 'src/app/simulation';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { Information } from 'src/app/user-interface/information/information';
import { Notify } from 'src/app/utils/notify';
import { Drops } from 'src/app/drops';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { LootPage } from 'src/app/user-interface/pages/configuration/loot/loot';
import type { SimulatePage } from 'src/app/user-interface/pages/simulate/simulate';
import { clone, uniqBy } from 'lodash-es';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-plotter': Plotter;
    }
}

interface Bars {
    totalBars: number;
    names: string[];
    images: string[];
    bottomNames: string[];
    bottomLength: number[];
}

interface Elements {
    gridLines: PlotterGridLine[];
    bars: PlotterBar[];
    xAxis: PlotterXAxisLabel[];
    yAxis: PlotterYAxisLabel[];
    labels: HTMLDivElement[];
    sections: HTMLDivElement[];
}

@LoadTemplate('app/user-interface/pages/simulate/plotter/plotter.html')
export class Plotter extends HTMLElement {
    public monstersToggled = true;
    public barrierMonstersToggled = true;
    public dungeonsToggled = false;
    public strongholdsToggled = false;
    public depthsToggled = false;
    public slayerToggled = false;

    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _plotBox: HTMLDivElement;
    private readonly _yAxis: HTMLDivElement;
    private readonly _xAxis: HTMLDivElement;

    private readonly bars: Bars = {
        totalBars: 0,
        names: [],
        images: [],
        bottomNames: [],
        bottomLength: []
    };

    private readonly _elements: Elements = {
        gridLines: [],
        bars: [],
        xAxis: [],
        yAxis: [],
        labels: [],
        sections: []
    };

    private _bottomLength = 0;

    private _slayer: Switch;
    private _information: Information;
    private _inspect: HTMLButtonElement;
    private _stopInspect: HTMLButtonElement;
    private _toggles: HTMLDivElement;
    private _loot: LootPage;

    constructor() {
        super();

        this._init();

        this._content.append(getTemplateNode('mcs-plotter-template'));

        this._container = getElementFromFragment(this._content, 'mcs-plot-container', 'div');
        this._plotBox = getElementFromFragment(this._content, 'mcs-plot-box', 'div');
        this._yAxis = getElementFromFragment(this._content, 'mcs-plot-y-axis', 'div');
        this._xAxis = getElementFromFragment(this._content, 'mcs-plot-x-axis', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._create();

        this._slayer = Global.userInterface.main.querySelector('.mcs-simulate-slayer-task');
        this._information = Global.userInterface.main.querySelector('.mcs-main-information');
        this._inspect = Global.userInterface.main.querySelector('.mcs-inspect');
        this._stopInspect = Global.userInterface.main.querySelector('.mcs-stop-inspect');
        this._toggles = Global.userInterface.main.querySelector('.mcs-simulate-toggle-container');
        this._loot = Global.userInterface.main.querySelector('mcs-loot');

        this._container.onwheel = event => {
            event.preventDefault();

            if (Math.abs(event.deltaX)) {
                this._container.scrollLeft += event.deltaX;
            } else {
                this._container.scrollLeft += event.deltaY;
            }
        };
    }

    public _toggleCross(index: number, toggle: boolean) {
        this._elements.xAxis[index]._toggle(toggle);
        (this.parentElement as SimulatePage)._updateSelectTarget();
    }

    public _updateCrosses() {
        for (const index of Global.stores.plotter.state.bars.types.keys()) {
            if (
                Global.stores.plotter.barIsMonster(index) &&
                !Global.simulation.monsterSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]
            ) {
                this._elements.xAxis[index]._toggle(true);
            } else if (
                Global.stores.plotter.barIsDungeon(index) &&
                !Global.simulation.dungeonSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]
            ) {
                this._elements.xAxis[index]._toggle(true);
            } else if (
                Global.stores.plotter.barIsStronghold(index) &&
                !Global.simulation.strongholdSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]
            ) {
                this._elements.xAxis[index]._toggle(true);
            } else if (
                Global.stores.plotter.barIsDepth(index) &&
                !Global.simulation.depthSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]
            ) {
                this._elements.xAxis[index]._toggle(true);
            } else if (
                Global.stores.plotter.barIsTask(index) &&
                !Global.simulation.slayerSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]
            ) {
                this._elements.xAxis[index]._toggle(true);
            } else {
                this._elements.xAxis[index]._toggle(false);
            }
        }

        (this.parentElement as SimulatePage)._updateSelectTarget();
    }

    public _toggleZoneLabels(toggle: boolean) {
        for (const label of this._elements.labels) {
            label.style.display = toggle ? '' : 'none';
        }

        for (const section of this._elements.sections) {
            section.style.display = toggle ? '' : 'none';
        }
    }

    public _toggleHighlight(index: number, toggle: boolean) {
        this._elements.bars[index]._set({ border: toggle });
    }

    /** Toggle enable/disable state of entities on the plotter. */
    public _toggleEntity(index: number) {
        if (Global.stores.plotter.state.isInspecting) {
            return;
        }

        let checked: boolean;

        if (Global.stores.plotter.barIsDungeon(index)) {
            const dungeonId = Global.stores.plotter.state.bars.monsterIds[index];
            checked = !Global.simulation.dungeonSimFilter[dungeonId];

            if (checked && Global.game.combat.player.isSlayerTask) {
                this._slayer._toggle(false);
                Global.game.combat.player.isSlayerTask = false;

                this.slayerToggled = false;

                for (const taskId of Global.stores.game.state.taskIds) {
                    Global.simulation.slayerSimFilter[taskId] = false;
                }

                this._updateCrosses();

                Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
            }

            Global.simulation.dungeonSimFilter[dungeonId] = checked;
        } else if (Global.stores.plotter.barIsStronghold(index)) {
            const strongholdId = Global.stores.plotter.state.bars.monsterIds[index];
            checked = !Global.simulation.strongholdSimFilter[strongholdId];

            if (checked && Global.game.combat.player.isSlayerTask) {
                this._slayer._toggle(false);
                Global.game.combat.player.isSlayerTask = false;

                this.slayerToggled = false;

                for (const taskId of Global.stores.game.state.taskIds) {
                    Global.simulation.slayerSimFilter[taskId] = false;
                }

                this._updateCrosses();

                Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
            }

            Global.simulation.strongholdSimFilter[strongholdId] = checked;
        } else if (Global.stores.plotter.barIsDepth(index)) {
            const depthId = Global.stores.plotter.state.bars.monsterIds[index];
            checked = !Global.simulation.depthSimFilter[depthId];

            if (checked && Global.game.combat.player.isSlayerTask) {
                this._slayer._toggle(false);
                Global.game.combat.player.isSlayerTask = false;

                this.slayerToggled = false;

                for (const taskId of Global.stores.game.state.taskIds) {
                    Global.simulation.slayerSimFilter[taskId] = false;
                }

                this._updateCrosses();

                Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
            }

            Global.simulation.depthSimFilter[depthId] = checked;
        } else if (Global.stores.plotter.barIsTask(index)) {
            const taskId = Global.stores.plotter.state.bars.monsterIds[index];
            checked = !Global.simulation.slayerSimFilter[taskId];

            if (checked && !Global.game.combat.player.isSlayerTask) {
                this._slayer._toggle(true);
                Global.game.combat.player.isSlayerTask = true;

                this.dungeonsToggled = false;
                this.strongholdsToggled = false;
                this.depthsToggled = false;

                for (const dungeonId of Global.stores.game.state.dungeonIds) {
                    Global.simulation.dungeonSimFilter[dungeonId] = false;
                }

                for (const strongholdId of Global.stores.game.state.strongholdIds) {
                    Global.simulation.strongholdSimFilter[strongholdId] = false;
                }

                for (const depthId of Global.stores.game.state.depthIds) {
                    Global.simulation.depthSimFilter[depthId] = false;
                }

                this._updateCrosses();

                Notify.message('Slayer Task has been enabled and simulating as being on task.', 'success');
            }

            Global.simulation.slayerSimFilter[taskId] = checked;
        } else {
            const monsterId = Global.stores.plotter.state.bars.monsterIds[index];
            Global.simulation.monsterSimFilter[monsterId] = !Global.simulation.monsterSimFilter[monsterId];
            checked = Global.simulation.monsterSimFilter[monsterId];
        }

        this._toggleCross(index, !checked);

        if (!checked && Global.stores.plotter.state.selectedBar === index) {
            Global.stores.plotter.set({ isBarSelected: false });
            this._toggleHighlight(index, false);
        }

        this._updateData();
    }

    public _toggleMonsters() {
        this.monstersToggled = !this.monstersToggled;

        for (const monsterId of Global.stores.game.state.monsterIds) {
            if (Lookup.monsters.getObjectByID(monsterId)?.hasBarrier) {
                continue;
            }

            Global.simulation.monsterSimFilter[monsterId] = this.monstersToggled;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _toggleBarrierMonsters() {
        this.barrierMonstersToggled = !this.barrierMonstersToggled;

        for (const monsterId of Global.stores.game.state.monsterIds) {
            if (!Lookup.monsters.getObjectByID(monsterId)?.hasBarrier) {
                continue;
            }

            Global.simulation.monsterSimFilter[monsterId] = this.barrierMonstersToggled;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _toggleDungeons(toggle: boolean) {
        if (toggle && Global.game.combat.player.isSlayerTask) {
            this._slayer._toggle(false);
            Global.game.combat.player.isSlayerTask = !toggle;
            this.slayerToggled = !toggle;

            for (const taskId of Global.stores.game.state.taskIds) {
                Global.simulation.slayerSimFilter[taskId] = !toggle;
            }

            Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.dungeonsToggled = toggle;

        for (const dungeonId of Global.stores.game.state.dungeonIds) {
            Global.simulation.dungeonSimFilter[dungeonId] = toggle;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _toggleStrongholds(toggle: boolean) {
        if (toggle && Global.game.combat.player.isSlayerTask) {
            this._slayer._toggle(false);
            Global.game.combat.player.isSlayerTask = !toggle;
            this.slayerToggled = !toggle;

            for (const taskId of Global.stores.game.state.taskIds) {
                Global.simulation.slayerSimFilter[taskId] = !toggle;
            }

            Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.strongholdsToggled = toggle;

        for (const strongholdId of Global.stores.game.state.strongholdIds) {
            Global.simulation.strongholdSimFilter[strongholdId] = toggle;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _toggleDepths(toggle: boolean) {
        if (toggle && Global.game.combat.player.isSlayerTask) {
            this._slayer._toggle(false);
            Global.game.combat.player.isSlayerTask = !toggle;
            this.slayerToggled = !toggle;

            for (const taskId of Global.stores.game.state.taskIds) {
                Global.simulation.slayerSimFilter[taskId] = !toggle;
            }

            Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.depthsToggled = toggle;

        for (const depthId of Global.stores.game.state.depthIds) {
            Global.simulation.depthSimFilter[depthId] = toggle;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _toggleSlayer(toggle: boolean) {
        if (toggle && !Global.game.combat.player.isSlayerTask) {
            this._slayer._toggle(true);
            Global.game.combat.player.isSlayerTask = toggle;
            this.dungeonsToggled = !toggle;
            this.strongholdsToggled = !toggle;
            this.depthsToggled = !toggle;

            for (const dungeonId of Global.stores.game.state.dungeonIds) {
                Global.simulation.dungeonSimFilter[dungeonId] = !toggle;
            }

            for (const strongholdId of Global.stores.game.state.strongholdIds) {
                Global.simulation.strongholdSimFilter[strongholdId] = !toggle;
            }

            for (const depthId of Global.stores.game.state.depthIds) {
                Global.simulation.depthSimFilter[depthId] = !toggle;
            }

            Notify.message('Slayer Task has been enabled and simulating as being on task.', 'success');
        } else if (!toggle && Global.game.combat.player.isSlayerTask) {
            this._slayer._toggle(false);
            Global.game.combat.player.isSlayerTask = toggle;
            Notify.message('Slayer Task has been disabled and simulating not being on task.', 'danger');
        }

        this.slayerToggled = toggle;

        for (const taskId of Global.stores.game.state.taskIds) {
            Global.simulation.slayerSimFilter[taskId] = toggle;
        }

        this._updateData();
        this._updateCrosses();
    }

    public _selectTarget(current: number) {
        if (current !== -1 && Global.stores.plotter.state.selectedBar !== current) {
            this._selectBar(current);

            const bar = this._elements.bars[current];
            this._container.scrollLeft = bar.offsetLeft + this._yAxis.offsetWidth - this._container.offsetWidth / 2;
        }
    }

    public _selectActiveTarget() {
        if (!Global.melvor.combat.isActive) {
            Notify.message('You are not in combat in the actual game, could not select anything', 'danger');
            return;
        }

        if (Global.stores.plotter.state.isInspecting) {
            Notify.message('Cannot select active target while inspecting a dungeon', 'danger');
            return;
        }

        let index = -1;

        const task = Global.melvor.combat.slayerTask;

        if (task.active && task.autoSlayer && task.monster?.id === Global.melvor.combat.selectedMonster?.id) {
            // slayer
            index = Global.stores.plotter.state.bars.monsterIds.findIndex(
                // @ts-ignore // TODO: TYPES
                id => id === Global.melvor.combat.slayerTask.category.id
            );
            // @ts-ignore // TODO: TYPES
        } else if (Global.melvor.combat.selectedArea instanceof Stronghold) {
            // stronghold
            index = Global.stores.plotter.state.bars.monsterIds.findIndex(
                // @ts-ignore // TODO: TYPES
                id => id === `${Global.melvor.combat.selectedArea.id}_${Global.melvor.combat.strongholdTier}`
            );
            // @ts-ignore // TODO: TYPES
        } else if (Global.melvor.combat.selectedArea instanceof AbyssDepth) {
            // depth
            index = Global.stores.plotter.state.bars.monsterIds.findIndex(
                id => id === Global.melvor.combat.selectedArea.id
            );
        } else if (Global.melvor.combat.selectedArea instanceof Dungeon) {
            // dungeon
            index = Global.stores.plotter.state.bars.monsterIds.findIndex(
                id => id === Global.melvor.combat.selectedArea.id
            );
        } else if (Global.melvor.combat.selectedMonster) {
            // monster
            index = Global.stores.plotter.state.bars.monsterIds.findIndex(
                id => id === Global.melvor.combat.selectedMonster.id
            );
        }

        // already selected
        if (Global.stores.plotter.state.isBarSelected && Global.stores.plotter.state.selectedBar === index) {
            return;
        }

        // not found
        if (index === -1) {
            Notify.message('Could not locate a target to select', 'danger');
            return;
        }

        if (this._elements.bars[index]) {
            this._elements.bars[index].click();

            if (Global.stores.plotter.barIsStronghold(index)) {
                if (!Global.simulation.strongholdSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]) {
                    this._toggleEntity(index);
                }
            } else if (Global.stores.plotter.barIsDepth(index)) {
                if (!Global.simulation.depthSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]) {
                    this._toggleEntity(index);
                }
            } else if (Global.stores.plotter.barIsDungeon(index)) {
                if (!Global.simulation.dungeonSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]) {
                    this._toggleEntity(index);
                }
            } else if (Global.stores.plotter.barIsTask(index)) {
                const taskID = Global.stores.plotter.state.bars.monsterIds[index];

                if (!Global.simulation.slayerSimFilter[taskID]) {
                    this._toggleEntity(index);
                }
            } else if (!Global.simulation.monsterSimFilter[Global.stores.plotter.state.bars.monsterIds[index]]) {
                this._toggleEntity(index);
            }
        }
    }

    public _selectBar(index: number) {
        if (Global.stores.plotter.state.selectedBar !== undefined) {
            if (Global.stores.plotter.state.selectedBar === index) {
                // deselect if they selected the same bar
                this._toggleHighlight(Global.stores.plotter.state.selectedBar, false);
                Global.stores.plotter.set({ isBarSelected: false, selectedBar: undefined });
            } else {
                // select new bar when switching bars
                this._toggleHighlight(Global.stores.plotter.state.selectedBar, false);
                Global.stores.plotter.set({ isBarSelected: true, selectedBar: index });
                this._toggleHighlight(index, true);
            }
        } else {
            // nothing selected, just select the bar
            Global.stores.plotter.set({ isBarSelected: true, selectedBar: index });
            this._toggleHighlight(index, true);
        }

        if (
            Global.stores.plotter.state.isBarSelected &&
            !Global.stores.plotter.state.isInspecting &&
            !Global.stores.plotter.barIsMonster(index)
        ) {
            this._inspect.disabled = false;
        } else {
            this._inspect.disabled = true;
        }

        this._information._update();
        this._loot._update();
    }

    public _viewEntity(entityId: string) {
        this._toggleHighlight(Global.stores.plotter.state.selectedBar, false);

        Global.stores.plotter.set({
            scrollLeft: this._container.scrollLeft,
            isInspecting: true,
            isBarSelected: false,
            selectedBar: undefined,
            inspectedId: entityId,
            inspectedBar: Global.stores.plotter.state.selectedBar
        });

        Drops.update();
        this._updateData();
        this._loot._update();
        this._information._update();

        const monsters = Lookup.getMonsterList(entityId);

        if (Lookup.isDungeon(entityId) || Lookup.isDepth(entityId) || Lookup.isStronghold(entityId)) {
            for (let i = 0; i < this._elements.bars.length; i++) {
                if (i < monsters.length) {
                    this._elements.xAxis[i].style.display = '';
                    this._elements.xAxis[i]._set(monsters[i].media);
                    this._elements.bars[this._elements.bars.length - i - 1].style.display = '';
                } else {
                    this._elements.xAxis[i].style.display = 'none';
                    this._elements.bars[this._elements.bars.length - i - 1].style.display = 'none';
                }
            }
        } else {
            const monsterIndices = monsters.map(monster =>
                Global.stores.plotter.state.bars.monsterIds.findIndex(monsterId => monsterId === monster.id)
            );

            for (let i = 0; i < this._elements.bars.length; i++) {
                const monsterIndex = monsterIndices.findIndex(index => index === i);

                if (monsterIndex !== -1) {
                    this._elements.xAxis[i].style.display = '';
                    this._elements.xAxis[i]._set(monsters[monsterIndex].media);
                    this._elements.bars[i].style.display = '';
                } else {
                    this._elements.xAxis[i].style.display = 'none';
                    this._elements.bars[i].style.display = 'none';
                }
            }
        }

        this._toggleZoneLabels(false);

        for (const xAxis of this._elements.xAxis) {
            xAxis._toggle(false);
        }

        this._inspect.style.display = 'none';
        this._stopInspect.style.display = '';
        this._toggles.querySelectorAll<HTMLButtonElement>('.mcs-button').forEach(button => {
            button.disabled = true;
        });

        this._container.scrollLeft = 0;
    }

    public _viewAll() {
        if (Global.stores.plotter.state.isBarSelected) {
            this._toggleHighlight(Global.stores.plotter.state.selectedBar, false);
        }

        Global.stores.plotter.set({
            isInspecting: false,
            isBarSelected: true,
            selectedBar: Global.stores.plotter.state.inspectedBar,
            inspectedId: undefined,
            inspectedBar: undefined
        });

        this._toggleHighlight(Global.stores.plotter.state.selectedBar, true);

        Drops.update();
        this._updateData();
        this._loot._update();
        this._information._update();

        const numBars = this._elements.bars.length;

        for (let i = 0; i < numBars; i++) {
            this._elements.xAxis[i].style.display = '';
            this._elements.xAxis[i]._set(this.bars.images[i]);
            this._elements.bars[i].style.display = '';
        }

        this._toggleZoneLabels(true);
        this._updateCrosses();

        this._inspect.disabled = Global.stores.plotter.barIsMonster(Global.stores.plotter.state.selectedBar);
        this._inspect.style.display = '';
        this._stopInspect.style.display = 'none';
        this._toggles.querySelectorAll<HTMLButtonElement>('.mcs-button').forEach(button => {
            button.disabled = false;
        });

        this._container.scrollLeft = Global.stores.plotter.state.scrollLeft;

        Global.stores.plotter.set({ scrollLeft: 0 });
    }

    public _getTargetElements() {
        let items = this._elements.bars.map((bar: PlotterBar, index: number) => ({ index, bar }));

        if (Global.stores.plotter.state.isInspecting) {
            if (Lookup.isSlayerTask(Global.stores.plotter.state.inspectedId)) {
                const selection = Lookup.getMonsterList(Global.stores.plotter.state.inspectedId);
                const monsterIndices = selection.map(monster =>
                    Global.stores.plotter.state.bars.monsterIds.findIndex(monsterId => monsterId === monster.id)
                );

                items = [];

                for (const index of monsterIndices) {
                    items.push({ index, bar: this._elements.bars[index] });
                }
            } else {
                const selection = Lookup.getMonsterList(Global.stores.plotter.state.inspectedId);
                const indices = selection.map((_monster, index) => this._elements.bars.length - index - 1);

                items = [];

                for (const index of indices) {
                    items.push({ index, bar: this._elements.bars[index] });
                }
            }
        }

        const elements = items.map(({ index }) => ({ index, details: this.getDetails(index) }));

        elements.sort((a, b) => a.index - b.index);

        return uniqBy(elements, item => item.details.name);
    }

    public _updateData() {
        this._update(Global.simulation.getDataSet(), Global.simulation.getRawData());
    }

    public _updateLabels(isCreate = false) {
        this._bottomLength = 0;

        if (isCreate) {
            for (let i = this.bars.bottomNames.length - 1; i > -1; i--) {
                const label = document.createElement('div');

                label.appendChild(document.createTextNode(this.bars.bottomNames[i]));
                label.classList.add('mcs-plot-label');
                label.style.right = `${
                    (100 * this._bottomLength) / this.bars.totalBars +
                    (50 * this.bars.bottomLength[i]) / this.bars.totalBars
                }%`;

                this._elements.labels.push(label);
                this._xAxis.appendChild(label);

                const section = document.createElement('div');
                section.classList.add('mcs-x-axis-section');
                section.style.width = `${(100 * this.bars.bottomLength[i]) / this.bars.totalBars}%`;
                section.style.right = `${(100 * this._bottomLength) / this.bars.totalBars}%`;

                if (i === 0) {
                    section.style.borderLeftStyle = 'solid';
                }

                this._elements.sections.push(section);
                this._xAxis.appendChild(section);
                this._bottomLength += this.bars.bottomLength[i];
            }
        } else {
            const labels = clone(this._elements.labels).reverse();
            const sections = clone(this._elements.sections).reverse();

            for (let i = this.bars.bottomNames.length - 1; i > -1; i--) {
                labels[i].style.right = `${
                    (100 * this._bottomLength) / this.bars.totalBars +
                    (50 * this.bars.bottomLength[i]) / this.bars.totalBars
                }%`;

                sections[i].style.width = `${(100 * this.bars.bottomLength[i]) / this.bars.totalBars}%`;
                sections[i].style.right = `${(100 * this._bottomLength) / this.bars.totalBars}%`;
                this._bottomLength += this.bars.bottomLength[i];
            }
        }
    }

    private _create() {
        for (let i = 0; i < 20; i++) {
            const gridLine = document.createElement('mcs-plotter-grid-line');

            gridLine._set({ bottom: (i + 1) * 5 });

            this._elements.gridLines.push(gridLine);
            this._plotBox.appendChild(gridLine);
        }

        for (let i = 0; i < this.bars.totalBars; i++) {
            const bar = document.createElement('mcs-plotter-bar');

            bar._set({ height: 0 });
            bar.onclick = () => {
                this._selectBar(i);

                const simulate = this.parentElement as SimulatePage;
                simulate?._selectTarget?._select('-1', true);
            };
            this._elements.bars.push(bar);
            this._plotBox.appendChild(bar);

            const xAxis = document.createElement('mcs-plotter-x-axis-label');

            xAxis._set(this.bars.images[i]);
            xAxis.onclick = () => this._toggleEntity(i);
            this._elements.xAxis.push(xAxis);
            this._xAxis.appendChild(xAxis);
        }

        this._updateLabels(true);

        for (let i = 0; i < 21; i++) {
            const label = document.createElement('mcs-plotter-y-axis-label');

            label._set({ text: Util.mcsFormatNum(i * 0.05, 4), bottom: i * 5 - 2.5 });

            this._elements.yAxis.push(label);
            this._yAxis.appendChild(label);
        }

        const dataSet = Global.simulation.getDataSet();

        this._onLoad(dataSet.length);
        this._update(dataSet, Global.simulation.getRawData());
        this._updateCrosses();
    }

    private _onLoad(bars: number) {
        const numBars = this._elements.bars.length;

        for (let i = 0; i < bars; i++) {
            const barIndex = numBars - i - 1;

            TooltipController.init(
                this._elements.bars[barIndex],
                <HTMLElement>this._elements.bars[barIndex].firstElementChild
            );
        }
    }

    private _init() {
        const barMonsterIds: string[] = [];
        const barDungeonIds: { [index: string]: number } = {};
        const barTaskIds: { [index: string]: number } = {};
        const barStrongholdIds: { [index: string]: number } = {};
        const barDepthIds: { [index: string]: number } = {};
        const types: BarType[] = [];

        for (const monsterId of Global.stores.game.state.monsterIds) {
            barMonsterIds.push(monsterId);
            types.push(BarType.Monster);
        }

        for (const dungeonId of Global.stores.game.state.dungeonIds) {
            barDungeonIds[dungeonId] = barMonsterIds.length;
            barMonsterIds.push(dungeonId);
            types.push(BarType.Dungeon);
        }

        for (const strongholdId of Global.stores.game.state.strongholdIds) {
            barStrongholdIds[strongholdId] = barMonsterIds.length;
            barMonsterIds.push(strongholdId);
            types.push(BarType.Stronghold);
        }

        for (const depthId of Global.stores.game.state.depthIds) {
            barDepthIds[depthId] = barMonsterIds.length;
            barMonsterIds.push(depthId);
            types.push(BarType.Depth);
        }

        for (const task of Global.stores.game.state.taskIds) {
            barTaskIds[task] = barMonsterIds.length;
            barMonsterIds.push(task);
            types.push(BarType.Task);
        }

        for (const area of Lookup.combatAreas.combatAreas) {
            this.bars.totalBars += area.monsters.length;
            this.bars.bottomNames.push(area.name);
            this.bars.bottomLength.push(area.monsters.length);

            for (const monster of area.monsters) {
                this.bars.names.push(monster.name);
                this.bars.images.push(monster.media);
            }
        }

        this.bars.totalBars += 1;
        this.bars.bottomNames.push('');
        this.bars.bottomLength.push(1);

        const bard = Lookup.monsters.getObjectByID(Global.stores.game.state.bardId);

        this.bars.names.push(Format.getMonsterName(bard.id));
        this.bars.images.push(bard.media);

        for (const area of Lookup.combatAreas.slayer) {
            this.bars.totalBars += area.monsters.length;
            this.bars.bottomNames.push(area.name);
            this.bars.bottomLength.push(area.monsters.length);

            for (const monster of area.monsters) {
                this.bars.names.push(monster.name);
                this.bars.images.push(monster.media);
            }
        }

        this.bars.totalBars += Lookup.combatAreas.dungeons.length;
        this.bars.bottomNames.push('Dungeons');
        this.bars.bottomLength.push(Lookup.combatAreas.dungeons.length);

        for (const dungeon of Lookup.combatAreas.dungeons) {
            this.bars.names.push(Format.replaceApostrophe(dungeon.name));
            this.bars.images.push(dungeon.media);
        }

        this.bars.totalBars += Lookup.combatAreas.strongholds.length;
        this.bars.bottomNames.push('Strongholds');
        this.bars.bottomLength.push(Lookup.combatAreas.strongholds.length);

        for (const stronghold of Lookup.combatAreas.strongholds) {
            this.bars.names.push(Format.replaceApostrophe(stronghold.name));
            this.bars.images.push(stronghold.media);
        }

        this.bars.totalBars += Lookup.combatAreas.depths.length;
        this.bars.bottomNames.push('The Abyss');
        this.bars.bottomLength.push(Lookup.combatAreas.depths.length);

        for (const depth of Lookup.combatAreas.depths) {
            this.bars.names.push(Format.replaceApostrophe(depth.name));
            this.bars.images.push(depth.media);
        }

        this.bars.totalBars += Lookup.tasks.allObjects.length;
        this.bars.bottomNames.push('Auto Slayer');
        this.bars.bottomLength.push(Lookup.tasks.allObjects.length);

        for (const task of Lookup.tasks.allObjects) {
            this.bars.names.push(`${task.localID} Slayer Tasks`);
            this.bars.images.push(Global.game.slayer.media);
        }

        Global.stores.plotter.set({
            bars: {
                total: this.bars.totalBars,
                types,
                monsterIds: barMonsterIds,
                dungeonIds: barDungeonIds,
                strongholdIds: barStrongholdIds,
                depthIds: barDepthIds,
                taskIds: barTaskIds
            }
        });
    }

    private _update(data: number[], raw: SimulationData[]) {
        let barMax = 0;

        for (let i = 0; i < this._elements.bars.length; i++) {
            if (isNaN(data[i]) || !isFinite(data[i])) {
                continue;
            }

            if (i < data.length && data[i] > barMax) {
                barMax = data[i];
            }
        }

        const maxBars = [];

        if (!Global.stores.plotter.state.isInspecting) {
            for (let i = 0; i < data.length; i++) {
                if (Math.abs(data[i] - barMax) < 0.0000001) {
                    maxBars.push(i);
                }
            }
        }

        let Ndivs = 10;
        let divMax = 1;
        let divPower = 0;
        let closestRatio = 0.1;
        let divDecimals = 1;

        if (barMax !== 0) {
            const divRatio = barMax / Math.pow(10, Math.floor(Math.log10(barMax)) + 1);

            if (divRatio >= 0.5) {
                closestRatio = 0.5;
            } else if (divRatio >= 0.25) {
                closestRatio = 0.25;
                divDecimals = 2;
            } else if (divRatio >= 0.2) {
                closestRatio = 0.2;
            } else if (divRatio >= 0.1) {
                closestRatio = 0.1;
            }

            divPower = Math.floor(Math.log10(barMax));

            const division = closestRatio * Math.pow(10, divPower);

            Ndivs = Math.ceil(barMax / division);
            divMax = Ndivs * division;
        }

        // Modify in reverse
        const numBars = this._elements.bars.length;
        const numData = data.length;

        const isViewingTask =
            Global.stores.plotter.state.isInspecting && Lookup.isSlayerTask(Global.stores.plotter.state.inspectedId);
        let monsterIndices: number[] = [];

        if (isViewingTask) {
            const monsters = Lookup.getMonsterList(Global.stores.plotter.state.inspectedId);
            monsterIndices = monsters.map(monster =>
                Global.stores.plotter.state.bars.monsterIds.findIndex(monsterId => monsterId === monster.id)
            );
        }

        for (let i = 0; i < numData; i++) {
            const dataIndex = numData - i - 1;
            const barIndex = isViewingTask ? monsterIndices[numData - i - 1] : numBars - i - 1;
            let tooltipText;

            if (isNaN(data[dataIndex]) || !isFinite(data[dataIndex])) {
                this._elements.bars[barIndex]._set({ height: 0 });
                tooltipText = 'N/A';
            } else {
                this._elements.bars[barIndex]._set({ height: (data[dataIndex] / divMax) * 100 });
                tooltipText = Util.mcsFormatNum(data[dataIndex], 4);
            }

            let barName = this.getDetails(barIndex).name;

            // open tooltip and set tooltip title
            let tooltip = `<div class="text-center">${barName}`;
            // set value if available
            if (tooltipText !== 'N/A') {
                tooltip += `<br><span class="text-info">${tooltipText}</span>`;
            }

            // set failure text, if any
            const failureText = Global.simulation.getSimFailureText(raw[dataIndex]);

            if (failureText) {
                tooltip += `<br><span style="color:red;">${failureText}</span>`;
            }
            // close tooltip
            tooltip += '</div>';

            const tooltipContent = this._elements.bars[barIndex].querySelector('[data-mcsTooltipContent]');
            // set tooltip content
            tooltipContent.innerHTML = tooltip;

            // color the bar based on death rate
            const base = maxBars.includes(barIndex) ? [215, 180, 0] : [70, 130, 180];
            const gradient = this.colourGradient(raw[dataIndex].deathRate, base).join(',');
            this._elements.bars[barIndex]._set({ color: `rgb(${gradient})` });
        }

        for (let i = 0; i < 20; i++) {
            if (i < Ndivs - 1) {
                this._elements.gridLines[i]._toggle(true);
                this._elements.gridLines[i]._set({ bottom: ((i + 1) * 100) / Ndivs });
            } else {
                this._elements.gridLines[i]._toggle(false);
            }
        }

        let formatEnd = '';
        // Use toFixed for tick marks
        if (divPower > 2) {
            formatEnd = ['k', 'M', 'B', 'T'][Math.floor(divPower / 3) - 1];
        }
        if (divPower >= 0) {
            const powerLeft = divPower % 3;
            closestRatio *= Math.pow(10, powerLeft);
        } else {
            closestRatio *= Math.pow(10, divPower);
            divDecimals -= divPower;
        }

        for (let i = 0; i < 21; i++) {
            if (i < Ndivs + 1) {
                this._elements.yAxis[i]._toggle(true);
                this._elements.yAxis[i]._set({
                    text: `${(i * closestRatio).toLocaleString(undefined, {
                        maximumFractionDigits: divDecimals,
                        minimumFractionDigits: divDecimals
                    })}${formatEnd}`,
                    bottom: (i * 100) / Ndivs - 2.5
                });
            } else {
                this._elements.yAxis[i]._toggle(false);
            }
        }
    }

    private colourGradient(x: any, base = [70, 130, 180], death = [220, 20, 60]) {
        return base.map((_, i) => (1 - x) * base[i] + x * death[i]);
    }

    private getDetails(barIndex: number) {
        let bar = { name: '', isFiltered: false };

        if (Global.stores.plotter.state.isInspecting) {
            if (Lookup.isSlayerTask(Global.stores.plotter.state.inspectedId)) {
                const target = Lookup.monsters.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: target.name, isFiltered: false };
            } else {
                const selection = Lookup.getMonsterList(Global.stores.plotter.state.inspectedId);
                const monster = selection[barIndex + selection.length - this._elements.bars.length];
                bar = { name: monster.name, isFiltered: false };
            }
        } else {
            if (Global.stores.plotter.barIsDungeon(barIndex)) {
                const target = Lookup.dungeons.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: target.name, isFiltered: this.isFiltered(barIndex) };
            } else if (Global.stores.plotter.barIsTask(barIndex)) {
                const target = Lookup.tasks.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: `${target.name} Tasks`, isFiltered: this.isFiltered(barIndex) };
            } else if (Global.stores.plotter.barIsStronghold(barIndex)) {
                const target = Lookup.strongholds.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: target.name, isFiltered: this.isFiltered(barIndex) };
            } else if (Global.stores.plotter.barIsDepth(barIndex)) {
                const target = Lookup.depths.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: target.name, isFiltered: this.isFiltered(barIndex) };
            } else {
                const target = Lookup.monsters.getObjectByID(Global.stores.plotter.state.bars.monsterIds[barIndex]);
                bar = { name: target.name, isFiltered: this.isFiltered(barIndex) };
            }
        }

        return bar;
    }

    private isFiltered(index: number) {
        if (Global.stores.plotter.barIsDungeon(index)) {
            const dungeonId = Global.stores.plotter.state.bars.monsterIds[index];
            return !Global.simulation.dungeonSimFilter[dungeonId];
        } else if (Global.stores.plotter.barIsStronghold(index)) {
            const strongholdId = Global.stores.plotter.state.bars.monsterIds[index];
            return !Global.simulation.strongholdSimFilter[strongholdId];
        } else if (Global.stores.plotter.barIsDepth(index)) {
            const depthId = Global.stores.plotter.state.bars.monsterIds[index];
            return !Global.simulation.depthSimFilter[depthId];
        } else if (Global.stores.plotter.barIsTask(index)) {
            const taskId = Global.stores.plotter.state.bars.monsterIds[index];
            return !Global.simulation.slayerSimFilter[taskId];
        } else {
            const monsterId = Global.stores.plotter.state.bars.monsterIds[index];
            return !Global.simulation.monsterSimFilter[monsterId];
        }
    }
}

customElements.define('mcs-plotter', Plotter);

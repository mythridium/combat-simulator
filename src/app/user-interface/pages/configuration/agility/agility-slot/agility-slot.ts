import './agility-slot.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { DialogController } from 'src/app/user-interface/_parts/dialog/dialog-controller';
import { Global } from 'src/app/global';
import { Dialog } from 'src/app/user-interface/_parts/dialog/dialog';
import { ImageLoader } from 'src/app/utils/image-loader';
import { TooltipController } from 'src/app/user-interface/_parts/tooltip/tooltip-controller';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ModifierHelper } from 'src/shared/utils/modifiers';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-agility-slot': AgilitySlot;
    }
}

interface AgilityObstacleResult {
    combat: (AgilityObstacle | AgilityPillar)[];
    nonCombat: (AgilityObstacle | AgilityPillar)[];
}

type Callback = (obstacle: AgilityObstacle | AgilityPillar | undefined) => void;

@LoadTemplate('app/user-interface/pages/configuration/agility/agility-slot/agility-slot.html')
export class AgilitySlot extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _container: HTMLDivElement;
    private readonly _image: HTMLImageElement;
    private readonly _tooltip: HTMLDivElement;
    private readonly _dialog: Dialog;
    private readonly _title: HTMLDivElement;

    private readonly _agilityContainer: HTMLDivElement;

    private readonly _unequip: HTMLButtonElement;
    private readonly _cancel: HTMLButtonElement;

    private readonly _items = new Map<string, HTMLDivElement>();
    private readonly _callbacks = new Set<Callback>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-agility-slot-template'));

        this._container = getElementFromFragment(this._content, 'mcs-agility-slot-container', 'div');
        this._image = getElementFromFragment(this._content, 'mcs-agility-slot-image', 'img');
        this._tooltip = getElementFromFragment(this._content, 'mcs-agility-slot-tooltip', 'div');
        this._dialog = getElementFromFragment(this._content, 'mcs-agility-slot-dialog', 'mcs-dialog');
        this._title = getElementFromFragment(this._content, 'mcs-agility-slot-dialog-title', 'div');

        this._agilityContainer = getElementFromFragment(this._content, 'mcs-agility-slot-container', 'div');

        this._unequip = getElementFromFragment(this._content, 'mcs-agility-slot-unequip', 'button');
        this._cancel = getElementFromFragment(this._content, 'mcs-agility-slot-cancel', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._update();

        this._container.classList.toggle('mcs-small', this.dataset.mcssmall !== undefined ? true : false);

        if (this.getAttribute('readonly') === null) {
            this._container.onclick = () => {
                this._title.textContent = this._getTitle();
                this._unequip.disabled = this.isEmpty;

                this._createItems();

                TooltipController.hide();
                DialogController.open(this._dialog);
            };
        }

        this._cancel.onclick = () => this._clear();

        this._unequip.onclick = () => {
            this._clear();
            this._setObstacle(undefined);
            this._update();
            StatsController.update();
        };
    }

    public disconnectedCallback() {
        this._callbacks.clear();
    }

    public _update() {
        this._tooltip.innerHTML = this.isEmpty ? 'Empty' : this._getTooltip(this._obstacle);
        this._image.src = this.isEmpty ? 'assets/media/main/stamina.svg' : this._obstacle.media;
    }

    public _on(callback: Callback) {
        if (this._callbacks.has(callback)) {
            return;
        }

        this._callbacks.add(callback);
    }

    public _off(callback: Callback) {
        this._callbacks.delete(callback);
    }

    private _clear() {
        DialogController.close();
        this._agilityContainer.innerHTML = '';
        this._items.clear();
    }

    private get isEmpty() {
        return this._obstacle === undefined;
    }

    private get _obstacle() {
        const category = this._category;

        if (this.dataset.mcstype === 'pillar') {
            return this._course.builtPillars.get(category);
        }

        return this._course.builtObstacles.get(category);
    }

    private _setObstacle(obstacle: AgilityObstacle | AgilityPillar | undefined) {
        const category = this._category;

        if (this.dataset.mcstype === 'pillar') {
            if (!obstacle) {
                this._course.builtPillars.delete(category);
            } else {
                this._course.builtPillars.set(category, obstacle);
            }
        } else {
            if (!obstacle) {
                this._course.builtObstacles.delete(category);
            } else {
                this._course.builtObstacles.set(category, obstacle);
            }
        }

        for (const callback of this._callbacks) {
            try {
                callback(obstacle);
            } catch (exception) {
                Global.logger.error(`Agility Slot callback threw an error`, exception);
            }
        }
    }

    private _createItems() {
        const obstacles = this._obstacles;

        if (this.dataset.mcstype === 'pillar') {
            this._agilityContainer.appendChild(
                createElement('div', { classList: ['mcs-agility-slot-section-title'], text: 'Pillars' })
            );

            const pillarElement = createElement('div', { classList: ['mcs-agility-slot-section'] });

            for (const obstacle of [...obstacles.combat, ...obstacles.nonCombat]) {
                const element = this._createObstacle(obstacle);
                pillarElement.appendChild(element);
            }

            this._agilityContainer.appendChild(pillarElement);
        } else {
            if (obstacles.combat.length) {
                this._agilityContainer.appendChild(
                    createElement('div', { classList: ['mcs-agility-slot-section-title'], text: 'Combat Obstacles' })
                );

                const combatSectionElement = createElement('div', { classList: ['mcs-agility-slot-section'] });

                for (const obstacle of obstacles.combat) {
                    const element = this._createObstacle(obstacle);
                    combatSectionElement.appendChild(element);
                }

                this._agilityContainer.appendChild(combatSectionElement);
            }

            if (obstacles.nonCombat.length) {
                this._agilityContainer.appendChild(
                    createElement('div', {
                        classList: ['mcs-agility-slot-section-title'],
                        text: 'Non Combat Obstacles'
                    })
                );

                const nonCombatSectionElement = createElement('div', { classList: ['mcs-agility-slot-section'] });

                for (const obstacle of obstacles.nonCombat) {
                    const element = this._createObstacle(obstacle);
                    nonCombatSectionElement.appendChild(element);
                }

                this._agilityContainer.appendChild(nonCombatSectionElement);
            }
        }
    }

    private _createObstacle(obstacle: AgilityObstacle | AgilityPillar) {
        const itemContainer = createElement('div', {
            classList: ['mcs-agility-slot-item'],
            attributes: [['data-mcsTooltip', '']]
        });

        itemContainer.onclick = () => {
            this._setObstacle(obstacle);

            this._clear();
            this._update();

            TooltipController.hide();
            StatsController.update();
        };

        const itemImage = createElement('img');

        const itemTooltip = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
        itemTooltip.innerHTML = this._getTooltip(obstacle);

        this._items.set(obstacle.id, itemContainer);

        ImageLoader.register(itemImage, obstacle.media);
        TooltipController.init(itemContainer);

        itemContainer.appendChild(itemImage);
        itemContainer.appendChild(itemTooltip);

        return itemContainer;
    }

    private _getTooltip(obstacle: AgilityObstacle | AgilityPillar) {
        let negativeMultiplier = 1;
        // @ts-ignore // TODO: TYPES
        const query = Global.game.agility.getActionModifierQuery(obstacle);
        // @ts-ignore // TODO: TYPES
        let modifier = Global.game.modifiers.getValue('melvorD:halveAgilityObstacleNegatives', query);
        negativeMultiplier = modifier > 0 ? 0.5 : 1;

        // @ts-ignore // TODO: TYPES
        if (Global.game.agility.hasMasterRelic(Global.game.defaultRealm)) {
            negativeMultiplier = 0;
        }

        // @ts-ignore // TODO: TYPES
        const mods = StatObject.formatDescriptions(
            // @ts-ignore // TODO: TYPES
            obstacle,
            // @ts-ignore // TODO: TYPES
            getElementDescriptionFormatter('div', 'mb-1'),
            negativeMultiplier,
            1,
            false
        );

        let text = `<div><div class="text-warning mb-1">${obstacle.name}</div><small class="d-block mt-1">`;

        for (const [_, mod] of mods.entries()) {
            text += mod.outerHTML;
        }

        return text + '</small></div>';
    }

    private get _course() {
        // @ts-ignore // TODO: TYPES
        return Global.game.agility.courses.get(this._realm);
    }

    private get _obstacles() {
        const category = this._category;

        let obstacles: AgilityObstacle[] | AgilityPillar[] = [];

        if (this.dataset.mcstype === 'pillar') {
            obstacles = Global.game.agility.pillars.filter(
                // @ts-ignore // TODO: TYPES
                pillar => pillar.realm.id === this._realm.id && pillar.category === category
            );
        } else {
            obstacles = Global.game.agility.actions.filter(
                // @ts-ignore // TODO: TYPES
                obstacle => obstacle.realm.id === this._realm.id && obstacle.category === category
            );
        }

        const result: AgilityObstacleResult = { combat: [], nonCombat: [] };

        for (const obstacle of obstacles) {
            if (
                // @ts-ignore // TODO: TYPES
                obstacle.modifiers.some(entry => ModifierHelper.isCombatModifier(entry)) ||
                // @ts-ignore // TODO: TYPES
                obstacle.enemyModifiers !== undefined
            ) {
                result.combat.push(obstacle);
            } else {
                result.nonCombat.push(obstacle);
            }
        }

        return result;
    }

    private _getTitle() {
        const category = this._category;

        if (this.dataset.mcstype === 'pillar') {
            return `Agility Pillar #${category + 1}`;
        }

        if (this.dataset.mcstype === 'obstacle') {
            return `Agility Course #${category + 1}`;
        }

        return `Unknown Agility Course`;
    }

    private get _category(): number {
        return parseInt(this.dataset.mcscategory);
    }

    private get _realm() {
        // @ts-ignore // TODO: TYPES
        return Global.game.realms.getObjectByID(this.dataset.mcsrealm);
    }
}

customElements.define('mcs-agility-slot', AgilitySlot);

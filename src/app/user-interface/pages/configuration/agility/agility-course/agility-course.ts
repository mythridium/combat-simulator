import './agility-course.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Dropdown, DropdownOption } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { Drops } from 'src/app/drops';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { AgilitySlot } from 'src/app/user-interface/pages/configuration/agility/agility-slot/agility-slot';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-agility-course': AgilityCourse;
    }
}

enum SlotType {
    Obstacle = 'obstacle',
    Pillar = 'pillar'
}

interface AgilityElements {
    slot: AgilitySlot;
    name: HTMLDivElement;
    mastery: ButtonImage | HTMLDivElement;
    type: SlotType;
    category: number;
}

@LoadTemplate('app/user-interface/pages/configuration/agility/agility-course/agility-course.html')
export class AgilityCourse extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _blueprint: Dropdown;
    private readonly _slots: HTMLDivElement;

    private readonly _elements = new Map<string, AgilityElements>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-agility-course-template'));

        this._blueprint = getElementFromFragment(this._content, 'mcs-agility-course-blueprints', 'mcs-dropdown');
        this._slots = getElementFromFragment(this._content, 'mcs-agility-course-slots', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._initBlueprints();
        this._init();
    }

    public _import(obstacles: [string, number, boolean][], pillars: [string, number][]) {
        const masteryToRemove = Array.from(Global.game.agility.actionMastery.keys()).filter(
            obstacle => obstacle.realm.id === this._realm.id
        );

        for (const obstacle of masteryToRemove) {
            Global.game.agility.actionMastery.delete(obstacle);
        }

        const course = this._course;

        course.builtObstacles.clear();
        course.builtPillars.clear();

        for (const [obstacleId, category, isMastered] of obstacles) {
            const obstacle = Global.game.agility.actions.getObjectByID(obstacleId);

            if (!obstacle) {
                continue;
            }

            course.builtObstacles.set(category, obstacle);

            const obstacles = this._obstacles(category);

            for (const obstacle of obstacles) {
                Global.game.agility.actionMastery.set(
                    obstacle,
                    isMastered ? { level: 99, xp: 13100000 } : { level: 1, xp: 1 }
                );
            }
        }

        for (const [pillarId, category] of pillars) {
            const pillar = Global.game.agility.pillars.getObjectByID(pillarId);

            if (!pillar) {
                continue;
            }

            course.builtPillars.set(category, pillar);
        }

        for (const [_, elements] of this._elements) {
            this._updateSlot(elements);
        }

        StatsController.update();
    }

    public _update() {
        for (const [_, elements] of this._elements) {
            this._updateSlot(elements);
        }
    }

    private _updateSlot(elements: AgilityElements) {
        const course = this._course;

        let obstacle: AgilityPillar | AgilityObstacle;

        if (elements.type === SlotType.Obstacle) {
            obstacle = course.builtObstacles.get(elements.category);
        }

        if (elements.type === SlotType.Pillar) {
            obstacle = course.builtPillars.get(elements.category);
        }

        if (!obstacle) {
            if (elements.mastery instanceof ButtonImage) {
                elements.mastery._toggle(false);
            }

            elements.name.innerHTML = this._noneText(elements.type, elements.category);
            elements.slot._update();
            return;
        }

        if (elements.mastery instanceof ButtonImage) {
            elements.mastery._toggle((Global.game.agility.actionMastery.get(obstacle)?.level ?? 0) >= 99);
        }

        elements.name.innerHTML = obstacle.name;
        elements.slot._update();
    }

    private _init() {
        for (const [category, _] of this._course.obstacleSlots.entries()) {
            const { slot, name, mastery } = this._createObstacle(category);

            this._elements.set(`${SlotType.Obstacle}-${category}`, {
                mastery,
                slot,
                name,
                type: SlotType.Obstacle,
                category
            });

            const container = createElement('div', { classList: ['mcs-agility-obstacle'] });

            container.appendChild(mastery);
            container.appendChild(slot);
            container.appendChild(name);

            this._slots.appendChild(container);
        }

        for (const [category, _] of this._course.pillarSlots.entries()) {
            const { slot, name, mastery } = this._createPillar(category);

            this._elements.set(`${SlotType.Pillar}-${category}`, {
                mastery,
                slot,
                name,
                type: SlotType.Pillar,
                category
            });

            const container = createElement('div', { classList: ['mcs-agility-obstacle'] });

            container.append(mastery);
            container.appendChild(slot);
            container.appendChild(name);

            this._slots.appendChild(container);
        }
    }

    private _createObstacle(category: number) {
        const slot = createElement('mcs-agility-slot', {
            attributes: [
                ['data-mcsCategory', category.toString()],
                ['data-mcsType', SlotType.Obstacle],
                ['data-mcsRealm', this._realm.id]
            ]
        });

        let mastery: ButtonImage | HTMLDivElement;

        mastery = createElement('mcs-button-image', {
            attributes: [['data-mcsSrc', 'assets/media/main/mastery_header.svg']]
        });

        if (this.getAttribute('readonly') !== null) {
            slot.setAttribute('readonly', '');
            slot.dataset.mcssmall = '';
            mastery.dataset.mcsreadonly = '';
            mastery.dataset.mcssmall = '';
        }

        mastery.appendChild(createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: '99 Mastery' }));

        mastery._on(isSelected => {
            const obstacles = this._obstacles(category);

            for (const obstacle of obstacles) {
                Global.game.agility.actionMastery.set(
                    obstacle,
                    isSelected ? { level: 99, xp: 13100000 } : { level: 1, xp: 1 }
                );
            }

            StatsController.update();
            slot._update();
        });

        const name = createElement('div', {
            classList: ['mcs-agility-course-name'],
            text: this._noneText('obstacle', category)
        });

        slot._on(obstacle => {
            name.innerHTML = obstacle?.name ?? this._noneText('obstacle', category);
        });

        return { slot, name, mastery };
    }

    private _createPillar(category: number) {
        const slot = createElement('mcs-agility-slot', {
            attributes: [
                ['data-mcsCategory', category.toString()],
                ['data-mcsType', SlotType.Pillar],
                ['data-mcsRealm', this._realm.id]
            ]
        });

        const mastery = createElement('div', { classList: ['mcs-pillar-mastery-fill'] });

        if (this.getAttribute('readonly') !== null) {
            slot.setAttribute('readonly', '');
            slot.dataset.mcssmall = '';
            mastery.classList.add('mcs-small');
        }

        const name = createElement('div', {
            classList: ['mcs-agility-course-name'],
            text: this._noneText('pillar', category)
        });

        slot._on(obstacle => {
            name.innerHTML = obstacle?.name ?? this._noneText('pillar', category);
        });

        return { slot, name, mastery };
    }

    private _noneText(type: string, category: number) {
        if (type === 'pillar') {
            return `None (Pillar ${category + 1})`;
        }

        return `None (${category + 1})`;
    }

    private _initBlueprints() {
        const options = this._blueprints.size
            ? [
                  { text: 'None', value: Drops.noneItem },
                  ...Array.from(this._blueprints.entries()).map(([index, blueprint]) => ({
                      text: blueprint.name,
                      value: index.toString()
                  }))
              ]
            : [{ text: 'None', value: Drops.noneItem }];

        this._blueprint._init({
            search: false,
            label: 'Blueprints',
            default: options[0].value,
            options: options,
            onChange: option => this._onBlueprintChange(option)
        });
    }

    private _onBlueprintChange(option: DropdownOption) {
        if (option.value === Drops.noneItem) {
            this._import([], []);
            StatsController.update();
            return;
        }

        const blueprint = this._blueprints.get(parseInt(option.value));

        const course: [string, number, boolean][] = Array.from(blueprint.obstacles.values()).map((obstacle, index) => {
            const mastery = Global.melvor.agility.actionMastery.get(obstacle);
            return [obstacle.id, index, (mastery?.level ?? 0) >= 99];
        });

        const pillars: [string, number][] = Array.from(blueprint.pillars.values()).map(pillar => [
            pillar.id,
            pillar.category
        ]);

        this._import(course, pillars);
        StatsController.update();
    }

    private _obstacles(category: number) {
        const realm = this._realm;

        return Global.game.agility.actions.filter(
            obstacle => obstacle.category === category && obstacle.realm.id === realm.id
        );
    }

    private get _course() {
        return Global.game.agility.courses.get(this._realm);
    }

    private get _realm() {
        return Global.game.realms.getObjectByID(this.dataset.mcsrealmid);
    }

    private get _blueprints() {
        const melvorRealm = Global.melvor.realms.getObjectByID(this._realm.id);

        if (!melvorRealm) {
            return new Map<number, AgilityBlueprintData>();
        }

        return Global.melvor.agility.courses.get(melvorRealm)?.blueprints ?? new Map<number, AgilityBlueprintData>();
    }
}

customElements.define('mcs-agility-course', AgilityCourse);

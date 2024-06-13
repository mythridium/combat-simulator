import './skill-trees.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { SkillTreeInterface } from './skill-tree/skill-tree';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-skill-trees': SkillTreesPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/skill-trees/skill-trees.html')
export class SkillTreesPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toggleButton: HTMLButtonElement;
    private readonly _tabs: Tabs;
    private readonly _skills = new Map<string, SkillTreeInterface>();

    private readonly combatSkillTrees = [
        'melvorD:Attack',
        'melvorD:Strength',
        'melvorD:Defence',
        'melvorD:Hitpoints',
        'melvorD:Ranged',
        'melvorD:Magic',
        'melvorD:Prayer',
        'melvorD:Slayer',
        'melvorItA:Corruption',
        'melvorD:Summoning',
        'melvorD:Cooking',
        'melvorD:Herblore',
        'melvorD:Crafting',
        'melvorD:Township'
    ];

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-skill-trees-template'));

        this._toggleButton = getElementFromFragment(this._content, 'mcs-skill-trees-toggle', 'button');
        this._tabs = getElementFromFragment(this._content, 'mcs-skill-trees-tabs', 'mcs-tabs');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._init();
    }

    public _import(skillTreeIds: Map<string, Map<string, string[]>>) {
        for (const skill of Global.game.skills.allObjects) {
            if (!this.combatSkillTrees.includes(skill.id)) {
                continue;
            }

            // @ts-ignore // TODO: TYPES
            for (const tree of skill.skillTrees.allObjects) {
                tree.unlockedNodes = [];

                for (const node of tree.nodes.allObjects) {
                    node.isUnlocked = false;
                }

                const element = this._skills.get(`${skill.id}-${tree.id}`);

                if (element) {
                    element._import(skillTreeIds.get(skill.id)?.get(tree.id) ?? []);
                }
            }
        }
    }

    public _updateTooltips() {
        for (const [_id, skillTree] of this._skills) {
            skillTree._updateTooltips();
        }
    }

    private _toggle() {
        if (this._hasSkillTreeNodes()) {
            this._import(new Map());
        } else {
            const skillTrees = new Map<string, Map<string, string[]>>();

            for (const skill of Global.game.skills.allObjects) {
                const trees = new Map<string, string[]>();

                // @ts-ignore // TODO: TYPES
                for (const tree of skill.skillTrees.allObjects) {
                    trees.set(
                        tree.id,
                        // @ts-ignore // TODO: TYPES
                        tree.nodes.allObjects.map(node => node.id)
                    );
                }

                skillTrees.set(skill.id, trees);
            }

            this._import(skillTrees);
        }

        StatsController.update();
    }

    private _hasSkillTreeNodes() {
        return (
            Global.game.skills
                .filter(skill => this.combatSkillTrees.includes(skill.id))
                // @ts-ignore // TODO: TYPES
                .some(skill =>
                    // @ts-ignore // TODO: TYPES
                    skill.skillTrees.allObjects.some(tree => tree.nodes.allObjects.some(node => node.isUnlocked))
                )
        );
    }

    private _init() {
        this._toggleButton.onclick = () => this._toggle();

        for (const skill of Global.game.skills.allObjects) {
            if (!this.combatSkillTrees.includes(skill.id)) {
                continue;
            }

            const header = this._createHeader(skill);
            const content = createElement('div', { attributes: [['slot', 'tab-content']] });

            // @ts-ignore // TODO: TYPES
            if (skill.skillTrees.allObjects.length > 1) {
                const skillTabs = createElement('mcs-tabs');

                // @ts-ignore // TODO: TYPES
                for (const tree of skill.skillTrees.allObjects) {
                    const header = this._createHeader(tree);
                    const content = createElement('div', { attributes: [['slot', 'tab-content']] });

                    const skillTree = createElement('mcs-skill-tree');

                    this._skills.set(`${skill.id}-${tree.id}`, skillTree);
                    skillTree._set(tree);

                    content.append(skillTree);
                    skillTabs.append(header, content);
                }

                content.append(skillTabs);
                skillTabs._init();
            } else {
                // @ts-ignore // TODO: TYPES
                for (const tree of skill.skillTrees.allObjects) {
                    const skillTree = createElement('mcs-skill-tree');

                    this._skills.set(`${skill.id}-${tree.id}`, skillTree);
                    skillTree._set(tree);

                    content.append(skillTree);
                }
            }

            this._tabs.append(header, content);
        }

        this._tabs._init();
    }

    // @ts-ignore // TODO: TYPES
    private _createHeader(entity: AnySkill | SkillTree) {
        const header = createElement('div', {
            attributes: [
                ['slot', 'tab-header'],
                ['data-mcsTooltip', '']
            ]
        });

        header.appendChild(createElement('img', { attributes: [['src', entity.media]] }));
        header.appendChild(createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: entity.name }));

        return header;
    }
}

customElements.define('mcs-skill-trees', SkillTreesPage);

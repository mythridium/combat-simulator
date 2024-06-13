import './spells.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { Global } from 'src/app/global';
import { Notify } from 'src/app/utils/notify';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { SpellSettings } from 'src/app/settings-controller';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-spells': SpellsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/spells/spells.html')
export class SpellsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _tabs: Tabs;
    private readonly _combinationRunes: Switch;

    private readonly _cursesContainer: HTMLDivElement;
    private readonly _aurorasContainer: HTMLDivElement;

    private readonly _attack = new Map<string, ButtonImage>();
    private readonly _curses = new Map<string, ButtonImage>();
    private readonly _auroras = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-spells-template'));

        this._tabs = getElementFromFragment(this._content, 'mcs-spells-tabs', 'mcs-tabs');
        this._combinationRunes = getElementFromFragment(this._content, 'mcs-spells-combination-runes', 'mcs-switch');

        this._cursesContainer = getElementFromFragment(this._content, 'mcs-curses-container', 'div');
        this._aurorasContainer = getElementFromFragment(this._content, 'mcs-auroras-container', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);
        this._init();
    }

    public _import(settings: SpellSettings, useCombinationRunes: boolean) {
        // @ts-ignore // TODO: TYPES
        Global.game.combat.player.spellSelection.attack = this._getSpell(settings.attack) as AttackSpell;
        Global.game.combat.player.spellSelection.curse = this._getSpell(settings.curse) as CurseSpell;
        Global.game.combat.player.spellSelection.aurora = this._getSpell(settings.aurora) as AuroraSpell;

        Global.game.combat.player.useCombinationRunes = useCombinationRunes;
        this._combinationRunes._toggle(useCombinationRunes);

        this._update();
    }

    public _update() {
        // @ts-ignore // TODO: TYPES
        this._validate(Global.game.combat.player.spellSelection.attack);
        this._validate(Global.game.combat.player.spellSelection.curse);
        this._validate(Global.game.combat.player.spellSelection.aurora);

        // @ts-ignore // TODO: TYPES
        this._updateSpells(this._attack, Global.game.attackSpells);
        this._updateSpells(this._curses, Global.game.curseSpells);
        this._updateSpells(this._auroras, Global.game.auroraSpells);

        StatsController.update();
    }

    private _validate(spell: CombatSpell | undefined) {
        if (!spell) {
            return;
        }

        if (!this._canEquip(spell)) {
            // @ts-ignore // TODO: TYPES
            if (spell instanceof AttackSpell) {
                // @ts-ignore // TODO: TYPES
                Global.game.combat.player.spellSelection.attack = Global.game.attackSpells.firstObject;
            }

            if (spell instanceof CurseSpell) {
                Global.game.combat.player.spellSelection.curse = undefined;
            }

            if (spell instanceof AuroraSpell) {
                Global.game.combat.player.spellSelection.aurora = undefined;
            }
        }
    }

    private _updateSpells(elements: Map<string, ButtonImage>, spells: NamespaceRegistry<CombatSpell>) {
        for (const [spellId, element] of elements) {
            const spell = spells.getObjectByID(spellId);

            if (!spell) {
                element.setAttribute('data-mcsDisabled', '');
                continue;
            }

            element._toggle(
                // @ts-ignore // TODO: TYPES
                Global.game.combat.player.spellSelection.attack === spell ||
                    Global.game.combat.player.spellSelection.curse === spell ||
                    Global.game.combat.player.spellSelection.aurora === spell
            );

            element.toggleAttribute('data-mcsDisabled', !this._isUnlocked(spell));
        }
    }

    private _canEquip(spell: CombatSpell) {
        if (!this._isUnlocked(spell)) {
            return false;
        }

        if (
            // @ts-ignore // TODO: TYPES
            spell instanceof AttackSpell &&
            (spell.requiredItem === undefined ||
                !Global.game.combat.player.equipment.checkForItem(spell.requiredItem)) &&
            // @ts-ignore // TODO: TYPES
            !spell.spellbook.canUseWithDamageType(Global.game.combat.player.damageType)
        ) {
            return false;
        }

        if (spell instanceof CurseSpell) {
            return (
                Global.game.combat.player.canCurse &&
                (spell.requiredItem === undefined ||
                    Global.game.combat.player.equipment.checkForItem(spell.requiredItem))
            );
        }

        if (spell instanceof AuroraSpell) {
            return (
                Global.game.combat.player.canAurora &&
                (spell.requiredItem == undefined ||
                    Global.game.combat.player.equipment.checkForItem(spell.requiredItem))
            );
        }

        return true;
    }

    private _isUnlocked(spell: CombatSpell) {
        const level = Global.game.combat.player.skillLevel.get(Global.game.altMagic.id);

        return (
            level >= spell.level &&
            (spell.requiredItem === undefined || Global.game.combat.player.equipment.checkForItem(spell.requiredItem))
        );
    }

    private _init() {
        this._combinationRunes._on(isSelected => {
            Global.game.combat.player.useCombinationRunes = isSelected;
        });

        // @ts-ignore // TODO: TYPES
        for (const spellBook of Global.game.attackSpellbooks.allObjects.reverse()) {
            const content = createElement('div', {
                attributes: [['slot', 'tab-content']]
            });

            const spellContainer = createElement('div', { classList: ['mcs-spell-container'] });

            this._create(spellBook.spells, spellContainer, this._attack, spell =>
                createElement('mcs-spell-tooltip', {
                    attributes: [
                        ['data-mcsSpellType', 'attack'],
                        ['data-mcsSpellId', spell.id]
                    ]
                })
            );

            const header = createElement('div', {
                attributes: [
                    ['slot', 'tab-header'],
                    ['data-mcsTooltip', '']
                ]
            });

            header.appendChild(createElement('img', { attributes: [['src', spellBook.media]] }));
            header.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: spellBook.name })
            );

            content.appendChild(spellContainer);

            this._tabs.prepend(header, content);
        }

        this._create(Global.game.curseSpells.allObjects, this._cursesContainer, this._curses, spell =>
            createElement('mcs-spell-tooltip', {
                attributes: [
                    ['data-mcsSpellType', 'curse'],
                    ['data-mcsSpellId', spell.id]
                ]
            })
        );

        this._create(Global.game.auroraSpells.allObjects, this._aurorasContainer, this._auroras, spell =>
            createElement('mcs-spell-tooltip', {
                attributes: [
                    ['data-mcsSpellType', 'aurora'],
                    ['data-mcsSpellId', spell.id]
                ]
            })
        );

        this._tabs._init();
    }

    private _create(
        spells: CombatSpell[],
        container: HTMLDivElement,
        store: Map<string, ButtonImage>,
        tooltip: (spell: CombatSpell) => HTMLElement
    ) {
        for (const spell of spells) {
            const spellElement = createElement('mcs-button-image', { attributes: [['data-mcsSrc', spell.media]] });

            if (!this._isUnlocked(spell)) {
                spellElement.setAttribute('data-mcsDisabled', '');
            }

            spellElement._on(() => {
                this._toggle(spell);
                this._update();
            });

            const spellTooltip = tooltip(spell);
            const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });

            tooltipContent.appendChild(spellTooltip);
            spellElement.appendChild(tooltipContent);

            store.set(spell.id, spellElement);

            container.appendChild(spellElement);
        }
    }

    private _toggle(spell: CombatSpell) {
        // @ts-ignore // TODO: TYPES
        if (spell instanceof AttackSpell) {
            // @ts-ignore // TODO: TYPES
            if (spell.spellbook.id === 'melvorF:Ancient') {
                Global.game.combat.player.spellSelection.curse = undefined;
            }

            // @ts-ignore // TODO: TYPES
            if (!spell.spellbook.canUseWithDamageType(Global.game.combat.player.damageType)) {
                Notify.message(
                    // @ts-ignore // TODO: TYPES
                    `This spell cannot be used with ${Global.game.combat.player.damageType.name}`,
                    'danger',
                    Global.game.altMagic.media
                );
            } else {
                // @ts-ignore // TODO: TYPES
                if (Global.game.combat.player.spellSelection.attack === spell) {
                    // @ts-ignore // TODO: TYPES
                    Global.game.combat.player.spellSelection.attack = Global.game.attackSpells.firstObject;
                } else {
                    // @ts-ignore // TODO: TYPES
                    Global.game.combat.player.spellSelection.attack = spell;
                }
            }
        }

        if (spell instanceof CurseSpell) {
            // @ts-ignore // TODO: TYPES
            if (Global.game.combat.player.spellSelection.attack?.spellbook?.id === 'melvorF:Ancient') {
                Global.game.combat.player.spellSelection.curse = undefined;
                Notify.message(getLangString('TOASTS_NO_CURSES_WITH_ANCIENT'), 'danger', Global.game.altMagic.media);
            } else {
                if (Global.game.combat.player.spellSelection.curse === spell) {
                    Global.game.combat.player.spellSelection.curse = undefined;
                } else {
                    Global.game.combat.player.spellSelection.curse = spell;
                }
            }
        }

        if (spell instanceof AuroraSpell) {
            if (Global.game.combat.player.spellSelection.aurora === spell) {
                Global.game.combat.player.spellSelection.aurora = undefined;
            } else {
                Global.game.combat.player.spellSelection.aurora = spell;
            }
        }
    }

    private _getSpell(spellId: string | undefined) {
        if (!spellId) {
            return;
        }

        // @ts-ignore // TODO: TYPES
        const attack = Global.game.attackSpells.getObjectByID(spellId);

        if (attack) {
            return attack;
        }

        const curse = Global.game.curseSpells.getObjectByID(spellId);

        if (curse) {
            return curse;
        }

        const aurora = Global.game.auroraSpells.getObjectByID(spellId);

        if (aurora) {
            return aurora;
        }

        Global.logger.error(`Invalid spell id`, spellId);
    }

    private _getSpellElement(spell: CombatSpell | undefined) {
        if (!spell) {
            return;
        }

        // @ts-ignore // TODO: TYPES
        if (spell instanceof AttackSpell) {
            return this._attack.get(spell.id);
        }

        if (spell instanceof CurseSpell) {
            return this._curses.get(spell.id);
        }

        if (spell instanceof AuroraSpell) {
            return this._auroras.get(spell.id);
        }
    }
}

customElements.define('mcs-spells', SpellsPage);

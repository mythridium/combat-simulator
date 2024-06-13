import './loot.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Dropdown, DropdownOption } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { Global } from 'src/app/global';
import { Drops } from 'src/app/drops';
import { PlotKey } from 'src/app/stores/plotter.store';
import type { Information } from 'src/app/user-interface/information/information';
import type { Plotter } from 'src/app/user-interface/pages/simulate/plotter/plotter';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-loot': LootPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/loot/loot.html')
export class LootPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _onlySelectedTarget: Switch;
    private readonly _onlyUndiscovered: Switch;
    private readonly _items: Dropdown;
    private readonly _shardsToChest: Switch;

    private readonly _loot = new Map<string, DropdownOption>();

    private _information: Information;
    private _plotter: Plotter;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-loot-template'));

        this._onlySelectedTarget = getElementFromFragment(this._content, 'mcs-loot-only-selected-target', 'mcs-switch');
        this._onlyUndiscovered = getElementFromFragment(this._content, 'mcs-loot-only-undiscovered', 'mcs-switch');
        this._items = getElementFromFragment(this._content, 'mcs-loot-items', 'mcs-dropdown');
        this._shardsToChest = getElementFromFragment(this._content, 'mcs-loot-shards-to-chest', 'mcs-switch');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._information = Global.userInterface.main.querySelector('.mcs-main-information');
        this._plotter = Global.userInterface.main.querySelector('mcs-plotter');

        this._onlySelectedTarget._toggle(Global.stores.plotter.state.onlySelectedTarget);
        this._onlyUndiscovered._toggle(Global.stores.plotter.state.onlyUndiscovered);
        this._shardsToChest._toggle(Global.stores.plotter.state.shardsToChests);

        this._onlySelectedTarget._on(isChecked => {
            Global.stores.plotter.set({ onlySelectedTarget: isChecked });
            this._update();
        });

        this._onlyUndiscovered._on(isChecked => {
            Global.stores.plotter.set({ onlyUndiscovered: isChecked });
            this._update();
        });

        this._shardsToChest._on(isChecked => {
            Global.stores.plotter.set({ shardsToChests: isChecked });
            Drops.updateGP();

            if (Global.stores.plotter.plotType.key === PlotKey.GP) {
                this._plotter._updateData();
            }

            this._information._update();
        });

        this._update();
    }

    public _update() {
        const items = this._getItems();
        const hasItem = items.some(item => item.value === Global.stores.plotter.state.selectedDrop);

        this._items._init({
            search: true,
            label: 'Choose Item',
            default: hasItem ? Global.stores.plotter.state.selectedDrop : Drops.noneItem,
            options: items,
            onChange: option => this._onItemChange(option)
        });
    }

    private _onItemChange(option: DropdownOption) {
        Global.stores.plotter.set({ selectedDrop: option.value });

        Drops.updateDropChance();

        if (Global.stores.plotter.plotType.key === PlotKey.Drops) {
            this._plotter._updateData();
        }

        this._information._update();
    }

    private _getItems() {
        this._loot.clear();

        const selectedTarget = Global.stores.plotter.selectedMonsterId ?? Global.stores.plotter.state.inspectedId;

        if (Global.stores.plotter.state.onlySelectedTarget && selectedTarget !== undefined) {
            if (
                Drops.godDungeonIds.includes(Global.stores.plotter.state.inspectedId) &&
                Global.stores.plotter.selectedMonsterId
            ) {
                this._addToLootMap(Lookup.monsters.getObjectByID(Global.stores.plotter.selectedMonsterId));
            } else {
                const entity = Lookup.getEntity(selectedTarget);

                if (Lookup.isDungeon(entity.id)) {
                    const boss = entity.monsters[entity.monsters.length - 1];

                    this._addToLootMap(boss);
                    this._addToLootMap(entity);
                }

                if (Lookup.isStronghold(entity.id)) {
                    for (const monster of entity.monsters) {
                        this._addToLootMap(monster);
                    }

                    this._addToLootMap(entity);
                }

                if (Lookup.isDepth(entity.id)) {
                    this._addToLootMap(entity);
                }

                if (Lookup.isSlayerTask(entity.id)) {
                    const monsters = Lookup.getSlayerTaskMonsters(entity.id);

                    for (const monster of monsters) {
                        this._addToLootMap(monster);
                    }
                }

                this._addToLootMap(entity);
            }
        } else {
            for (const monster of Lookup.monsters.allObjects) {
                this._addToLootMap(monster);
            }

            for (const dungeon of Lookup.combatAreas.dungeons) {
                this._addToLootMap(dungeon);
            }

            for (const stronghold of Lookup.combatAreas.strongholds) {
                this._addToLootMap(stronghold);
            }

            for (const depth of Lookup.combatAreas.depths) {
                this._addToLootMap(depth);
            }
        }

        const sortedLoot = Array.from(this._loot.values()).sort((a, b) => a.text.localeCompare(b.text));
        const options: DropdownOption[] = [{ value: 'mcs:none', text: 'None' }].concat(sortedLoot);

        return options;
    }

    // @ts-ignore // TODO: TYPES
    private _addToLootMap(source: Monster | Dungeon | Stronghold | Depth) {
        // @ts-ignore // TODO: TYPES
        if (source instanceof Stronghold) {
            const rewards = source.tiers[source.mcsTier].rewards;

            for (const reward of rewards?.items ?? []) {
                this._addItem(reward.item);

                if (reward.item instanceof OpenableItem && reward.item.dropTable) {
                    for (const drop of reward.item.dropTable.drops) {
                        this._addItem(drop.item);
                    }
                }
            }

            return;
        }

        if (source instanceof Dungeon) {
            for (const reward of source.rewards) {
                this._addItem(reward);

                if (reward instanceof OpenableItem && reward.dropTable) {
                    for (const drop of reward.dropTable.drops) {
                        this._addItem(drop.item);
                    }
                }
            }

            return;
        }

        if (source instanceof Monster) {
            if (source.lootTable) {
                for (const drop of source.lootTable.drops) {
                    this._addItem(drop.item);

                    if (drop.item instanceof OpenableItem && drop.item.dropTable) {
                        for (const itemDrop of drop.item.dropTable.drops) {
                            this._addItem(itemDrop.item);
                        }
                    }
                }
            }

            if (source.bones) {
                this._addItem(source.bones.item);
                // TODO: some bones are upgradable, e.g. Earth_Shard
            }

            if (source.hasBarrier) {
                this._addItem('melvorAoD:Barrier_Dust');
            }
        }
    }

    private _addItem(itemOrId: AnyItem | string) {
        const item = typeof itemOrId === 'string' ? Global.game.items.getObjectByID(itemOrId) : itemOrId;

        if (Global.stores.plotter.state.onlyUndiscovered && !Global.melvor.stats.itemFindCount(item)) {
            return;
        }

        this._loot.set(item.id, { value: item.id, text: item.name });
    }
}

customElements.define('mcs-loot', LootPage);

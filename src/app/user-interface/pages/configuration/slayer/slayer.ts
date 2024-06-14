import './slayer.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { SettingsController, SlayerSettings } from 'src/app/settings-controller';
import { Global } from 'src/app/global';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-slayer': SlayerPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/slayer/slayer.html')
export class SlayerPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _clearButton: HTMLButtonElement;
    private readonly _dungeonCompletions: HTMLDivElement;
    private readonly _abyssDepthCompletions: HTMLDivElement;
    private readonly _shopPurchases: HTMLDivElement;
    private readonly _foundItems: HTMLDivElement;
    private readonly _ignoreRequirements: Switch;

    private readonly _dungeons = new Map<string, ButtonImage>();
    private readonly _abyssDepths = new Map<string, ButtonImage>();
    private readonly _purchases = new Map<string, ButtonImage>();
    private readonly _items = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-slayer-template'));

        this._clearButton = getElementFromFragment(this._content, 'mcs-slayer-clear', 'button');
        this._dungeonCompletions = getElementFromFragment(this._content, 'mcs-slayer-dungeon-completions', 'div');
        this._abyssDepthCompletions = getElementFromFragment(
            this._content,
            'mcs-slayer-abyss-depth-completions',
            'div'
        );
        this._shopPurchases = getElementFromFragment(this._content, 'mcs-slayer-shop-purchases', 'div');
        this._foundItems = getElementFromFragment(this._content, 'mcs-slayer-found-items', 'div');
        this._ignoreRequirements = getElementFromFragment(
            this._content,
            'mcs-slayer-ignore-requirements',
            'mcs-switch'
        );
    }

    public connectedCallback() {
        this.appendChild(this._content);

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            const abyssDepthsContainer = this.querySelector<HTMLDivElement>(
                '#mcs-dungeon-abyss-depth-completions-container'
            );

            if (abyssDepthsContainer) {
                abyssDepthsContainer.style.display = 'none';
            }
        }

        this._init();
    }

    public disconnnectedCallback() {
        this._dungeonCompletions.innerHTML = '';
        this._abyssDepthCompletions.innerHTML = '';
        this._shopPurchases.innerHTML = '';
        this._foundItems.innerHTML = '';

        this._dungeons.clear();
        this._abyssDepths.clear();
        this._purchases.clear();
        this._items.clear();
    }

    public _import(settings: SlayerSettings, ignoreAllSlayerRequirements: boolean) {
        this._ignoreRequirements._toggle(ignoreAllSlayerRequirements);

        Global.game.combat.player.ignoreAllSlayerRequirements = ignoreAllSlayerRequirements;

        for (const [dungeonId, element] of this._dungeons) {
            const dungeon = Lookup.dungeons.getObjectByID(dungeonId);

            if (dungeon) {
                const isSelected = settings.dungeonCompletion.includes(dungeonId);

                element._toggle(isSelected);
                this._updateDungeonCompletion(dungeon, isSelected);
            }
        }

        for (const [abyssDepthId, element] of this._abyssDepths) {
            // @ts-ignore // TODO: TYPES
            const abyssDepth = Lookup.depths.getObjectByID(abyssDepthId);

            if (abyssDepth) {
                const isSelected = settings.abyssDepthCompletion?.includes(abyssDepthId) ?? false;

                element._toggle(isSelected);
                // @ts-ignore // TODO: TYPES
                this._updateAbyssDepthCompletion(abyssDepth, isSelected);
            }
        }

        for (const [purchaseId, element] of this._purchases) {
            const purchase = Global.game.shop.purchases.getObjectByID(purchaseId);

            if (purchase) {
                const isSelected = settings.shopPurchase?.includes(purchaseId) ?? false;

                element._toggle(isSelected);
                this._updateShopPurchase(purchase, isSelected);
            }
        }

        for (const [itemId, element] of this._items) {
            const item = Global.game.items.getObjectByID(itemId);

            if (item) {
                const isSelected = settings.foundItem.includes(itemId);

                element._toggle(isSelected);
                this._updateFoundItem(item, isSelected);
            }
        }
    }

    private _clear() {
        this._import({ dungeonCompletion: [], abyssDepthCompletion: [], shopPurchase: [], foundItem: [] }, false);
    }

    private _init() {
        this._ignoreRequirements._on(isChecked => {
            Global.game.combat.player.ignoreAllSlayerRequirements = isChecked;
        });

        this._clearButton.onclick = () => this._clear();

        const { dungeonSet, abyssDepthSet, purchaseSet, itemsFoundSet } = SettingsController.getSlayerRequirementData(
            Global.game
        );

        for (const dungeon of dungeonSet) {
            const completion = createElement('mcs-button-image', { attributes: [['data-mcsSrc', dungeon.media]] });

            completion.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: dungeon.name })
            );

            completion._on(isSelected => this._updateDungeonCompletion(dungeon, isSelected));

            this._dungeonCompletions.appendChild(completion);
            this._dungeons.set(dungeon.id, completion);
        }

        for (const abyssDepth of abyssDepthSet) {
            const completion = createElement('mcs-button-image', { attributes: [['data-mcsSrc', abyssDepth.media]] });

            completion.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: abyssDepth.name })
            );

            completion._on(isSelected => this._updateAbyssDepthCompletion(abyssDepth, isSelected));

            this._abyssDepthCompletions.appendChild(completion);
            this._abyssDepths.set(abyssDepth.id, completion);
        }

        for (const purchase of purchaseSet) {
            const shopPurchase = createElement('mcs-button-image', { attributes: [['data-mcsSrc', purchase.media]] });

            shopPurchase.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: purchase.name })
            );

            shopPurchase._on(isSelected => this._updateShopPurchase(purchase, isSelected));

            this._shopPurchases.appendChild(shopPurchase);
            this._purchases.set(purchase.id, shopPurchase);
        }

        for (const item of itemsFoundSet) {
            const foundItem = createElement('mcs-button-image', { attributes: [['data-mcsSrc', item.media]] });

            foundItem.appendChild(
                createElement('div', { attributes: [['data-mcsTooltipContent', '']], text: item.name })
            );

            foundItem._on(isSelected => this._updateFoundItem(item, isSelected));

            this._foundItems.appendChild(foundItem);
            this._items.set(item.id, foundItem);
        }
    }

    private _updateDungeonCompletion(dungeon: Dungeon, isSelected: boolean) {
        if (isSelected) {
            Global.game.combat.dungeonCompletion.set(dungeon, 1);
        } else {
            Global.game.combat.dungeonCompletion.delete(dungeon);
        }
    }

    // @ts-ignore // TODO: TYPES
    private _updateAbyssDepthCompletion(abyssDepth: AbyssDepth, isSelected: boolean) {
        abyssDepth.timesCompleted = isSelected ? 1 : 0;
    }

    private _updateShopPurchase(purchase: ShopPurchase, isSelected: boolean) {
        if (isSelected) {
            Global.game.shop.upgradesPurchased.set(purchase, 1);
        } else {
            Global.game.shop.upgradesPurchased.delete(purchase);
        }
    }

    private _updateFoundItem(item: AnyItem, isSelected: boolean) {
        if (isSelected) {
            Global.game.stats.Items.add(item, ItemStats.TimesFound, 1);
        } else {
            Global.game.stats.Items.getTracker(item).remove(ItemStats.TimesFound);
        }
    }
}

customElements.define('mcs-slayer', SlayerPage);

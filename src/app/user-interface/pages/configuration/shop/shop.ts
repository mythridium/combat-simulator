import './shop.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { ModifierHelper } from 'src/shared/utils/modifiers';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-shop': ShopPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/shop/shop.html')
export class ShopPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _shopPurchases: HTMLDivElement;

    private readonly _purchases = new Map<string, ButtonImage>();

    private readonly blacklist = [
        'Auto_Eat_Tier',
        'Extra_Equipment_Set',
        'AutoEquipFood',
        'AutoSwapFood',
        'LootContainerStacking',
        'Auto_Slayer',
        'Dungeon_Equipment_Swapping'
    ];

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-shop-template'));

        this._shopPurchases = getElementFromFragment(this._content, 'mcs-shop-purchases', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        if (this._getPurchases().length) {
            this._init();
        } else {
            Global.userInterface.main.querySelectorAll('.mcs-shop-menu').forEach((element: HTMLElement) => {
                element.style.display = 'none';
            });
        }
    }

    public _import(purchaseIds: string[]) {
        for (const [purchaseId, element] of this._purchases) {
            const purchase = Global.game.shop.purchases.getObjectByID(purchaseId);

            if (purchase) {
                const isSelected = purchaseIds.includes(purchaseId);
                element._toggle(isSelected);
                this._updateShopPurchase(purchase, isSelected);
            }
        }
    }

    private _init() {
        for (const purchase of this._getPurchases()) {
            const shopPurchase = createElement('mcs-button-image', { attributes: [['data-mcsSrc', purchase.media]] });
            const tooltip = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });

            tooltip.innerHTML = `<small><span class="text-warning">${
                purchase.name
            }</span><br>${purchase.getTemplatedDescription(Global.game.shop)}</small>`;

            shopPurchase.appendChild(tooltip);
            shopPurchase._on(isSelected => this._updateShopPurchase(purchase, isSelected));

            this._shopPurchases.appendChild(shopPurchase);
            this._purchases.set(purchase.id, shopPurchase);
        }
    }

    private _updateShopPurchase(purchase: ShopPurchase, isSelected: boolean) {
        if (isSelected) {
            Global.game.shop.upgradesPurchased.set(purchase, 1);
        } else {
            Global.game.shop.upgradesPurchased.delete(purchase);
        }

        StatsController.update();
    }

    private _getPurchases() {
        return Global.game.shop.purchases.filter(
            purchase =>
                purchase.category.id !== 'melvorD:GolbinRaid' &&
                !this.blacklist.some(blacklist => purchase.id.includes(blacklist)) &&
                purchase.contains?.stats !== undefined &&
                ModifierHelper.hasCombatModifiers(purchase.contains.stats)
        );
    }
}

customElements.define('mcs-shop', ShopPage);

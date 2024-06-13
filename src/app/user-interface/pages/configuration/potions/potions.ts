import './potions.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { Dropdown, DropdownOption } from 'src/app/user-interface/_parts/dropdown/dropdown';
import { Global } from 'src/app/global';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ImageLoader } from 'src/app/utils/image-loader';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-potions': PotionsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/potions/potions.html')
export class PotionsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _tier: Dropdown;
    private readonly _combatPotionsContainer: HTMLDivElement;
    private readonly _otherPotionsContainer: HTMLDivElement;

    private readonly _potions = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-potions-template'));

        this._tier = getElementFromFragment(this._content, 'mcs-potions-tier', 'mcs-dropdown');
        this._combatPotionsContainer = getElementFromFragment(this._content, 'mcs-potions-combat-container', 'div');
        this._otherPotionsContainer = getElementFromFragment(this._content, 'mcs-potions-other-container', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._init();
    }

    public disconnectedCallback() {
        this._combatPotionsContainer.innerHTML = '';
        this._otherPotionsContainer.innerHTML = '';

        this._potions.clear();
    }

    public _import(potionId: string | undefined) {
        this._clear();

        if (!potionId) {
            return;
        }

        const potion = Global.game.items.potions.getObjectByID(potionId);

        if (!potion) {
            return;
        }

        Global.game.combat.player.setPotion(potion);

        const recipe = Global.game.herblore.potionToRecipeMap.get(potion);

        if (recipe) {
            const index = recipe.potions.findIndex(recipePotion => recipePotion.id === potion.id);
            this._tier._select(index.toString());
            this._update();
        }

        this._potions.get(recipe?.id ?? potion.id)?._toggle(true);
    }

    public _updateTooltips() {
        this._update();
    }

    private _init() {
        this._tier._init({
            search: false,
            label: 'Potion Tier',
            default: '0',
            options: [0, 1, 2, 3].map(tier => ({ value: tier.toString(), text: `Tier ${tier + 1}` })),
            onChange: option => this._onTierChange(option)
        });

        for (const recipe of Global.game.herblore.actions.allObjects) {
            if (recipe.category.localID !== 'CombatPotions' && recipe.category.localID !== 'AbyssalCombatPotions') {
                continue;
            }

            const base = recipe.potions[0];

            const potionElement = createElement('mcs-button-image', {
                attributes: [['data-mcsSrc', base.media]]
            });

            const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
            tooltipContent.innerHTML = this._getTooltip(base);

            potionElement.appendChild(tooltipContent);

            potionElement._on(() => {
                this._updateRecipe(recipe);
                StatsController.update();
            });

            this._potions.set(recipe.id, potionElement);

            this._combatPotionsContainer.appendChild(potionElement);
        }

        const otherPotions = Global.game.items.potions.filter(
            potion => potion.type == 'Potion' && potion.category !== 'Herblore'
        );

        for (const potion of otherPotions) {
            const potionElement = createElement('mcs-button-image', {
                attributes: [['data-mcsSrc', potion.media]]
            });

            const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
            tooltipContent.innerHTML = this._getTooltip(potion);

            potionElement.appendChild(tooltipContent);

            potionElement._on(() => {
                this._updatePotion(potion);
                StatsController.update();
            });

            this._potions.set(potion.id, potionElement);

            this._otherPotionsContainer.appendChild(potionElement);
        }
    }

    private _updateRecipe(recipe: HerbloreRecipe) {
        if (!this._tier._selected?.value) {
            Global.logger.error(`No potion tier has been selected`, this._tier._selected?.value);
            return;
        }

        const tier = parseInt(this._tier._selected?.value);
        const potion = recipe.potions[tier];

        this._updatePotion(potion);
    }

    private _updatePotion(potion: PotionItem) {
        if (!Global.game.combat.player.potion) {
            Global.game.combat.player.setPotion(potion);
            return;
        }

        if (Global.game.combat.player.potion?.id === potion.id) {
            Global.game.combat.player.setPotion(undefined);
        } else {
            this._remove(Global.game.combat.player.potion);
            Global.game.combat.player.setPotion(potion);
        }
    }

    private _clear() {
        for (const [_, element] of this._potions) {
            element._toggle(false);
        }
    }

    private _remove(potion: PotionItem) {
        this._potions.get(this._getId(potion))?._toggle(false);
    }

    private _getId(potion: PotionItem) {
        const recipe = Global.game.herblore.actions.allObjects.find(action =>
            action.potions.find(actionPotion => actionPotion.id === potion.id)
        );

        if (!recipe) {
            return potion.id;
        }

        return recipe.id;
    }

    private _update() {
        if (!this._tier._selected?.value) {
            Global.logger.error(`No potion tier has been selected`, this._tier._selected?.value);
            return;
        }

        const tier = parseInt(this._tier._selected?.value);

        for (const [recipeId, element] of this._potions) {
            const recipe = Global.game.herblore.actions.getObjectByID(recipeId);
            const tooltip = element.querySelector('[data-mcsTooltipContent]');

            if (recipe && tooltip) {
                element.setAttribute('data-mcsSrc', recipe.potions[tier].media);
                tooltip.innerHTML = this._getTooltip(recipe.potions[tier]);
            }
        }
    }

    private _getTooltip(potion: PotionItem) {
        return (
            `<div class="text-warning">${potion.name}<small>` +
            `<br><span class='text-info'>${potion.description.replace(/\.$/, '')}</span>` +
            `<br></small></div>`
        );
    }

    private _onTierChange(option: DropdownOption) {
        const potionTier = parseInt(option.value);

        if (Global.game.combat.player.potion?.category === 'Herblore') {
            const recipe = Global.game.herblore.actions.find(potion =>
                potion.potions.includes(Global.game.combat.player.potion)
            );

            if (!recipe) {
                Global.logger.error(`Could not locate potion`, Global.game.combat.player.potion.id, potionTier);
            }

            Global.game.combat.player.setPotion(recipe.potions[potionTier]);
            StatsController.update();
        }

        this._update();
    }
}

customElements.define('mcs-potions', PotionsPage);

import './configuration-menu.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { Bugs } from 'src/app/user-interface/bugs/bugs';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-configuration-menu': ConfigurationMenu;
    }
}

@LoadTemplate('app/user-interface/configuration-menu/configuration-menu.html')
export class ConfigurationMenu extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _equipment: HTMLButtonElement;
    private readonly _levels: HTMLButtonElement;
    private readonly _spells: HTMLButtonElement;
    private readonly _prayers: HTMLButtonElement;
    private readonly _potions: HTMLButtonElement;
    private readonly _pets: HTMLButtonElement;
    private readonly _agility: HTMLButtonElement;
    private readonly _township: HTMLButtonElement;
    private readonly _slayer: HTMLButtonElement;
    private readonly _shop: HTMLButtonElement;
    private readonly _astrology: HTMLButtonElement;
    private readonly _cartography: HTMLButtonElement;
    private readonly _corruption: HTMLButtonElement;
    private readonly _skillTrees: HTMLButtonElement;
    private readonly _ancientRelics: HTMLButtonElement;
    private readonly _loot: HTMLButtonElement;
    private readonly _history: HTMLButtonElement;
    private readonly _settings: HTMLButtonElement;
    private readonly _foundABug: HTMLButtonElement;

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-configuration-menu-template'));

        this._equipment = getElementFromFragment(this._content, 'mcs-configuration-equipment', 'button');
        this._levels = getElementFromFragment(this._content, 'mcs-configuration-levels', 'button');
        this._spells = getElementFromFragment(this._content, 'mcs-configuration-spells', 'button');
        this._prayers = getElementFromFragment(this._content, 'mcs-configuration-prayers', 'button');
        this._potions = getElementFromFragment(this._content, 'mcs-configuration-potions', 'button');
        this._pets = getElementFromFragment(this._content, 'mcs-configuration-pets', 'button');
        this._agility = getElementFromFragment(this._content, 'mcs-configuration-agility', 'button');
        this._township = getElementFromFragment(this._content, 'mcs-configuration-township', 'button');
        this._slayer = getElementFromFragment(this._content, 'mcs-configuration-slayer', 'button');
        this._shop = getElementFromFragment(this._content, 'mcs-configuration-shop', 'button');
        this._astrology = getElementFromFragment(this._content, 'mcs-configuration-astrology', 'button');
        this._cartography = getElementFromFragment(this._content, 'mcs-configuration-cartography', 'button');
        this._corruption = getElementFromFragment(this._content, 'mcs-configuration-corruption', 'button');
        this._skillTrees = getElementFromFragment(this._content, 'mcs-configuration-skill-trees', 'button');
        this._ancientRelics = getElementFromFragment(this._content, 'mcs-configuration-ancient-relics', 'button');
        this._loot = getElementFromFragment(this._content, 'mcs-configuration-loot', 'button');
        this._history = getElementFromFragment(this._content, 'mcs-configuration-history', 'button');
        this._settings = getElementFromFragment(this._content, 'mcs-configuration-settings', 'button');
        this._foundABug = getElementFromFragment(this._content, 'mcs-found-a-bug-header', 'button');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._equipment.onclick = () => PageController.goTo(PageId.Equipment);
        this._levels.onclick = () => PageController.goTo(PageId.Levels);
        this._spells.onclick = () => PageController.goTo(PageId.Spells);
        this._prayers.onclick = () => PageController.goTo(PageId.Prayers);
        this._potions.onclick = () => PageController.goTo(PageId.Potions);
        this._pets.onclick = () => PageController.goTo(PageId.Pets);
        this._agility.onclick = () => PageController.goTo(PageId.Agility);
        this._township.onclick = () => PageController.goTo(PageId.Township);
        this._slayer.onclick = () => PageController.goTo(PageId.Slayer);
        this._shop.onclick = () => PageController.goTo(PageId.Shop);
        this._astrology.onclick = () => PageController.goTo(PageId.Astrology);
        this._cartography.onclick = () => PageController.goTo(PageId.Cartography);
        this._ancientRelics.onclick = () => PageController.goTo(PageId.AncientRelics);
        this._corruption.onclick = () => PageController.goTo(PageId.Corruption);
        this._skillTrees.onclick = () => PageController.goTo(PageId.SkillTrees);

        if (!cloudManager.hasAoDEntitlementAndIsEnabled) {
            this._cartography.style.display = 'none';
        }

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._corruption.style.display = 'none';
        }

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._skillTrees.style.display = 'none';
        }

        if (!game.currentGamemode.allowAncientRelicDrops) {
            this._ancientRelics.style.display = 'none';
        }

        this._loot.onclick = () => PageController.goTo(PageId.Loot);
        this._history.onclick = () => PageController.goTo(PageId.History);
        this._settings.onclick = () => PageController.goTo(PageId.Settings);
        this._foundABug.onclick = () => Bugs.report(true);
    }
}

customElements.define('mcs-configuration-menu', ConfigurationMenu);

import { Global } from 'src/app/global';

export enum PageId {
    Simulate = 'mcs-simulate',
    Equipment = 'mcs-equipment',
    Levels = 'mcs-levels',
    Spells = 'mcs-spells',
    Prayers = 'mcs-prayers',
    Potions = 'mcs-potions',
    Pets = 'mcs-pets',
    Agility = 'mcs-agility',
    Township = 'mcs-township',
    Slayer = 'mcs-slayer',
    Shop = 'mcs-shop',
    Astrology = 'mcs-astrology',
    Cartography = 'mcs-cartography',
    Corruption = 'mcs-corruption',
    SkillTrees = 'mcs-skill-trees',
    AncientRelics = 'mcs-ancient-relics',
    Loot = 'mcs-loot',
    History = 'mcs-history',
    Settings = 'mcs-settings',
    Summary = 'mcs-summary',
    Modifiers = 'mcs-modifiers'
}

type Callback = (pageId: PageId) => void;

export abstract class PageController {
    public static pageId: PageId;
    public static page: HTMLElement;

    private static readonly callbacks = new Set<Callback>();

    public static goTo(pageId: PageId) {
        if (this.pageId === pageId) {
            return;
        }

        if (this.page) {
            this.page.classList.remove('is-open');
            this.toggleHighlight(this.pageId, false);

            if (this.pageId === PageId.Summary && pageId !== PageId.Summary) {
                this.page.style.display = 'none';
            }
        }

        this.pageId = pageId;
        this.page = document.getElementById(this.pageId);
        this.page.classList.add('is-open');

        if (pageId === PageId.Summary) {
            Global.userInterface.main.querySelector('mcs-pages').style.display = 'none';
            this.page.style.display = '';
        } else {
            Global.userInterface.main.querySelector('mcs-pages').style.display = '';
        }

        this.toggleHighlight(this.pageId, true);

        document.getElementById('mcs-combat-simulator').classList.remove('mobile-menu-open');

        for (const callback of this.callbacks) {
            try {
                callback(this.pageId);
            } catch (exception) {
                Global.logger.error(`Error thrown from onPage callback`, exception);
            }
        }
    }

    public static on(callback: Callback) {
        if (this.callbacks.has(callback)) {
            return;
        }

        this.callbacks.add(callback);
    }

    public static off(callback: Callback) {
        this.callbacks.delete(callback);
    }

    private static toggleHighlight(pageId: PageId, toggle: boolean) {
        const mainContainer = document.getElementById('mcs-combat-simulator');

        switch (pageId) {
            case PageId.Simulate:
            case PageId.Summary:
            case PageId.Modifiers: {
                mainContainer.querySelector(`.${pageId}-header`).classList.toggle('is-highlight', toggle);
                mainContainer.querySelector(`.${pageId}-sidebar`).classList.toggle('is-highlight', toggle);
                break;
            }
            default:
                mainContainer.querySelectorAll(`.${pageId}-menu`).forEach(element => {
                    element.classList.toggle('is-highlight', toggle);
                });
        }
    }
}

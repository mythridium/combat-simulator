import './prayers.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { Tabs } from 'src/app/user-interface/_parts/tabs/tabs';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { Notify } from 'src/app/utils/notify';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-prayers': PrayersPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/prayers/prayers.html')
export class PrayersPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _prayerTabs: Tabs;
    private readonly _prayerContainer: HTMLDivElement;
    private readonly _unholyPrayerContainer: HTMLDivElement;
    private readonly _abyssalPrayerContainer: HTMLDivElement;

    private readonly _abyssalTabHeader: HTMLDivElement;
    private readonly _abyssalTabContent: HTMLDivElement;

    private readonly _prayers = new Map<string, ButtonImage>();
    private readonly _unholyPrayers = new Map<string, ButtonImage>();
    private readonly _abyssalPrayers = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-prayers-template'));

        this._prayerTabs = getElementFromFragment(this._content, 'mcs-prayer-tabs', 'mcs-tabs');
        this._prayerContainer = getElementFromFragment(this._content, 'mcs-prayer-container', 'div');
        this._unholyPrayerContainer = getElementFromFragment(this._content, 'mcs-unholy-prayer-container', 'div');
        this._abyssalPrayerContainer = getElementFromFragment(this._content, 'mcs-abyssal-prayer-container', 'div');

        this._abyssalTabHeader = getElementFromFragment(this._content, 'mcs-prayer-abyssal-tab-header', 'div');
        this._abyssalTabContent = getElementFromFragment(this._content, 'mcs-prayer-abyssal-tab-content', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        const prayers = Global.game.prayers.allObjects.sort((a, b) => a.level - b.level);

        for (const prayer of prayers) {
            if (prayer.isUnholy) {
                const element = this._create(prayer);
                this._unholyPrayers.set(prayer.id, element);
                this._unholyPrayerContainer.appendChild(element);
            } else if (prayer.isAbyssal) {
                const element = this._create(prayer);
                this._abyssalPrayers.set(prayer.id, element);
                this._abyssalPrayerContainer.appendChild(element);
            } else {
                const element = this._create(prayer);
                this._prayers.set(prayer.id, element);
                this._prayerContainer.appendChild(element);
            }
        }

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._abyssalTabHeader.style.display = 'none';
            this._abyssalTabContent.style.display = 'none';
        }

        this._prayerTabs._init();
    }

    public _update() {
        const prayers = [...this._prayers, ...this._unholyPrayers, ...this._abyssalPrayers];

        for (const [prayerId, element] of prayers) {
            const prayer = Global.game.prayers.getObjectByID(prayerId);

            if (!prayer) {
                element.setAttribute('data-mcsDisabled', '');
                continue;
            }

            const isBelowSkillLevel = prayer.level > Global.game.combat.player.skillLevel.get(Global.game.prayer.id);

            if (isBelowSkillLevel && Global.game.combat.player.activePrayers.has(prayer)) {
                Global.game.combat.player.activePrayers.delete(prayer);
            }

            element.toggleAttribute('data-mcsDisabled', isBelowSkillLevel);

            element._toggle(Global.game.combat.player.activePrayers.has(prayer));
        }
    }

    public _import(prayerIds: string[]) {
        for (const prayer of Global.game.combat.player.activePrayers) {
            this._getElement(prayer)?._toggle(false);
        }

        Global.game.combat.player.activePrayers.clear();

        for (const prayerId of prayerIds) {
            const prayer = Global.game.prayers.getObjectByID(prayerId);

            if (!prayer) {
                continue;
            }

            Global.game.combat.player.activePrayers.add(prayer);
            this._getElement(prayer)?._toggle(true);
        }

        this._update();
    }

    private _create(prayer: ActivePrayer) {
        const prayerElement = createElement('mcs-button-image', { attributes: [['data-mcsSrc', prayer.media]] });

        if (prayer.level > Global.game.combat.player.skillLevel.get(Global.game.prayer.id)) {
            prayerElement.setAttribute('data-mcsDisabled', '');
        }

        prayerElement._on(() => this._toggle(prayer, prayerElement));

        const prayerTooltip = createElement('mcs-prayer-tooltip', {
            attributes: [['data-mcsPrayerId', prayer.id]]
        });

        const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
        tooltipContent.appendChild(prayerTooltip);

        prayerElement.appendChild(tooltipContent);

        return prayerElement;
    }

    private _toggle(prayer: ActivePrayer, element: ButtonImage) {
        if (Global.game.combat.player.activePrayers.has(prayer)) {
            Global.game.combat.player.activePrayers.delete(prayer);
            StatsController.update();
            return;
        }

        if (prayer.isUnholy && Global.game.combat.player.modifiers.allowUnholyPrayerUse < 2) {
            element._toggle(false);
            Notify.message(`You don't have enough items equipped that allow you to use Unholy Prayers!`, 'danger');
            return;
        }

        if (!prayer.canUseWithDamageType(Global.game.combat.player.damageType)) {
            element._toggle(false);
            // Incompatible damage type
            Notify.message(
                `This Prayer cannot be used with ${Global.game.combat.player.damageType.name}`,
                'danger',
                Global.game.prayer.media
            );
            return;
        }

        // if switching prayers, deselect the previous prayers
        if (Global.game.combat.player.activePrayers.size && this._isSwitching(prayer)) {
            for (const prayer of Global.game.combat.player.activePrayers) {
                this._getElement(prayer)?._toggle(false);
            }

            Global.game.combat.player.activePrayers.clear();
            StatsController.update();
        }

        if (Global.game.combat.player.activePrayers.size >= 2) {
            element._toggle(false);
            Notify.message(`Cannot equip more than 2 prayers.`, 'danger');
            return;
        }

        Global.game.combat.player.activePrayers.add(prayer);
        StatsController.update();
    }

    private _getElement(prayer: ActivePrayer) {
        let element: ButtonImage;

        if (prayer.isUnholy) {
            element = this._unholyPrayers.get(prayer.id);
        } else if (prayer.isAbyssal) {
            element = this._abyssalPrayers.get(prayer.id);
        } else {
            element = this._prayers.get(prayer.id);
        }

        return element;
    }

    private _isSwitching(prayer: ActivePrayer) {
        const isUnholy = this._isUnholy();
        const isAbyssal = this._isAbyssal();

        if (isUnholy && (prayer.isAbyssal || !prayer.isUnholy)) {
            return true;
        }

        if (isAbyssal && (prayer.isUnholy || !prayer.isAbyssal)) {
            return true;
        }

        if (!isUnholy && !isAbyssal && (prayer.isUnholy || prayer.isAbyssal)) {
            return true;
        }

        return false;
    }

    private _isUnholy() {
        let isUnholy = false;

        for (const prayer of Global.game.combat.player.activePrayers) {
            isUnholy = prayer.isUnholy;
        }

        return isUnholy;
    }

    private _isAbyssal() {
        let isAbyssal = false;

        for (const prayer of Global.game.combat.player.activePrayers) {
            isAbyssal = prayer.isAbyssal;
        }

        return isAbyssal;
    }
}

customElements.define('mcs-prayers', PrayersPage);

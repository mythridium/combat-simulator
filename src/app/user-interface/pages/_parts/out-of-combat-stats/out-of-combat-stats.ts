import './out-of-combat-stats.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { PageController, PageId } from 'src/app/user-interface/pages/page-controller';
import { LineItem } from 'src/app/user-interface/_parts/line-item/line-item';
import { Lookup } from 'src/shared/utils/lookup';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-out-of-combat-stats': OutOfCombatStats;
    }
}

@LoadTemplate('app/user-interface/pages/_parts/out-of-combat-stats/out-of-combat-stats.html')
export class OutOfCombatStats extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _attackInterval: HTMLSpanElement;
    private readonly _summoningInterval: HTMLSpanElement;
    private readonly _respawnInterval: HTMLSpanElement;
    private readonly _minHit: HTMLSpanElement;
    private readonly _maxHit: HTMLSpanElement;
    private readonly _summoningMaxHit: HTMLSpanElement;
    private readonly _barrierMaxHit: HTMLSpanElement;
    private readonly _accuracy: HTMLSpanElement;
    private readonly _critChance: HTMLSpanElement;
    private readonly _critDamage: HTMLSpanElement;
    private readonly _meleeEvasion: HTMLSpanElement;
    private readonly _rangedEvasion: HTMLSpanElement;
    private readonly _magicEvasion: HTMLSpanElement;
    private readonly _maxHitpoints: HTMLSpanElement;
    private readonly _damageReduction: HTMLSpanElement;
    private readonly _abyssalResistance: HTMLSpanElement;
    private readonly _autoEatThreshold: HTMLSpanElement;
    private readonly _slayerAreaNegation: HTMLSpanElement;
    private readonly _abyssalSlayerAreaNegation: HTMLSpanElement;
    private readonly _dropDoubling: HTMLSpanElement;
    private readonly _gpMultiplier: HTMLSpanElement;

    private readonly _maxHitpointsTooltip: HTMLDivElement;
    private readonly _autoEatThresholdTooltip: HTMLDivElement;
    private readonly _uncappedDamageReduction: HTMLDivElement;
    private readonly _uncappedAbyssalResistance: HTMLDivElement;

    private readonly onLoad = this._onLoad.bind(this);

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-out-of-combat-stats-template'));

        this._attackInterval = getElementFromFragment(this._content, 'mcs-stat-attack-interval', 'span');
        this._summoningInterval = getElementFromFragment(this._content, 'mcs-stat-summoning-interval', 'span');
        this._respawnInterval = getElementFromFragment(this._content, 'mcs-stat-respawn-interval', 'span');
        this._minHit = getElementFromFragment(this._content, 'mcs-stat-min-hit', 'span');
        this._maxHit = getElementFromFragment(this._content, 'mcs-stat-max-hit', 'span');
        this._summoningMaxHit = getElementFromFragment(this._content, 'mcs-stat-summoning-max-hit', 'span');
        this._barrierMaxHit = getElementFromFragment(this._content, 'mcs-stat-barrier-max-hit', 'span');
        this._accuracy = getElementFromFragment(this._content, 'mcs-stat-accuracy', 'span');
        this._critChance = getElementFromFragment(this._content, 'mcs-stat-crit-chance', 'span');
        this._critDamage = getElementFromFragment(this._content, 'mcs-stat-crit-damage', 'span');
        this._meleeEvasion = getElementFromFragment(this._content, 'mcs-stat-melee-evasion', 'span');
        this._rangedEvasion = getElementFromFragment(this._content, 'mcs-stat-ranged-evasion', 'span');
        this._magicEvasion = getElementFromFragment(this._content, 'mcs-stat-magic-evasion', 'span');
        this._maxHitpoints = getElementFromFragment(this._content, 'mcs-stat-max-hitpoints', 'span');
        this._damageReduction = getElementFromFragment(this._content, 'mcs-stat-damage-reduction', 'span');
        this._abyssalResistance = getElementFromFragment(this._content, 'mcs-stat-abyssal-resistance', 'span');
        this._autoEatThreshold = getElementFromFragment(this._content, 'mcs-stat-auto-eat-threshold', 'span');
        this._slayerAreaNegation = getElementFromFragment(this._content, 'mcs-stat-slayer-area-negation', 'span');
        this._abyssalSlayerAreaNegation = getElementFromFragment(
            this._content,
            'mcs-stat-abyssal-slayer-area-negation',
            'span'
        );
        this._dropDoubling = getElementFromFragment(this._content, 'mcs-stat-drop-doubling', 'span');
        this._gpMultiplier = getElementFromFragment(this._content, 'mcs-stat-gp-multiplier', 'span');

        this._maxHitpointsTooltip = getElementFromFragment(this._content, 'mcs-stat-max-hitpoints-tooltip', 'div');
        this._autoEatThresholdTooltip = getElementFromFragment(
            this._content,
            'mcs-stat-auto-eat-threshold-tooltip',
            'div'
        );
        this._uncappedDamageReduction = getElementFromFragment(
            this._content,
            'mcs-stat-uncapped-damage-reduction',
            'div'
        );
        this._uncappedAbyssalResistance = getElementFromFragment(
            this._content,
            'mcs-stat-uncapped-abyssal-resistance',
            'div'
        );
    }

    public connectedCallback() {
        this.appendChild(this._content);
        PageController.on(this.onLoad);

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this.querySelector<LineItem>('.mcs-stat-abyssal-resistance-container').style.display = 'none';
            this.querySelector<LineItem>('.mcs-stat-abyssal-slayer-area-negation-container').style.display = 'none';
        }
    }

    public disconnectedCallback() {
        PageController.off(this.onLoad);
    }

    public _update() {
        this._attackInterval.textContent = this._format(Global.stores.stats.state.attackInterval);
        this._summoningInterval.textContent = this._format(Global.stores.stats.state.summonAttackInterval);
        this._respawnInterval.textContent = this._format(Global.stores.stats.state.respawnInterval);
        this._minHit.textContent = this._format(Global.stores.stats.state.minHit);
        this._maxHit.textContent = this._format(Global.stores.stats.state.maxHit);
        this._summoningMaxHit.textContent = this._format(Global.stores.stats.state.summoningMaxHit);
        this._barrierMaxHit.textContent = this._format(Global.stores.stats.state.summoningBarrierMaxHit);
        this._accuracy.textContent = this._format(Global.stores.stats.state.maxAttackRoll);
        this._critChance.textContent = this._format(Global.stores.stats.state.critChance);
        this._critDamage.textContent = this._format(Global.stores.stats.state.critDamage);
        this._meleeEvasion.textContent = this._format(Global.stores.stats.state.maxDefRoll);
        this._rangedEvasion.textContent = this._format(Global.stores.stats.state.maxRngDefRoll);
        this._magicEvasion.textContent = this._format(Global.stores.stats.state.maxMagDefRoll);
        this._maxHitpoints.textContent = this._format(Global.stores.stats.state.maxHitpoints);
        this._damageReduction.textContent = this._format(Global.stores.stats.state.damageReduction);
        this._abyssalResistance.textContent = this._format(Global.stores.stats.state.abyssalResistance);
        this._autoEatThreshold.textContent = this._format(Global.stores.stats.state.autoEatThreshold);
        this._slayerAreaNegation.textContent = this._format(Global.stores.stats.state.slayerAreaNegation);
        this._abyssalSlayerAreaNegation.textContent = this._format(Global.stores.stats.state.abyssalSlayerAreaNegation);
        this._dropDoubling.textContent = Global.stores.stats.state.lootBonusPercent.toString();
        this._gpMultiplier.textContent = Global.stores.stats.state.gpBonus.toFixed(2).replace(/[.,]00$/, '');

        this._maxHitpointsTooltip.textContent = `Max Hitpoints: ${numberWithCommas(
            Global.stores.stats.state.maxHitpoints
        )}`;

        this._autoEatThresholdTooltip.textContent = `Auto Eat Threshold: ${numberWithCommas(
            Global.stores.stats.state.autoEatThreshold
        )}`;

        let damageReduction = Global.game.combat.player.equipmentStats.getResistance(Lookup.normalDamage);
        damageReduction = Global.game.combat.player.modifyResistance(Lookup.normalDamage, damageReduction);

        this._uncappedDamageReduction.textContent = `Uncapped Damage Reduction: ${this._format(damageReduction)}`;

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            let abyssalResistance = Global.game.combat.player.equipmentStats.getResistance(Lookup.abyssalDamage);
            abyssalResistance = Global.game.combat.player.modifyResistance(Lookup.abyssalDamage, abyssalResistance);

            this._uncappedAbyssalResistance.textContent = `Uncapped Abyssal Resistance: ${this._format(
                abyssalResistance
            )}`;
        }
    }

    private _format(value: number) {
        return formatNumber(value);
    }

    private _onLoad(pageId: PageId) {
        if ([PageId.Simulate, PageId.Modifiers].includes(pageId)) {
            this.classList.remove('is-open');
            return;
        }

        this.classList.add('is-open');
    }
}

customElements.define('mcs-out-of-combat-stats', OutOfCombatStats);

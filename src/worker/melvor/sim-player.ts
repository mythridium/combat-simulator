import type { SimCombatManager } from './sim-combat-manager';

export class SimPlayer extends Player {
    public declare manager: SimCombatManager;

    public get effectRenderer() {
        return {
            container: undefined,
            renderedEffects: new Map(),
            removalQueue: new Set<RenderData>(),
            queueRemoval: () => {},
            queueRemoveAll: () => {},
            removeEffects: () => {},
            flushRemovalQueue: () => {},
            addStun: () => {},
            addSleep: () => {},
            addCurse: () => {},
            addDOT: () => {},
            addReflexive: () => {},
            addStacking: () => {},
            addModifier: () => {},
            addReductive: () => {},
            addIncremental: () => {},
            createEffect: () => {},
            createTooltip: () => {},
            addEffect: () => {},
            addStunImmunity: () => {},
            formatTurnsLeft: () => {},
            formatStacks: () => {},
            addCombo: () => {}
        } as any;
    }

    public get splashManager() {
        return {
            add: () => {}
        } as any;
    }

    public get statElements(): PlayerHTMLElements {
        return undefined;
    }

    public get attackBar(): ProgressBar {
        return undefined;
    }

    public get summonBar(): ProgressBar {
        return undefined;
    }

    public get attackBarMinibar(): ProgressBar {
        return undefined;
    }

    public get summonBarMinibar(): ProgressBar {
        return undefined;
    }

    public setRenderAll() {}
    public render() {}
    public renderFood() {}
    public renderActiveSkillModifiers() {}
    public renderAttackBar() {}
    public renderAttackIcon() {}
    public renderAttackStyle() {}
    public renderAutoEat() {}
    public renderBarrier() {}
    public renderCombatLevel() {}
    public renderCombatTriangle() {}
    public renderDamageSplashes() {}
    public renderDamageValues() {}
    public renderEffects() {}
    public renderEquipmentSets() {}
    public renderHitchance() {}
    public renderHitpoints() {}
    public renderModifierEffect() {}
    public renderPrayerPoints() {}
    public renderPrayerSelection() {}
    public renderStats() {}
    public renderSummonBar() {}
    public renderSummonMaxHit() {}
    public addItemStat() {}
    public trackPrayerStats() {}
    public trackWeaponStat() {}
    public setCallbacks() {}
    public onMagicAttackFailure() {}
    public rollForSummoningMarks() {}
}

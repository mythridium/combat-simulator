import { Global } from 'src/worker/global';
import type { SimManager } from './sim-manager';

export class SimPlayer extends Player {
    public declare manager: SimManager;

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
    public addItemStat() {}
    public trackPrayerStats() {}
    public trackWeaponStat() {}
    public setCallbacks() {}
    public onMagicAttackFailure() {}
    public rollForSummoningMarks() {}

    public activeTick() {
        super.activeTick();

        if (Global.configuration.state.isManualEating) {
            this.manualEat();
        }
    }

    public damage(amount: number, source: SplashType): void {
        super.damage(amount, source);

        Global.game.combat.stats.highestDamageTaken = Math.max(Global.game.combat.stats.highestDamageTaken, amount);
        Global.game.combat.stats.lowestHitpoints = Math.min(Global.game.combat.stats.lowestHitpoints, this.hitpoints);
    }

    public consumePrayerPoints(amount: number, isUnholy: boolean) {
        if (amount > 0) {
            amount = this.applyModifiersToPrayerCost(amount, isUnholy);
            Global.game.combat.stats.usedPrayerPoints += amount;
            const event = new PrayerPointConsumptionEvent(amount, isUnholy);
            this._events.emit('prayerPointsUsed', event);
        }
    }

    public removeFromQuiver(qty: number) {
        Global.game.combat.stats.usedAmmo += qty;
    }

    public manualEat() {
        // don't eat at full health
        if (this.hitpoints >= this.stats.maxHitpoints) {
            return;
        }

        // don't eat if eating heals 0 hp
        const healAmt = this.getFoodHealing(this.food.currentSlot.item);

        if (healAmt <= 0) {
            return;
        }

        // eat without repercussions when enemy is spawning
        if (this.manager.spawnTimer.active) {
            this.eatFood();
            return;
        }

        // don't eat outside combat
        if (this.manager.paused) {
            return;
        }

        // check dotDamage
        const dotDamage = this.getMaxDotDamage();

        if (dotDamage >= this.hitpoints) {
            this.eatFood();
            return;
        }

        // check enemy damage
        const enemy = this.manager.enemy;
        // if enemy doesn't attack next turn, don't eat
        if (enemy.nextAction !== 'Attack') {
            return;
        }

        // number of ticks until the enemy attacks
        const tLeft = enemy.timers.act.ticksLeft;

        if (tLeft < 0) {
            return;
        }

        // max hit of the enemy attack + max dotDamage
        const maxDamage = enemy.getAttackMaxDamage(enemy.nextAttack) + dotDamage;

        // number of ticks required to heal to safety
        const healsReq = Math.ceil((maxDamage + 1 - this.hitpoints) / healAmt);

        // don't eat until we have to
        if (healsReq < tLeft) {
            return;
        }

        this.eatFood();
    }

    private getMaxDotDamage() {
        let dotDamage = 0;

        this.activeDOTs.forEach((dot: any) => {
            if (dot.type === 'Regen') {
                return;
            }

            dotDamage += dot.damage;
        });

        return dotDamage;
    }
}

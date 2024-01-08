export class SimEnemy extends Enemy {
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

    public render() {
        // how about no.
    }

    public computeModifiers() {
        // optimisation as the reset implemented in the game is not efficient.
        this.modifiers.reset = () => (this.modifiers = new CombatModifiers());

        super.computeModifiers();
    }

    public resetStateToDefault() {
        // optimisation as the reset implemented in the game is not efficient.
        this.modifiers.reset = () => (this.modifiers = new CombatModifiers());

        super.resetStateToDefault();
    }
}

export class SimPlayer extends Player {
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

    public render() {}
}

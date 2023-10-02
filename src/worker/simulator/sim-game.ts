import { SimClasses } from './sim-classes';
import type { SimManager } from './sim-manager';

export class SimGame extends Game {
    public declare combat: SimManager;

    constructor() {
        super();

        this.combat = new SimClasses.SimManager(this, this.registeredNamespaces.getNamespace('melvorD'));

        this.actions.registeredObjects.set(this.combat.namespace, this.combat);
        this.activeActions.registeredObjects.set(this.combat.namespace, this.combat);
        this.passiveActions.registeredObjects.set(this.combat.namespace, this.combat);

        this.detach();
    }

    public render() {
        // how about no.
    }

    public customGp = 0;

    private detach() {
        // @ts-ignore
        this.telemetry.ENABLE_TELEMETRY = false;
        this.tutorial.complete = true;

        this.petManager.unlockPet = () => {};
        this.bank.addItem = () => true;
        this.bank.hasItem = () => true;
        this.bank.getQty = () => 1e6;
        this.bank.checkForItems = () => true;
        this.completion.render = () => {};
        this.gp.render = () => {};
        this.slayerCoins.render = () => {};
        this.bank.render = () => {};
        this.combat.render = () => {};
        this.combat.enemy.render = () => {};
        this.combat.player.render = () => {};
        this.combat.player.equipment.render = () => {};
        this.combat.loot.render = () => {};
        this.shop.render = () => {};
        this.golbinRaid.render = () => {};
        this.golbinRaid.player.render = () => {};
        this.notifications.createErrorNotification = () => {};
        this.notifications.createGPNotification = () => {};
        this.notifications.createInfoNotification = () => {};
        this.notifications.createItemNotification = () => {};
        this.notifications.createMasteryLevelNotification = () => {};
        this.notifications.createSkillXPNotification = () => {};
        this.notifications.createSlayerCoinsNotification = () => {};
        this.notifications.createSuccessNotification = () => {};
        this.notifications.createSummoningMarkNotification = () => {};

        for (const skill of this.skills.allObjects) {
            // Make sure nothing gets called on skill level ups, it tends to try rendering
            skill.levelUp = () => {};
            skill.render = () => {};
        }

        this.gp.add = amount => {
            // Store gp on the SimPlayer
            this.customGp += amount;
        };
    }
}

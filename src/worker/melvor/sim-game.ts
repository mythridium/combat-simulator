import { SimClasses } from './sim-classes';
import type { SimCombatManager } from './sim-combat-manager';

export class SimGame extends Game {
    public declare combat: SimCombatManager;

    constructor() {
        super();

        this.combat = new SimClasses.SimCombatManager(this, this.registeredNamespaces.getNamespace('melvorD'));

        this.actions.registeredObjects.set(this.combat.namespace, this.combat);
        this.activeActions.registeredObjects.set(this.combat.namespace, this.combat);
        this.passiveActions.registeredObjects.set(this.combat.namespace, this.combat);

        this.combat.player.registerStatProvider(this.petManager);
        this.combat.player.registerStatProvider(this.shop);
        this.combat.player.registerStatProvider(this.potions);

        this.detach();
    }

    public render() {
        // how about no.
    }

    public scheduleSave() {}
    public autoSave() {}
    public updateRichPresence() {}
    public cloudUpdate() {}
    public gameInteractionUpdate() {}
    public onGameInteraction() {}
    public rollForAncientRelics() {}
    public unlockAncientRelicOnLevelUp() {}

    public postDataRegistration(): void {
        if (this.cartography) {
            // don't bother with map post data registration, leads to computing ui
            this.cartography.worldMaps.forEach(map => (map.postDataRegistration = () => {}));
        }

        super.postDataRegistration();
    }

    public onLoad() {
        this.astrology.computeProvidedStats(false);

        if (cloudManager.hasAoDEntitlement) {
            this.cartography.computeProvidedStats(false);
        }

        this.potions.computeProvidedStats(false);
        this.petManager.onLoad();
        this.shop.computeProvidedStats(false);
        this.combat.initialize();
    }

    private detach() {
        // @ts-ignore
        this.telemetry.ENABLE_TELEMETRY = false;
        this.tutorial.complete = true;
        this.settings.boolData.enableOfflineCombat.currentValue = true;

        this.township.confirmTownCreation = () => {};
        this.township.startTickTimer = () => {};
        this.township.onTickTimer = () => {};
        this.township.tick = () => true;
        this.township.tickSeason = () => {};
        this.township.tasks.updateAllTaskProgress = () => {};
        this.township.tasks.updateTaskProgress = () => {};
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
        this.stats.itemFindCount = () => 1;

        for (const skill of this.skills.allObjects) {
            // Make sure nothing gets called on skill level ups, it tends to try rendering
            skill.levelUp = () => {};
            skill.render = () => {};
            skill.onAncientRelicUnlock = () => {};
            skill.setUnlock(true);
            skill.setLevelCap(120);
        }
    }
}

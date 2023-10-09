import { Global } from 'src/worker/global';
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

    public clearActiveAction(): void {
        if (!this.disableClearOffline) {
            this.activeAction = undefined;
        }
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
            this.cartography.postDataRegistration = () => {};
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

        this.gp.add = amount => (this.combat.stats.gp += amount);

        this.slayerCoins.add = amount => {
            const modifier = this.modifiers.increasedSlayerCoins - this.modifiers.decreasedSlayerCoins;
            amount = applyModifier(amount, modifier, 0);

            this.combat.stats.sc += amount;
        };

        this.bank.removeItemQuantity = (item: AnyItem, quantity: number) => {
            switch (item.type) {
                case 'Potion':
                    this.combat.stats.usedPotions += quantity;
                    break;
                case 'Rune':
                    if (this.combat.stats.usedRunes[item.id] === undefined) {
                        this.combat.stats.usedRunes[item.id] = 0;
                    }

                    this.combat.stats.usedRunes[item.id] += quantity;
                    break;
            }
        };

        this.summoning.isSynergyUnlocked = () => {
            return Global.configuration.state.isSynergyEnabled;
        };

        for (const set of this.combat.player.equipmentSets) {
            set.equipment.removeQuantityFromSlot = (slot: SlotTypes, quantity: number) => {
                switch (slot) {
                    case 'Summon1':
                        this.combat.stats.usedCharges.summon1 += quantity;
                        break;
                    case 'Summon2':
                        this.combat.stats.usedCharges.summon2 += quantity;
                        break;
                    case 'Consumable':
                        this.combat.stats.usedConsumabes += quantity;
                        break;
                }
                return false;
            };
        }
    }
}

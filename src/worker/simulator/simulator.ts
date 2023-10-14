import { SummaryStore } from 'src/shared/stores/summary.store';
import { Environment } from './environment';
import { Messages } from 'src/shared/messages/messages';
import { MessageAction } from 'src/shared/messages/message';
import { Source } from 'src/shared/stores/sync.store';
import { InitRequest } from 'src/shared/messages/message-type/init';
import { Global } from 'src/worker/global';

export class Simulator {
    public readonly summaryStore = new SummaryStore();

    private readonly environment = new Environment();

    constructor(private readonly messages: Messages) {}

    public async init(data: InitRequest) {
        await this.environment.init(data);

        this.messages.on(MessageAction.State, async data => {
            if (data.configuration) {
                Global.configuration.setState(Source.Interface, data.configuration);

                Global.game.shop.upgradesPurchased.clear();
                this.updateAutoEatTier();

                const attackStyle = Global.game.attackStyles.find(
                    attackStyle => attackStyle.id === data.configuration.attackStyle
                );

                if (attackStyle) {
                    Global.game.combat.player.setAttackStyle(attackStyle.attackType, attackStyle);
                }
            }

            if (data.equipment) {
                Global.equipment.setState(Source.Interface, data.equipment);

                Global.game.combat.player.equipment.unequipAll();
                Global.game.combat.player.food.unequipSelected();

                for (const equipment of data.equipment.equipment) {
                    const item = Global.game.items.equipment.getObjectByID(equipment.id);
                    Global.game.combat.player.equipment.equipItem(item, equipment.slot, 1);
                }

                const food = Global.game.items.food.getObjectByID(Global.equipment.state.food);

                if (food) {
                    Global.game.combat.player.equipFood(food, 1);
                }
            }

            return this.summary();
        });

        this.messages.on(MessageAction.Simulate, async data => {
            try {
                const result = await Global.game.combat.simulate(data);

                return result;
            } catch (exception) {
                Global.logger.error(exception);

                return {
                    isSuccess: false,
                    error: exception?.message ?? 'Unknown error occurred during simulation.',
                    stats: Global.game.combat.stats
                };
            }
        });
    }

    private summary() {
        this.compute();

        const stats = Global.game.combat.player.stats;

        this.summaryStore.setState(Source.Worker, {
            attackInterval: stats.attackInterval,
            accuracy: stats.accuracy,
            damageReduction: stats.damageReduction,
            uncappedDamageReduction:
                Global.game.combat.player.equipmentStats.damageReduction +
                Global.game.combat.player.modifiers.increasedDamageReduction -
                Global.game.combat.player.modifiers.decreasedDamageReduction,
            evasion: {
                melee: stats.evasion.melee,
                ranged: stats.evasion.ranged,
                magic: stats.evasion.magic
            },
            maxHitpoints: stats.maxHitpoints,
            maxHit: stats.maxHit,
            minHit: stats.minHit,
            summoningMaxHit: stats.summoningMaxHit,
            barrierMaxHit: this.applySummonDamageModifiers(stats.summoningMaxHit),
            autoEatThreshold: Global.game.combat.player.autoEatThreshold,
            dropDoublingPercentage: Global.game.combat.player.modifiers.combatLootDoubleChance,
            gpMultiplier: Global.game.combat.player.modifiers.increasedCombatGP
        });

        return this.summaryStore.getState();
    }

    private compute() {
        Global.game.shop.computeProvidedStats();
        Global.game.potions.computeProvidedStats();
        Global.game.petManager.computeProvidedStats();
        Global.game.combat.player.computeAllStats();
    }

    private applySummonDamageModifiers(damage: number) {
        let modifier = Global.game.combat.player.modifiers.increasedBarrierSummonDamage;

        if (Global.game.combat.onSlayerTask) {
            modifier += Global.game.combat.player.modifiers.increasedBarrierSummonDamageIfSlayerTask;
        }

        damage *= 1 + modifier / 100;

        let flatBonus = Global.game.combat.player.modifiers.increasedFlatBarrierSummonDamage;
        switch (Global.game.combat.player.attackType) {
            case 'melee':
                flatBonus += Global.game.combat.player.modifiers.increasedFlatBarrierSummonDamageMelee;
                break;
            case 'ranged':
                flatBonus += Global.game.combat.player.modifiers.increasedFlatBarrierSummonDamageRanged;
                break;
            case 'magic':
                flatBonus += Global.game.combat.player.modifiers.increasedFlatBarrierSummonDamageMagic;
                break;
        }

        damage += flatBonus * numberMultiplier;

        return Math.floor(damage);
    }

    private updateAutoEatTier() {
        let autoEatTier = -1;

        try {
            autoEatTier = parseInt(Global.configuration.state.autoEatTier, 10);
        } catch {}

        if (autoEatTier === -1) {
            return;
        }

        Global.game.shop.purchases
            .filter(purchase => purchase.id.includes('Auto_Eat'))
            .forEach((purchase, index) => {
                if (index <= autoEatTier) {
                    Global.game.shop.upgradesPurchased.set(purchase, 1);
                }
            });
    }
}

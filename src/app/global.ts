import { EquipmentStore } from 'src/shared/stores/equipment.store';
import { SummaryStore } from 'src/shared/stores/summary.store';
import { SimulationStore } from 'src/app/stores/simulation.store';
import { Color, Logger } from 'src/shared/logger';
import { ConfigurationStore } from 'src/shared/stores/configuration.store';
import { WorkersStore } from './stores/workers.store';
import { InterfaceStore } from './stores/interface.store';
import { EquipmentCategories } from './modules/equipment-categories';
import { SelectedBarStore } from './stores/selected-bar.store';

export abstract class Global {
    public static context: Modding.ModContext;
    public static logger = new Logger('Client', Color.Green);
    public static workers = new WorkersStore();
    public static interface = new InterfaceStore();
    public static summary = new SummaryStore();
    public static configuration = new ConfigurationStore();
    public static equipment = new EquipmentStore();
    public static simulation = new SimulationStore();
    public static information = new SelectedBarStore();

    public static equipmentCategories: EquipmentCategories;

    public static emptyEquipmentId = 'melvorD:Empty_Equipment';
    public static emptyFoodId = 'melvorD:Empty_Food';

    public static createItemInformationTooltip(item: AnyItem) {
        let potionCharges = '',
            description = '',
            spec = '',
            hp = '',
            passive = '',
            html = '',
            baseStats = '';

        if (item instanceof EquipmentItem) {
            spec = getItemSpecialAttackInformation(item);
            baseStats = getItemBaseStatsBreakdown(item);
        }

        if (item instanceof PotionItem) {
            potionCharges = `<small class='text-warning'>${templateString(getLangString('MENU_TEXT_POTION_CHARGES'), {
                charges: `${item.charges}`
            })}</small><br>`;
        }

        let itemDesc = item.modifiedDescription;

        if (item instanceof EquipmentItem) {
            itemDesc += getSummonMaxHitItemDescription(item);
        }

        if (item.hasDescription || item.isArtefact) {
            description += `<small class='text-info'>${itemDesc}</small><br>`;
        }

        if (item instanceof FoodItem) {
            hp = `<img class='skill-icon-xs ml-2' src='${
                game.hitpoints.media
            }'><span class='text-success'>+${numberWithCommas(this.getFoodHealing(item))}</span>`;
        }

        if (
            item instanceof EquipmentItem &&
            item.validSlots.includes('Passive') &&
            game.combat.player.isEquipmentSlotUnlocked('Passive')
        ) {
            passive =
                '<br><small class="text-success">' + getLangString('MENU_TEXT_PASSIVE_SLOT_COMPATIBLE') + '</small>';
        }

        html += `<div class="text-center">
                    <div class="media d-flex align-items-center push">
                        <div class="mr-3">
                            <img class="bank-img m-1" src="${item.media}">
                        </div>
                        <div class="media-body">
                            <div class="font-w600">${item.name}</div>
                            ${potionCharges}
                            ${description}
                            ${spec}
                            <div class="font-size-sm">
                                ${hp}
                                ${passive}
                            </div>
                            ${baseStats}
                        </div>
                    </div>
                </div>`;

        return html;
    }

    public static getFoodHealing(item: FoodItem) {
        const gamemode = game.gamemodes.getObjectByID(Global.configuration.state.gamemode);
        const value = item.healsFor * gamemode?.hitpointMultiplier ?? numberMultiplier;

        let bonus = 0;

        if (Global.configuration.state.cookingMastery) {
            bonus += 20;
        }

        if (Global.configuration.state.cookingPool) {
            bonus += 10;
        }

        return applyModifier(value, bonus);
    }
}

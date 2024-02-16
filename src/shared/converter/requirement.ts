import type { SimGame } from 'src/shared/simulator/sim-game';

export abstract class RequirementConverter {
    public static toData(requirements: AnyRequirement[]) {
        const data: AnyRequirementData[] = [];

        for (const requirement of requirements) {
            let converted: AnyRequirementData;

            switch (requirement.type) {
                case 'AllSkillLevels':
                    converted = {
                        type: requirement.type,
                        level: requirement.level,
                        exceptions: Array.from(requirement.exceptions?.values() ?? []).map(exception => exception.id),
                        namespace: requirement.namespace?.name
                    };
                    break;
                case 'SkillLevel':
                    converted = {
                        type: requirement.type,
                        skillID: requirement.skill.id,
                        level: requirement.level
                    };
                    break;
                case 'SlayerItem':
                    converted = {
                        type: requirement.type,
                        itemID: requirement.item.id
                    };
                    break;
                case 'SlayerTask':
                    converted = {
                        type: requirement.type,
                        tier: SlayerTierID[requirement.tier] as SlayerTier,
                        count: requirement.count
                    };
                    break;
                case 'TownshipTask':
                    converted = {
                        type: requirement.type,
                        count: requirement.count
                    };
                    break;
                case 'TownshipBuilding':
                    converted = {
                        type: requirement.type,
                        buildingID: requirement.building.id,
                        count: requirement.count
                    };
                    break;
                case 'TownshipTutorialTask':
                    converted = {
                        type: requirement.type,
                        count: requirement.count
                    };
                    break;
                case 'DungeonCompletion':
                    converted = {
                        type: requirement.type,
                        dungeonID: requirement.dungeon.id,
                        count: requirement.count
                    };
                    break;
                case 'ItemFound':
                    converted = {
                        type: requirement.type,
                        itemID: requirement.item.id
                    };
                    break;
                case 'MonsterKilled':
                    converted = {
                        type: requirement.type,
                        monsterID: requirement.monster.id,
                        count: requirement.count
                    };
                    break;
                case 'Completion':
                    converted = {
                        type: requirement.type,
                        percent: requirement.percent,
                        namespace: requirement.namespace.name
                    };
                    break;
                case 'ShopPurchase':
                    converted = {
                        type: requirement.type,
                        purchaseID: requirement.purchase.id,
                        count: requirement.count
                    };
                    break;
                case 'ArchaeologyItemsDonated':
                    converted = {
                        type: requirement.type,
                        count: requirement.count
                    };
                    break;
                case 'CartographyHexDiscovery':
                    converted = {
                        type: requirement.type,
                        worldMapID: requirement.worldMap.id,
                        count: requirement.count
                    };
                    break;
                case 'CartographyPOIDiscovery':
                    converted = {
                        type: requirement.type,
                        worldMapID: requirement.worldMap.id,
                        poiIDs: requirement.pois.map(poi => poi.id)
                    };
                    break;
                default:
                    throw new Error(`Could not locate converter for requirement of '${(<any>requirement).type}'`);
            }

            data.push(converted);
        }

        return data;
    }

    public static fromData(game: SimGame, requirements: AnyRequirementData[]) {
        return game.getRequirementsFromData(requirements);
    }
}

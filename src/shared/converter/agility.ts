import type { SimGame } from 'src/shared/simulator/sim-game';

export interface AgilityObstacleConvertedData {
    namespace: DataNamespace;
    obstacle: AgilityObstacleData;
}

export interface BaseAgilityObjectConvertedData {
    namespace: DataNamespace;
    pillar: BaseAgilityObjectData;
}

export interface AgilityConvertedData {
    obstacles: AgilityObstacleConvertedData[];
    pillars: BaseAgilityObjectConvertedData[];
    elitePillars: BaseAgilityObjectConvertedData[];
}

export abstract class AgilityConverter {
    public static toData(
        obstacles: AgilityObstacle[],
        pillars: AgilityPillar[],
        elitePillars: AgilityPillar[]
    ): AgilityConvertedData {
        return {
            obstacles: obstacles.map(obstacle => ({
                namespace: obstacle._namespace,
                obstacle: {
                    id: obstacle._localID,
                    name: obstacle._name,
                    media: obstacle._media,
                    category: obstacle.category,
                    baseInterval: obstacle.baseInterval,
                    skillRequirements: obstacle.skillRequirements.map(map => ({
                        type: map.type,
                        skillID: map.skill.id,
                        level: map.level
                    })),
                    baseExperience: obstacle.baseExperience,
                    gpReward: obstacle.gpReward,
                    scReward: obstacle.scReward,
                    itemRewards: obstacle.itemRewards.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    itemCosts: obstacle.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    gpCost: obstacle.gpCost,
                    scCost: obstacle.scCost,
                    modifiers: this.getModifiers(game.agility.getObstacleModifiers(obstacle))
                }
            })),
            pillars: pillars.map(pillar => ({
                namespace: pillar._namespace,
                pillar: {
                    id: pillar._localID,
                    name: pillar._name,
                    itemCosts: pillar.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    gpCost: pillar.gpCost,
                    scCost: pillar.scCost,
                    modifiers: this.getModifiers(game.agility.getPillarModifiers(pillar))
                }
            })),
            elitePillars: elitePillars.map(pillar => ({
                namespace: pillar._namespace,
                pillar: {
                    id: pillar._localID,
                    name: pillar._name,
                    itemCosts: pillar.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    gpCost: pillar.gpCost,
                    scCost: pillar.scCost,
                    modifiers: this.getModifiers(game.agility.getPillarModifiers(pillar))
                }
            }))
        };
    }

    public static fromData(
        game: SimGame,
        obstacles: AgilityObstacleConvertedData[],
        pillars: BaseAgilityObjectConvertedData[],
        elitePillars: BaseAgilityObjectConvertedData[]
    ) {
        return {
            obstacles: obstacles.map(map => new AgilityObstacle(map.namespace, map.obstacle, game)),
            pillars: pillars.map(map => new AgilityPillar(map.namespace, map.pillar, game)),
            elitePillars: elitePillars.map(map => new AgilityPillar(map.namespace, map.pillar, game))
        };
    }

    private static getModifiers(modifiers: MappedModifiers) {
        const modifierObject: Partial<ModifierObject<SkillModifierData[], number>> = {};

        Array.from(modifiers.standardModifiers.entries()).forEach(modifier => {
            modifierObject[modifier[0]] = modifier[1];
        });

        Array.from(modifiers.skillModifiers.entries()).forEach(modifier => {
            modifierObject[modifier[0]] = Array.from(modifier[1].entries()).map(
                ([skill, value]) => ({ skillID: skill.id, value: value } as SkillModifierData)
            );
        });

        return modifierObject;
    }
}

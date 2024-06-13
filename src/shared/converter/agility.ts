import type { SimGame } from 'src/shared/simulator/sim-game';
import { ModifierConverter } from './modifier';

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
}

export abstract class AgilityConverter {
    public static toData(obstacles: AgilityObstacle[], pillars: AgilityPillar[]): AgilityConvertedData {
        return {
            // @ts-ignore // TODO: TYPES
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
                    // @ts-ignore // TODO: TYPES
                    currencyRewards: obstacle.currencyRewards.map(map => ({
                        id: map.currency.id,
                        quantity: map.quantity
                    })),
                    itemCosts: obstacle.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    // @ts-ignore // TODO: TYPES
                    currencyCosts: obstacle.currencyCosts.map(map => ({ id: map.currency.id, quantity: map.quantity })),
                    // @ts-ignore // TODO: TYPES
                    realm: obstacle.realm?.id,
                    // @ts-ignore // TODO: TYPES
                    modifiers: ModifierConverter.toData(obstacle.modifiers),
                    // @ts-ignore // TODO: TYPES
                    enemyModifiers: ModifierConverter.toData(obstacle.enemyModifiers),
                    // @ts-ignore // TODO: TYPES
                    conditionalModifiers: ModifierConverter.toData(obstacle.conditionalModifiers),
                    // @ts-ignore // TODO: TYPES
                    // @ts-ignore // TODO: TYPES
                    combatEffects: obstacle.combatEffects?.map(effect => ({
                        appliesWhen: effect.appliesWhen,
                        descriptionLang: effect._descriptionLang,
                        effectID: effect.effect.id
                    }))
                }
            })),
            // @ts-ignore // TODO: TYPES
            pillars: pillars.map(pillar => ({
                namespace: pillar._namespace,
                pillar: {
                    id: pillar._localID,
                    name: pillar._name,
                    // @ts-ignore // TODO: TYPES
                    slot: pillar.category,
                    itemCosts: pillar.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    // @ts-ignore // TODO: TYPES
                    currencyCosts: pillar.currencyCosts.map(map => ({ id: map.currency.id, quantity: map.quantity })),
                    // @ts-ignore // TODO: TYPES
                    realm: pillar.realm?.id,
                    // @ts-ignore // TODO: TYPES
                    modifiers: ModifierConverter.toData(pillar.modifiers),
                    // @ts-ignore // TODO: TYPES
                    enemyModifiers: ModifierConverter.toData(pillar.enemyModifiers),
                    // @ts-ignore // TODO: TYPES
                    conditionalModifiers: ModifierConverter.toData(pillar.conditionalModifiers),
                    // @ts-ignore // TODO: TYPES
                    combatEffects: pillar.combatEffects?.map(effect => ({
                        appliesWhen: effect.appliesWhen,
                        descriptionLang: effect._descriptionLang,
                        effectID: effect.effect.id
                    }))
                }
            }))
        };
    }

    public static fromData(
        game: SimGame,
        obstacles: AgilityObstacleConvertedData[],
        pillars: BaseAgilityObjectConvertedData[]
    ) {
        return {
            obstacles: obstacles.map(map => {
                const obstacle = new AgilityObstacle(map.namespace, map.obstacle, game);

                // @ts-ignore // TODO: TYPES
                obstacle.registerSoftDependencies(map.obstacle, game);

                return obstacle;
            }),
            pillars: pillars.map(map => {
                const pillar = new AgilityPillar(map.namespace, map.pillar, game);

                // @ts-ignore // TODO: TYPES
                pillar.registerSoftDependencies(map.pillar, game);

                return pillar;
            })
        };
    }
}

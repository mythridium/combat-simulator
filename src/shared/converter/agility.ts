import type { SimGame } from 'src/shared/simulator/sim-game';
import { ModifierConverter } from './modifier';

export interface AgilityObstacleConvertedData {
    namespace: DataNamespace;
    obstacle: AgilityObstacleData;
}

export interface BaseAgilityObjectConvertedData {
    namespace: DataNamespace;
    pillar: AgilityPillarData;
}

export interface AgilityConvertedData {
    obstacles: AgilityObstacleConvertedData[];
    pillars: BaseAgilityObjectConvertedData[];
}

export abstract class AgilityConverter {
    public static toData(obstacles: AgilityObstacle[], pillars: AgilityPillar[]): AgilityConvertedData {
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
                    itemRewards: obstacle.itemRewards.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    currencyRewards: obstacle.currencyRewards.map(map => ({
                        id: map.currency.id,
                        quantity: map.quantity
                    })),
                    itemCosts: obstacle.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    currencyCosts: obstacle.currencyCosts.map(map => ({ id: map.currency.id, quantity: map.quantity })),
                    realm: obstacle.realm?.id,
                    modifiers: ModifierConverter.toData(obstacle.modifiers),
                    enemyModifiers: ModifierConverter.toData(obstacle.enemyModifiers),
                    combatEffects: obstacle.combatEffects?.map(effect => ({
                        appliesWhen: effect.appliesWhen,
                        descriptionLang: effect._descriptionLang,
                        // @ts-ignore // TODO: TYPES
                        effectID: effect.effect.id
                    }))
                }
            })),
            pillars: pillars.map(pillar => ({
                namespace: pillar._namespace,
                pillar: {
                    id: pillar._localID,
                    name: pillar._name,
                    slot: pillar.category,
                    itemCosts: pillar.itemCosts.map(map => ({ id: map.item.id, quantity: map.quantity })),
                    currencyCosts: pillar.currencyCosts.map(map => ({ id: map.currency.id, quantity: map.quantity })),
                    realm: pillar.realm?.id,
                    modifiers: ModifierConverter.toData(pillar.modifiers),
                    enemyModifiers: ModifierConverter.toData(pillar.enemyModifiers),
                    combatEffects: pillar.combatEffects?.map(effect => ({
                        appliesWhen: effect.appliesWhen,
                        descriptionLang: effect._descriptionLang,
                        // @ts-ignore // TODO: TYPES
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

                obstacle.registerSoftDependencies(map.obstacle, game);

                return obstacle;
            }),
            pillars: pillars.map(map => {
                const pillar = new AgilityPillar(map.namespace, map.pillar, game);

                pillar.registerSoftDependencies(map.pillar, game);

                return pillar;
            })
        };
    }
}

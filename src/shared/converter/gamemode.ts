import type { SimGame } from 'src/shared/simulator/sim-game';
import { ModifierConverter } from './modifier';

export interface GamemodeConvertedData {
    namespace: DataNamespace;
    gamemode: GamemodeData;
}

export abstract class GamemodeConverter {
    public static toData(gamemode: Gamemode): GamemodeConvertedData {
        const data: GamemodeData = {
            id: gamemode._localID,
            name: gamemode._name,
            media: gamemode._media,
            description: gamemode._description,
            rules: gamemode._rules,
            textClass: gamemode.textClass,
            btnClass: gamemode.btnClass,
            isPermaDeath: gamemode.isPermaDeath,
            isEvent: gamemode.isEvent,
            startDate: gamemode.startDate,
            endDate: gamemode.endDate,
            combatTriangle: gamemode._combatTriangle,
            hitpointMultiplier: gamemode.hitpointMultiplier,
            overrideMaxHitpoints: gamemode.overrideMaxHitpoints,
            hasRegen: gamemode.hasRegen,
            capNonCombatSkillLevels: gamemode.capNonCombatSkillLevels,
            startingPage: gamemode.startingPage.id,
            startingItems: gamemode.startingItems.map(map => ({ id: map.item.id, quantity: map.quantity })),
            allowSkillUnlock: gamemode.allowSkillUnlock,
            startingSkills: Array.from(gamemode.startingSkills?.values() ?? []).map(skill => skill.id),
            skillUnlockCost: gamemode.skillUnlockCost,
            playerModifiers: ModifierConverter.toData(gamemode.playerModifiers),
            enemyModifiers: ModifierConverter.toData(gamemode.enemyModifiers),
            playerCombatEffects: gamemode.playerCombatEffects?.map(effect => ({
                appliesWhen: effect.appliesWhen,
                descriptionLang: effect._descriptionLang,
                // @ts-ignore // TODO: TYPES
                effectID: effect.effect.id
            })),
            enemyCombatEffects: gamemode.enemyCombatEffects?.map(effect => ({
                appliesWhen: effect.appliesWhen,
                descriptionLang: effect._descriptionLang,
                // @ts-ignore // TODO: TYPES
                effectID: effect.effect.id
            })),
            disabledModifiers: gamemode.disabledModifiers.map(modifier => modifier.id),
            hasTutorial: gamemode.hasTutorial,
            defaultInitialLevelCap: gamemode.defaultInitialLevelCap,
            initialLevelCaps: gamemode.initialLevelCaps?.map(cap => ({ skillID: cap.skill.id, value: cap.value })),
            defaultInitialAbyssalLevelCap: gamemode.defaultInitialAbyssalLevelCap,
            initialAbyssalLevelCaps: gamemode.initialAbyssalLevelCaps?.map(cap => ({
                skillID: cap.skill.id,
                value: cap.value
            })),
            levelCapIncreases: gamemode.levelCapIncreases.map(levelCapIncrease => levelCapIncrease.id),
            levelCapCost: this.toLevelCapCost(gamemode.levelCapCost),
            abyssalLevelCapCost: this.toLevelCapCost(gamemode.abyssalLevelCapCost),
            allowXPOverLevelCap: gamemode.allowXPOverLevelCap,
            disablePreservation: gamemode.disablePreservation,
            disableItemDoubling: gamemode.disableItemDoubling,
            hasActiveGameplay: gamemode.hasActiveGameplay,
            allowAncientRelicDrops: gamemode.allowAncientRelicDrops,
            pre99RollConversion: gamemode.pre99RollConversion?.id,
            post99RollConversion: gamemode.post99RollConversion?.id,
            enemyPassives: gamemode.enemyPassives?.map(passive => passive.id),
            enemySpecialAttacks: gamemode.enemySpecialAttacks?.map(special => special.attack.id),
            requireLocalStorageKey: gamemode.requireLocalStorageKey,
            enableInstantActions: gamemode.enableInstantActions,
            enabledLangs: gamemode.enabledLangs,
            useDefaultSkillUnlockRequirements: gamemode.useDefaultSkillUnlockRequirements
        };

        return { namespace: gamemode._namespace, gamemode: data };
    }

    public static fromData(game: SimGame, { namespace, gamemode }: GamemodeConvertedData) {
        const gm = new Gamemode(namespace, gamemode, game);

        gm.registerSoftDependencies(gamemode, game);

        return gm;
    }

    private static toLevelCapCost(
        levelCapCost: LevelCapIncreaseCost | undefined
    ): LevelCapIncreaseCostData | undefined {
        if (!levelCapCost) {
            return;
        }

        return {
            increase: levelCapCost.increase,
            baseCost: {
                currencies: levelCapCost.baseCost.currencies?.map(currency => ({
                    id: currency.currency.id,
                    quantity: currency.quantity
                })),
                items: levelCapCost.baseCost.items?.map(item => ({
                    id: item.item.id,
                    quantity: item.quantity
                }))
            },
            scalingFactor: levelCapCost.scalingFactor,
            maxCostScaling: levelCapCost.maxCostScaling,
            skillLevelGates: levelCapCost.skillLevelGates.map(skill => skill.id)
        };
    }
}

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
            // @ts-ignore // TODO: TYPES
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
            // @ts-ignore // TODO: TYPES
            playerModifiers: ModifierConverter.toData(gamemode.playerModifiers),
            // @ts-ignore // TODO: TYPES
            enemyModifiers: ModifierConverter.toData(gamemode.enemyModifiers),
            // @ts-ignore // TODO: TYPES
            disabledModifiers: gamemode.disabledModifiers.map(modifier => modifier.id),
            hasTutorial: gamemode.hasTutorial,
            // @ts-ignore // TODO: TYPES
            initialLevelCap: gamemode.initialLevelCap,
            // @ts-ignore // TODO: TYPES
            initialAbyssalLevelCap: gamemode.initialAbyssalLevelCap,
            // @ts-ignore // TODO: TYPES
            levelCapIncreases: gamemode.levelCapIncreases.map(levelCapIncrease => levelCapIncrease.id),
            disablePreservation: gamemode.disablePreservation,
            disableItemDoubling: gamemode.disableItemDoubling,
            hasActiveGameplay: gamemode.hasActiveGameplay,
            allowAncientRelicDrops: gamemode.allowAncientRelicDrops,
            skillCapIncreasesPre99: gamemode.skillCapIncreasesPre99,
            skillCapIncreasesPost99: gamemode.skillCapIncreasesPost99,
            // @ts-ignore // TODO: TYPES
            pre99RollConversion: gamemode.pre99RollConversion?.id,
            // @ts-ignore // TODO: TYPES
            post99RollConversion: gamemode.post99RollConversion?.id,
            autoLevelSkillsPre99: gamemode.autoLevelSkillsPre99?.map(map => ({
                skillID: map.skill.id,
                value: map.value
            })),
            autoLevelSkillsPost99: gamemode.autoLevelSkillsPost99?.map(map => ({
                skillID: map.skill.id,
                value: map.value
            })),
            skillCapRollsPre99: gamemode.skillCapRollsPre99?.map(map => ({ skillID: map.skill.id, value: map.value })),
            skillCapRollsPost99: gamemode.skillCapRollsPost99?.map(map => ({
                skillID: map.skill.id,
                value: map.value
            })),
            enemyPassives: gamemode.enemyPassives?.map(passive => passive.id),
            enemySpecialAttacks: gamemode.enemySpecialAttacks?.map(special => special.attack.id),
            requireLocalStorageKey: gamemode.requireLocalStorageKey
        };

        return { namespace: gamemode._namespace, gamemode: data };
    }

    public static fromData(game: SimGame, { namespace, gamemode }: GamemodeConvertedData) {
        const gm = new Gamemode(namespace, gamemode, game);

        // @ts-ignore // TODO: TYPES
        gm.registerSoftDependencies(gamemode, game);

        return gm;
    }
}

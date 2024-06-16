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
            disabledModifiers: gamemode.disabledModifiers.map(modifier => modifier.id),
            hasTutorial: gamemode.hasTutorial,
            initialLevelCaps: gamemode.initialLevelCaps?.map(cap => ({ skillID: cap.skill.id, value: cap.value })),
            initialAbyssalLevelCaps: gamemode.initialAbyssalLevelCaps?.map(cap => ({
                skillID: cap.skill.id,
                value: cap.value
            })),
            levelCapIncreases: gamemode.levelCapIncreases.map(levelCapIncrease => levelCapIncrease.id),
            disablePreservation: gamemode.disablePreservation,
            disableItemDoubling: gamemode.disableItemDoubling,
            hasActiveGameplay: gamemode.hasActiveGameplay,
            allowAncientRelicDrops: gamemode.allowAncientRelicDrops,
            pre99RollConversion: gamemode.pre99RollConversion?.id,
            post99RollConversion: gamemode.post99RollConversion?.id,
            enemyPassives: gamemode.enemyPassives?.map(passive => passive.id),
            enemySpecialAttacks: gamemode.enemySpecialAttacks?.map(special => special.attack.id),
            requireLocalStorageKey: gamemode.requireLocalStorageKey
        };

        return { namespace: gamemode._namespace, gamemode: data };
    }

    public static fromData(game: SimGame, { namespace, gamemode }: GamemodeConvertedData) {
        const gm = new Gamemode(namespace, gamemode, game);

        gm.registerSoftDependencies(gamemode, game);

        return gm;
    }
}

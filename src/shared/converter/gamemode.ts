import type { SimGame } from 'src/shared/simulator/sim-game';

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
            combatTriangle: this.getCombatTriangle(gamemode),
            hitpointMultiplier: gamemode.hitpointMultiplier,
            overrideMaxHitpoints: gamemode.overrideMaxHitpoints,
            hasRegen: gamemode.hasRegen,
            capNonCombatSkillLevels: gamemode.capNonCombatSkillLevels,
            startingPage: gamemode.startingPage.id,
            startingItems: gamemode.startingItems.map(map => ({ id: map.item.id, quantity: map.quantity })),
            allowSkillUnlock: gamemode.allowSkillUnlock,
            startingSkills: Array.from(gamemode.startingSkills?.values() ?? []).map(skill => skill.id),
            skillUnlockCost: gamemode.skillUnlockCost,
            playerModifiers: this.getModifiers(gamemode.playerModifiers),
            enemyModifiers: gamemode.enemyModifiers,
            disabledModifiers: gamemode.disabledModifiers,
            hasTutorial: gamemode.hasTutorial,
            overrideLevelCap: gamemode.overrideLevelCap,
            allowDungeonLevelCapIncrease: gamemode.allowDungeonLevelCapIncrease,
            allowXPOverLevelCap: gamemode.allowXPOverLevelCap,
            disablePreservation: gamemode.disablePreservation,
            disableItemDoubling: gamemode.disableItemDoubling,
            hasActiveGameplay: gamemode.hasActiveGameplay,
            allowAncientRelicDrops: gamemode.allowAncientRelicDrops,
            skillCapIncreasesPre99: gamemode.skillCapIncreasesPre99,
            skillCapIncreasesPost99: gamemode.skillCapIncreasesPost99,
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
        return new Gamemode(namespace, gamemode, game);
    }

    private static getCombatTriangle(gamemode: Gamemode) {
        const combatTriangle = Object.entries(COMBAT_TRIANGLE_IDS).find(
            entry => entry[1] === gamemode._combatTriangle
        ) as [CombatTriangleType, CombatTriangles];

        return combatTriangle ? combatTriangle[0] : 'Standard';
    }

    private static getModifiers(modifiers: Partial<ModifierObject<SkillModifier[], number>>) {
        const modifierObject: Partial<ModifierObject<SkillModifierData[], number>> = {};

        Object.entries(modifiers).forEach(modifier => {
            modifierObject[modifier[0]] = (
                Array.isArray(modifier[1])
                    ? modifier[1].map(map => ({ skillID: map.skill.id, value: map.value } as SkillModifierData))
                    : modifier[1]
            ) as number & SkillModifierData[];
        });

        return modifierObject;
    }
}

import type { SimGame } from 'src/shared/simulator/sim-game';
import { ModifierConverter } from './modifier';
import { Global } from 'src/shared/global';

export interface GamemodeConvertedData {
    namespace: DataNamespace;
    gamemode: GamemodeData;
}

export interface GamemodeModifiedData {
    id: string;
    isPermaDeath: boolean;
    hitpointMultiplier: number;
    overrideMaxHitpoints: number;
    hasRegen: boolean;
    disablePreservation: boolean;
    disableItemDoubling: boolean;
    allowAncientRelicDrops: boolean;
    enableInstantActions: boolean;
    playerModifiers: ModifierValuesRecordData;
    enemyModifiers: ModifierValuesRecordData;
    playerCombatEffects: TriggeredCombatEffectApplicatorData[];
    enemyCombatEffects: TriggeredCombatEffectApplicatorData[];
    disabledModifiers: string[];
    enemyPassives: string[];
    enemySpecialAttacks: string[];
}

export abstract class GamemodeConverter {
    public static get(gamemode: Gamemode): GamemodeModifiedData {
        return {
            id: gamemode.id,
            isPermaDeath: gamemode.isPermaDeath,
            hitpointMultiplier: gamemode.hitpointMultiplier,
            overrideMaxHitpoints: gamemode.overrideMaxHitpoints,
            hasRegen: gamemode.hasRegen,
            disablePreservation: gamemode.disablePreservation,
            disableItemDoubling: gamemode.disableItemDoubling,
            allowAncientRelicDrops: gamemode.allowAncientRelicDrops,
            enableInstantActions: gamemode.enableInstantActions,
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
            disabledModifiers: gamemode.disabledModifiers?.map(modifier => modifier.id),
            enemyPassives: gamemode.enemyPassives?.map(passive => passive.id),
            enemySpecialAttacks: gamemode.enemySpecialAttacks?.map(special => special.attack?.id)
        };
    }

    public static set(game: Game, gamemode: Gamemode, data: GamemodeModifiedData) {
        gamemode.isPermaDeath = data.isPermaDeath;
        gamemode.hitpointMultiplier = data.hitpointMultiplier;
        gamemode.overrideMaxHitpoints = data.overrideMaxHitpoints;
        gamemode.hasRegen = data.hasRegen;
        gamemode.disablePreservation = data.disablePreservation;
        gamemode.disableItemDoubling = data.disableItemDoubling;
        gamemode.allowAncientRelicDrops = data.allowAncientRelicDrops;
        gamemode.enableInstantActions = data.enableInstantActions;

        gamemode.disabledModifiers = [];

        if (data.disabledModifiers?.length) {
            for (const disabledModifier of data.disabledModifiers) {
                try {
                    const id = Modifier.getIdFromKey(disabledModifier);
                    const modifier = game.modifierRegistry.getObjectByID(id);

                    if (modifier !== undefined) {
                        gamemode.disabledModifiers.push(modifier);
                    }
                } catch (error) {
                    Global.get.logger.error(
                        `Failed to construct disabled modifier. '${gamemode.id}' - '${disabledModifier}'`,
                        error
                    );
                }
            }
        }

        try {
            if (data.enemyPassives?.length) {
                gamemode.enemyPassives = game.combatPassives.getArrayFromIds(data.enemyPassives);
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode enemy passives. '${gamemode.id}'`, error);
        }

        try {
            if (data.enemySpecialAttacks?.length) {
                gamemode.enemySpecialAttacks = data.enemySpecialAttacks.map(attackID => {
                    const attack = game.specialAttacks.getObjectSafe(attackID);
                    const chance = attack.defaultChance;

                    return {
                        attack,
                        chance
                    };
                });
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode enemy passives. '${gamemode.id}'`, error);
        }

        try {
            if (data.playerModifiers) {
                gamemode.playerModifiers = ModifierConverter.fromData(game, data.playerModifiers);
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode player modifiers. '${gamemode.id}'`, error);
        }

        try {
            if (data.enemyModifiers) {
                gamemode.enemyModifiers = ModifierConverter.fromData(game, data.enemyModifiers);
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode enemy modifiers. '${gamemode.id}'`, error);
        }

        try {
            if (data.playerCombatEffects !== undefined) {
                gamemode.playerCombatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(
                    data.playerCombatEffects
                );
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode player combat effects. '${gamemode.id}'`, error);
        }

        try {
            if (data.enemyCombatEffects !== undefined) {
                gamemode.enemyCombatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(
                    data.enemyCombatEffects
                );
            }
        } catch (error) {
            Global.get.logger.error(`Failed to construct gamemode enemy combat effects. '${gamemode.id}'`, error);
        }
    }
}

export abstract class ModifierConverter {
    // @ts-ignore // TODO: TYPES
    public static toData(modifierValues: ModifierValue[]) {
        if (!modifierValues?.length) {
            return undefined;
        }

        const modifierObject: Partial<ModifierObject<SkillModifierData[], number>> = {};

        for (const modifierValue of modifierValues) {
            const alias = this.getModifierAliases(modifierValue);

            if (alias) {
                const value =
                    (modifierValue.value < 0 && modifierValue.isNegative && !modifierValue.modifier.inverted) ||
                    (modifierValue.value < 0 && !modifierValue.isNegative && modifierValue.modifier.inverted)
                        ? modifierValue.value * -1
                        : modifierValue.value;

                if (modifierValue.skill) {
                    // @ts-ignore // TODO: TYPES
                    modifierObject[alias] ??= [];
                    // @ts-ignore // TODO: TYPES
                    modifierObject[alias].push({ skillID: modifierValue.skill.id, value });
                } else {
                    // @ts-ignore // TODO: TYPES
                    modifierObject[alias] = value;
                }
            } else {
                const scope = {};

                // @ts-ignore // TODO: TYPES
                ModifierScope.copyScope(modifierValue, scope);

                const modifier = { value: modifierValue.value };

                for (const [id, entity] of Object.entries(scope)) {
                    // @ts-ignore // TODO: TYPES
                    modifier[`${id}ID`] = entity.id;
                }

                // @ts-ignore // TODO: TYPES
                modifierObject[modifierValue.modifier.localID] ??= [];
                // @ts-ignore // TODO: TYPES
                modifierObject[modifierValue.modifier.localID].push(modifier);
            }
        }

        return modifierObject;
    }

    public static fromData(modifiers: ModifierObject<SkillModifierData[], number>, game: Game) {
        // @ts-ignore // TODO: TYPES
        return game.getModifierValuesFromData(modifiers);
    }

    // @ts-ignore // TODO: TYPES
    public static getModifierAliases(modifierValue: ModifierValue) {
        // @ts-ignore // TODO: TYPES
        const scope = modifierValue.modifier.getScopingFromKey(Modifier.getScopeKey(modifierValue));
        const aliases =
            (modifierValue.isNegative && !modifierValue.modifier.inverted) ||
            (!modifierValue.isNegative && modifierValue.modifier.inverted)
                ? scope.negAliases
                : scope.posAliases;

        if (!aliases) {
            return;
        }

        // @ts-ignore // TODO: TYPES
        let matches = aliases.filter(alias => ModifierTable.doesQueryMatchScope(modifierValue, alias));

        if (!modifierValue.modifier.hasEmptyScope) {
            return;
        }

        // @ts-ignore // TODO: TYPES
        if (!matches.length && ModifierTable.doesQueryMatchScope(modifierValue, scope.scopes)) {
            // @ts-ignore // TODO: TYPES
            matches = aliases.filter(alias => ModifierTable.doesQueryMatchScope(alias, modifierValue));
        }

        if (!matches?.length) {
            return;
        }

        // @ts-ignore // TODO: TYPES
        return matches.map(alias => alias.key)[0];
    }
}

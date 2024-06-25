export abstract class ModifierConverter {
    public static toData(modifierValues: ModifierValue[]) {
        if (!modifierValues?.length) {
            return {};
        }

        const modifierObject: ModifierValuesRecordData = {};

        for (const modifierValue of modifierValues) {
            const alias = this.getModifierAliases(modifierValue);

            if (alias) {
                const value =
                    (modifierValue.value < 0 && modifierValue.isNegative && !modifierValue.modifier.inverted) ||
                    (modifierValue.value < 0 && !modifierValue.isNegative && modifierValue.modifier.inverted)
                        ? modifierValue.value * -1
                        : modifierValue.value;

                if (modifierValue.skill) {
                    modifierObject[alias] ??= [];
                    // @ts-ignore
                    modifierObject[alias].push({ skillID: modifierValue.skill.id, value });
                } else {
                    modifierObject[alias] = value;
                }
            } else {
                const scope: IModifierScope = {};

                ModifierScope.copyScope(modifierValue, scope);

                const modifier: ModifierValueData = { value: modifierValue.value };

                for (const [id, entity] of Object.entries(scope)) {
                    // @ts-ignore
                    modifier[`${id}ID`] = entity.id;
                }

                modifierObject[modifierValue.modifier.localID] ??= [];
                // @ts-ignore
                modifierObject[modifierValue.modifier.localID].push(modifier);
            }
        }

        return modifierObject;
    }

    public static fromData(game: Game, modifiers: ModifierValuesRecordData) {
        return game.getModifierValuesFromData(modifiers);
    }

    public static getModifierAliases(modifierValue: ModifierValue) {
        const scope = modifierValue.modifier.getScopingFromKey(Modifier.getScopeKey(modifierValue));
        const aliases =
            (modifierValue.isNegative && !modifierValue.modifier.inverted) ||
            (!modifierValue.isNegative && modifierValue.modifier.inverted)
                ? scope.negAliases
                : scope.posAliases;

        if (!aliases) {
            return;
        }

        let matches = aliases.filter(alias => ModifierTable.doesQueryMatchScope(modifierValue, alias));

        if (!modifierValue.modifier.hasEmptyScope) {
            return;
        }

        if (!matches.length && ModifierTable.doesQueryMatchScope(modifierValue, scope.scopes)) {
            matches = aliases.filter(alias => ModifierTable.doesQueryMatchScope(alias, modifierValue));
        }

        if (!matches?.length) {
            return;
        }

        return matches.map(alias => alias.key)[0];
    }
}

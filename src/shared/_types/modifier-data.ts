export type ModifierDataKey = keyof SkillModifierObject<any> | keyof StandardModifierObject<any>;

export type ModifierDataObject = {
    [key in ModifierDataKey]?: SkillModifierTemplate | StandardModifierTemplate;
};

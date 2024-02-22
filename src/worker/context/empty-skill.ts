export function EmptySkillFactory(name: string) {
    class EmptySkill extends GatheringSkill<EmptyAction, EmptySkillData> {
        public actionInterval = 3000;
        public actionLevel = 1;
        public _media = '';
        public renderQueue = new GatheringSkillRenderQueue<EmptyAction>();

        constructor(namespace: DataNamespace, public readonly game: Game) {
            super(namespace, name, game);
        }

        public get actionRewards() {
            return new Rewards(this.game);
        }

        public get masteryAction() {
            return this.actions.firstObject;
        }

        public get masteryModifiedInterval() {
            return this.actionInterval;
        }

        public render() {}
        public preAction() {}
        public postAction() {}
        public onEquipmentChange() {}
        public getActionIDFromOldID() {
            return '';
        }

        public getTotalUnlockedMasteryActions() {
            return 0;
        }
    }

    class EmptyAction extends BasicSkillRecipe {
        public get name() {
            return 'empty-action';
        }

        public get media() {
            return '';
        }
    }

    interface EmptySkillData extends MasterySkillData {}

    return EmptySkill;
}

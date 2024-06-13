import { Util } from './util';

export function EmptySkillFactory(name: string, media: string) {
    class EmptySkill extends GatheringSkill<EmptyAction, EmptySkillData> {
        public actionInterval = 3000;
        public actionLevel = 1;
        public _media = media;
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

        public get name() {
            return name;
        }

        public render() {}
        public preAction() {}
        public postAction() {}
        public onEquipmentChange() {}
        public getActionIDFromOldID() {
            return '';
        }

        public registerData(namespace: DataNamespace, data: any) {
            delete data.masteryLevelUnlocks;
            delete data.masteryPoolBonuses;
            delete data.masteryLevelBonuses;

            super.registerData(namespace, data);
        }

        public getTotalUnlockedMasteryActions() {
            return 0;
        }

        public decode(reader: SaveWriter, version: number) {
            if (!Util.isWebWorker) {
                const skill = game.skills.getObjectByID(this.id);
                skill.decode(reader, version);
            }
        }

        public encode(writer: SaveWriter) {
            return writer;
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

export function emptyActionEventMatcherFactory(type: string, options: SkillActionEventMatcherOptions, game: Game) {
    class EmptyActionEvent extends SkillActionEvent {
        skill: AnySkill;
        actions: Set<Action>;

        constructor(skill: AnySkill, actions: Set<Action>) {
            super();

            this.skill = skill;
            this.actions = actions;
        }
    }

    class EmptyActionEventMatcher extends SkillActionEventMatcher<EmptyActionEvent> {
        public readonly type: any;

        constructor(options: SkillActionEventMatcherOptions, game: Game) {
            super(options, game);
            this.type = type;
        }

        doesEventMatch(event: SkillActionEvent) {
            return super.doesEventMatch(event);
        }

        _assignNonRaidHandler(handler: Handler<Event>) {
            this.game.woodcutting.on('action', handler);
        }

        _unassignNonRaidHandler(handler: Handler<Event>) {
            this.game.woodcutting.off('action', handler);
        }
    }

    return new EmptyActionEventMatcher(options, game);
}

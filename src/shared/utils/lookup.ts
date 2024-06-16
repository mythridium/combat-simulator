import { Global } from 'src/shared/global';

function forGameMode(area: CombatArea) {
    if (!area.allowedGamemodes?.size) {
        return true;
    }

    return Array.from(area.allowedGamemodes).some(gamemode => gamemode.id === Global.get.currentGamemodeId);
}

export abstract class Lookup {
    private static _combatAreas: {
        combatAreas: CombatArea[];
        dungeons: Dungeon[];
        depths: AbyssDepth[];
        slayer: SlayerArea[];
        strongholds: Stronghold[];
    };

    public static get melvor() {
        return Global.get.game.realms.getObjectByID('melvorD:Melvor');
    }

    public static get abyssal() {
        return Global.get.game.realms.getObjectByID('melvorItA:Abyssal');
    }

    public static get normalDamage() {
        return Global.get.game.damageTypes.getObjectByID('melvorD:Normal');
    }

    public static get abyssalDamage() {
        return Global.get.game.damageTypes.getObjectByID('melvorItA:Abyssal');
    }

    public static get monsters() {
        return Global.get.game.monsters;
    }

    public static get dungeons() {
        return Global.get.game.dungeons;
    }

    public static get depths() {
        return Global.get.game.abyssDepths;
    }

    public static get strongholds() {
        return Global.get.game.strongholds;
    }

    public static get tasks() {
        return Global.get.game.combat.slayerTask.categories;
    }

    public static get combatAreas() {
        const categories = Global.get.game.combatAreaCategories;

        const combatAreas: CombatArea[] = categories.getObjectByID('melvorD:CombatAreas')?.areas ?? [];
        const abyssalCombatAreas: CombatArea[] = categories.getObjectByID('melvorItA:AbyssalCombatAreas')?.areas ?? [];
        const dungeons = (categories.getObjectByID('melvorD:Dungeons')?.areas as Dungeon[]) ?? [];
        const depths = (categories.getObjectByID('melvorItA:TheAbyss')?.areas as AbyssDepth[]) ?? [];
        const slayer = (categories.getObjectByID('melvorF:SlayerAreas')?.areas as SlayerArea[]) ?? [];
        const abyssalSlayer = (categories.getObjectByID('melvorItA:AbyssalSlayerAreas')?.areas as SlayerArea[]) ?? [];
        const strongholds = (categories.getObjectByID('melvorF:Strongholds')?.areas as Stronghold[]) ?? [];
        const abyssalStrongholds =
            (categories.getObjectByID('melvorItA:AbyssalStrongholds')?.areas as Stronghold[]) ?? [];

        this._combatAreas = {
            combatAreas: combatAreas.concat(abyssalCombatAreas).filter(forGameMode),
            dungeons: dungeons.filter(forGameMode),
            depths: depths.filter(forGameMode),
            slayer: slayer.concat(abyssalSlayer).filter(forGameMode),
            strongholds: strongholds.concat(abyssalStrongholds).filter(forGameMode)
        };

        return this._combatAreas;
    }

    public static getMasteryPoolBonus(skill: GatheringSkill<any, any>, realm: Realm) {
        const xp = skill.getMasteryPoolXP(realm);
        return skill.getActiveMasteryPoolBonusCount(realm, xp);
    }

    public static getSolarEclipse(township: Township) {
        return township.seasons.getObjectByID('melvorF:SolarEclipse');
    }

    public static getEternalDarkness(township: Township) {
        return township.seasons.getObjectByID('melvorItA:EternalDarkness');
    }

    public static isMelvorRealmId(id: string) {
        return this.melvor?.id === id;
    }

    public static isAbyssalRealmId(id: string) {
        return this.abyssal?.id === id;
    }

    public static getMonsterList(entityId: string): Monster[] {
        if (this.isSlayerTask(entityId)) {
            return this.getSlayerTaskMonsters(entityId);
        }

        if (this.isDepth(entityId)) {
            return this.depths.getObjectByID(entityId).monsters;
        }

        if (this.isStronghold(entityId)) {
            return this.strongholds.getObjectByID(entityId).monsters;
        }

        if (this.isDungeon(entityId)) {
            return this.dungeons.getObjectByID(entityId).monsters;
        }

        return [];
    }

    public static getEntity(entityId: string) {
        if (this.isDungeon(entityId)) {
            return this.dungeons.getObjectByID(entityId);
        }

        if (this.isDepth(entityId)) {
            return this.depths.getObjectByID(entityId);
        }

        if (this.isStronghold(entityId)) {
            return this.strongholds.getObjectByID(entityId);
        }

        if (this.isSlayerTask(entityId)) {
            return this.tasks.getObjectByID(entityId);
        }

        return this.monsters.getObjectByID(entityId);
    }

    public static isDungeon(dungeonId: string | undefined) {
        if (dungeonId === undefined) {
            return false;
        }

        return this.dungeons.getObjectByID(dungeonId) !== undefined;
    }

    public static isSlayerTask(taskId: string | undefined) {
        if (taskId === undefined) {
            return false;
        }

        return this.tasks.getObjectByID(taskId) !== undefined;
    }

    public static isDepth(depthId: string | undefined) {
        if (depthId === undefined) {
            return false;
        }

        return this.depths.getObjectByID(depthId) !== undefined;
    }

    public static isStronghold(strongholdId: string | undefined) {
        if (strongholdId === undefined) {
            return false;
        }

        return this.strongholds.getObjectByID(strongholdId) !== undefined;
    }

    public static getSlayerTaskMonsters(taskId: string) {
        const slayerMonsters: Monster[] = [];
        const task = this.tasks.getObjectByID(taskId);

        if (!task) {
            throw new Error(`Could not find task: ${taskId}`);
        }

        const categoryFilter = task.getMonsterFilter();

        for (const monster of this.monsters.allObjects) {
            // check if it is a slayer monster
            if (!monster.canSlayer) {
                continue;
            }

            const area = Global.get.game.getMonsterArea(monster);

            if (area.realm.id !== task.realm.id || area.id === 'melvorD:UnknownArea' || !categoryFilter(monster)) {
                continue;
            }

            slayerMonsters.push(monster);
        }

        return slayerMonsters;
    }

    public static getSlayerTaskForMonster(monsterId: string) {
        return this.tasks.find(
            task => this.getSlayerTaskMonsters(task.id).find(monster => monster.id === monsterId) !== undefined
        );
    }
}

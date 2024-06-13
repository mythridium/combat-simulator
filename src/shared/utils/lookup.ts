import { Global } from 'src/shared/global';

function forGameMode(area: CombatArea) {
    // @ts-ignore // TODO: TYPES
    if (!area.allowedGamemodes?.size) {
        return true;
    }

    // @ts-ignore // TODO: TYPES
    return Array.from(area.allowedGamemodes).some(gamemode => gamemode.id === Global.get.currentGamemodeId);
}

export abstract class Lookup {
    private static _combatAreas: {
        combatAreas: CombatArea[];
        dungeons: Dungeon[];
        // @ts-ignore // TODO: TYPES
        depths: AbyssDepth[];
        slayer: SlayerArea[];
        // @ts-ignore // TODO: TYPES
        strongholds: Stronghold[];
    };

    public static get melvor() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.realms.getObjectByID('melvorD:Melvor');
    }

    public static get abyssal() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.realms.getObjectByID('melvorItA:Abyssal');
    }

    public static get normalDamage() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.damageTypes.getObjectByID('melvorD:Normal');
    }

    public static get abyssalDamage() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.damageTypes.getObjectByID('melvorItA:Abyssal');
    }

    public static get monsters() {
        return Global.get.game.monsters;
    }

    public static get dungeons() {
        return Global.get.game.dungeons;
    }

    public static get depths() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.abyssDepths;
    }

    public static get strongholds() {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.strongholds;
    }

    // @ts-ignore // TODO: TYPES
    public static get tasks(): SlayerTaskCategory {
        // @ts-ignore // TODO: TYPES
        return Global.get.game.combat.slayerTask.categories;
    }

    public static get combatAreas() {
        // @ts-ignore // TODO: TYPES
        const categories = Global.get.game.combatAreaCategories;

        const combatAreas: CombatArea[] = categories.getObjectByID('melvorD:CombatAreas')?.areas ?? [];
        const abyssalCombatAreas: CombatArea[] = categories.getObjectByID('melvorItA:AbyssalCombatAreas')?.areas ?? [];
        const dungeons: Dungeon[] = categories.getObjectByID('melvorD:Dungeons')?.areas ?? [];
        // @ts-ignore // TODO: TYPES
        const depths: AbyssDepth[] = categories.getObjectByID('melvorItA:TheAbyss')?.areas ?? [];
        const slayer: SlayerArea[] = categories.getObjectByID('melvorF:SlayerAreas')?.areas ?? [];
        const abyssalSlayer: SlayerArea[] = categories.getObjectByID('melvorItA:AbyssalSlayerAreas')?.areas ?? [];
        // @ts-ignore // TODO: TYPES
        const strongholds: Stronghold[] = categories.getObjectByID('melvorF:Strongholds')?.areas ?? [];
        // @ts-ignore // TODO: TYPES
        const abyssalStrongholds: Stronghold[] = categories.getObjectByID('melvorItA:AbyssalStrongholds')?.areas ?? [];

        this._combatAreas = {
            combatAreas: combatAreas.concat(abyssalCombatAreas).filter(forGameMode),
            dungeons: dungeons.filter(forGameMode),
            depths: depths.filter(forGameMode),
            slayer: slayer.concat(abyssalSlayer).filter(forGameMode),
            strongholds: strongholds.concat(abyssalStrongholds).filter(forGameMode)
        };

        return this._combatAreas;
    }

    // @ts-ignore // TODO: TYPES
    public static getMasteryPoolBonus(skill: AnySkill, realm: Realm) {
        // @ts-ignore // TODO: TYPES
        const xp = skill.getMasteryPoolXP(realm);
        // @ts-ignore // TODO: TYPES
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

            // @ts-ignore // TODO: TYPES
            if (area.realm.id !== task.realm.id || area.id === 'melvorD:UnknownArea' || !categoryFilter(monster)) {
                continue;
            }

            slayerMonsters.push(monster);
        }

        return slayerMonsters;
    }

    public static getSlayerTaskForMonster(monsterId: string) {
        // @ts-ignore // TODO: TYPES
        return this.tasks.find(task => this.getSlayerTaskMonsters(task.id).find(monster => monster.id === monsterId));
    }
}

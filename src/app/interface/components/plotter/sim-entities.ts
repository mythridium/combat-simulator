import { MonsterInformation } from 'src/app/stores/selected-bar.store';

export class SimEntities {
    public readonly monsters: MonsterInformation[] = [];
    public readonly dungeons: MonsterInformation[] = [];
    public readonly dungeonMonsters = new Map<string, MonsterInformation[]>();
    public readonly tasks: MonsterInformation[] = [];
    public readonly taskMonsters = new Map<string, MonsterInformation[]>();

    constructor() {
        for (const combatArea of game.combatAreaDisplayOrder) {
            for (const monster of combatArea.monsters) {
                this.monsters.push({ id: monster.id, name: monster.name, media: monster.media });
            }
        }

        const bard = game.monsters.getObjectByID('melvorF:WanderingBard');

        if (bard) {
            this.monsters.push({ id: bard.id, name: bard.name, media: bard.media });
        }

        for (const slayerArea of game.slayerAreaDisplayOrder) {
            for (const monster of slayerArea.monsters) {
                this.monsters.push({ id: monster.id, name: monster.name, media: monster.media });
            }
        }

        for (const dungeon of game.dungeonDisplayOrder) {
            this.dungeons.push({ id: dungeon.id, name: dungeon.name, media: dungeon.media });

            // special logic for impending darkness event so sims can be done per attack type.
            if (dungeon.id === 'melvorF:Impending_Darkness') {
                const bane = game.monsters.getObjectByID('melvorF:Bane');
                const fear = game.monsters.getObjectByID('melvorF:BaneInstrumentOfFear');

                if (!bane || !fear) {
                    continue;
                }

                const attackTypes = ['Melee', 'Ranged', 'Magic'];
                const monsters: MonsterInformation[] = [];

                for (const attackType of attackTypes) {
                    monsters.push({
                        id: `${bane.id}_${attackType}`,
                        name: `${bane.name} (${attackType})`,
                        media: bane.media
                    });
                }

                for (const attackType of attackTypes) {
                    monsters.push({
                        id: `${fear.id}_${attackType}`,
                        name: `${fear.name} (${attackType})`,
                        media: fear.media
                    });
                }

                this.dungeonMonsters.set(dungeon.id, monsters);

                continue;
            }

            this.dungeonMonsters.set(
                dungeon.id,
                dungeon.monsters.map(monster => ({ id: monster.id, name: monster.name, media: monster.media }))
            );
        }

        for (const [index, tier] of SlayerTask.data.entries()) {
            this.tasks.push({ id: index.toString(), name: tier.engDisplay, media: game.slayer.media });

            this.taskMonsters.set(index.toString(), this.getSlayerMonsters(tier));
        }
    }

    private getSlayerMonsters(tier: SlayerTaskData) {
        const monsters: MonsterInformation[] = [];

        for (const monsterInformation of this.monsters) {
            const monster = game.monsters.getObjectByID(monsterInformation.id);

            if (
                !monster ||
                !monster.canSlayer ||
                monster.combatLevel < tier.minLevel ||
                monster.combatLevel > tier.maxLevel
            ) {
                continue;
            }

            monsters.push({ id: monster.id, name: monster.name, media: monster.media });
        }

        return monsters;
    }
}

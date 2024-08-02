import { Util } from 'src/shared/util';
import { Global } from './global';
import { SimulationData } from './simulation';
import { SimClasses } from 'src/shared/simulator/sim';
import { PlotKey } from './stores/plotter.store';
import { Lookup } from 'src/shared/utils/lookup';

interface GPValue {
    [index: string]: number;
}

export abstract class Drops {
    public static noneItem = 'mcs:none';

    public static godDungeonIds = [
        'melvorF:Air_God_Dungeon',
        'melvorF:Water_God_Dungeon',
        'melvorF:Earth_God_Dungeon',
        'melvorF:Fire_God_Dungeon'
    ];

    private static get doubling() {
        return Util.averageDoubleMultiplier(Global.stores.stats.state.lootBonusPercent);
    }

    private static get chanceForNoLoot() {
        return 1 - Global.game.combat.player.modifiers.noCombatDropChance / 100;
    }

    public static update() {
        this.updateDropChance();
        this.updateGP();
        this.updateSignetChance();
        this.updatePetChance();
        this.updateMarkChance();
    }

    public static updateDropChance() {
        // Set data for monsters in combat zones
        for (const monsterId of Global.stores.game.state.monsterIds) {
            const data = Global.simulation.monsterSimData[monsterId];

            data.dropChance = this.getMonsterDropChance(monsterId, data);
        }

        // compute dungeon drop rates
        for (const dungeon of Lookup.combatAreas.dungeons) {
            if (this.godDungeonIds.includes(dungeon.id)) {
                if (Global.stores.plotter.state.selectedDrop === Drops.noneItem) {
                    const data = Global.simulation.dungeonSimData[dungeon.id];
                    data.dropChance = this.getDungeonDropChance(dungeon, data);
                } else {
                    for (const monster of dungeon.monsters) {
                        const simId = Global.simulation.simId(monster.id, dungeon.id);
                        const data = Global.simulation.monsterSimData[simId];
                        data.dropChance = this.getMonsterDropChance(monster.id, data);
                    }

                    const data = Global.simulation.dungeonSimData[dungeon.id];

                    data.dropChance = this.getMonsterListAverageDropRate(
                        PlotKey.Drops,
                        data,
                        dungeon.monsters,
                        dungeon.id
                    );
                }
            } else {
                const monster = dungeon.monsters[dungeon.monsters.length - 1];
                const data = Global.simulation.dungeonSimData[dungeon.id];
                data.dropChance = this.getMonsterDropChance(monster.id, data);

                if (dungeon.rewards) {
                    data.dropChance = this.getDungeonDropChance(dungeon, data);
                }
            }
        }

        for (const stronghold of Lookup.combatAreas.strongholds) {
            for (const monster of stronghold.monsters) {
                const simId = Global.simulation.simId(monster.id, stronghold.id);
                const data = Global.simulation.monsterSimData[simId];
                data.dropChance = this.getMonsterDropChance(monster.id, data);
            }

            if (Global.stores.plotter.state.selectedDrop === Drops.noneItem) {
                const data = Global.simulation.strongholdSimData[stronghold.id];
                data.dropChance = this.getStrongholdDropChance(stronghold, data);
            } else {
                const data = Global.simulation.strongholdSimData[stronghold.id];

                data.dropChance = this.getMonsterListAverageDropRate(
                    PlotKey.Drops,
                    Global.simulation.strongholdSimData[stronghold.id],
                    stronghold.monsters,
                    stronghold.id
                );

                const rewards = stronghold.tiers[stronghold.mcsTier].rewards;

                if (rewards) {
                    data.dropChance += this.getStrongholdDropChance(stronghold, data);
                }
            }
        }

        for (const depth of Lookup.combatAreas.depths) {
            const monster = depth.monsters[depth.monsters.length - 1];
            const data = Global.simulation.depthSimData[depth.id];
            data.dropChance = this.getMonsterDropChance(monster.id, data);

            if (depth.rewards) {
                data.dropChance += this.getDungeonDropChance(depth, data);
            }
        }

        // compute auto slayer drop rates
        for (const taskId of Global.stores.game.state.taskIds) {
            const data = Global.simulation.slayerSimData[taskId];

            data.dropChance = this.getMonsterListAverageDropRate(
                PlotKey.Drops,
                Global.simulation.slayerSimData[taskId],
                Global.simulation.slayerTaskMonsters[taskId]
            );
        }
    }

    public static updateGP() {
        if (Global.stores.plotter.state.isInspecting && Lookup.isDungeon(Global.stores.plotter.state.inspectedId)) {
            const monsters = Lookup.dungeons.getObjectByID(Global.stores.plotter.state.inspectedId).monsters;

            for (const monster of monsters) {
                const simId = Global.simulation.simId(monster.id, Global.stores.plotter.state.inspectedId);
                const data = Global.simulation.monsterSimData[simId];

                if (!data) {
                    continue;
                }

                this.setGpPerSecond(data, () => this.computeDungeonMonsterValue(monster.id));
            }
        } else {
            // Regular monsters
            for (const monsterId of Global.stores.game.state.monsterIds) {
                const data = Global.simulation.monsterSimData[monsterId];

                if (!data) {
                    continue;
                }

                if (data.simSuccess) {
                    this.setGpPerSecond(data, () => this.computeMonsterValue(monsterId, data.realmId));
                }
            }

            // Dungeons
            for (const dungeonId of Global.stores.game.state.dungeonIds) {
                const data = Global.simulation.dungeonSimData[dungeonId];

                if (!data) {
                    continue;
                }

                if (data.simSuccess) {
                    this.setGpPerSecond(data, () => this.computeDungeonValue(dungeonId, data.realmId));
                }
            }

            // Strongholds
            for (const strongholdId of Global.stores.game.state.strongholdIds) {
                const data = Global.simulation.strongholdSimData[strongholdId];

                if (!data) {
                    continue;
                }

                if (data.simSuccess) {
                    this.setGpPerSecond(data, () => this.computeStrongholdValue(strongholdId, data.realmId));
                }
            }

            // Depths
            for (const depthId of Global.stores.game.state.depthIds) {
                const data = Global.simulation.depthSimData[depthId];

                if (!data) {
                    continue;
                }

                if (data.simSuccess) {
                    this.setGpPerSecond(data, () => this.computeDepthValue(depthId, data.realmId));
                }
            }

            // slayer tasks
            for (const taskId of Global.stores.game.state.taskIds) {
                const data = Global.simulation.slayerSimData[taskId];

                data.gpPerSecondMelvor = this.getMonsterListAverageDropRate(
                    `${PlotKey.GP}Melvor` as PlotKey,
                    data,
                    Global.simulation.slayerTaskMonsters[taskId]
                );

                data.gpPerSecondAbyssal = this.getMonsterListAverageDropRate(
                    `${PlotKey.GP}Abyssal` as PlotKey,
                    data,
                    Global.simulation.slayerTaskMonsters[taskId]
                );
            }
        }
    }

    private static setGpPerSecond(data: SimulationData, valueFactory: () => GPValue) {
        const gpValue = valueFactory();

        for (const [id, value] of Object.entries(gpValue)) {
            if (id === 'melvorItA:AbyssalPieces') {
                data.gpPerSecondAbyssal = this.getGpPerSeconds(data.baseGpPerSecondAbyssal, value, data.killTimeS);
                continue;
            }

            if (id === 'melvorD:GP') {
                data.gpPerSecondMelvor = this.getGpPerSeconds(data.baseGpPerSecondMelvor, value, data.killTimeS);
                continue;
            }

            Global.logger.error(`Encountered unknown currency type.`, id, value, gpValue);
        }
    }

    public static updateSignetChance() {
        if (Global.stores.plotter.state.isInspecting && Lookup.isDungeon(Global.stores.plotter.state.inspectedId)) {
            const monsters = Lookup.dungeons.getObjectByID(Global.stores.plotter.state.inspectedId).monsters;

            for (const monster of monsters) {
                const data = Global.simulation.monsterSimData[monster.id];

                if (!data) {
                    continue;
                }

                data.signetChance = 0;
            }
        } else {
            // Set data for monsters in combat zones
            for (const monsterId of Global.stores.game.state.monsterIds) {
                const data = Global.simulation.monsterSimData[monsterId];

                if (!data) {
                    continue;
                }

                data.signetChance = this.getMonsterSignetChance(monsterId, data);
            }

            // Set data for dungeons
            for (const dungeon of Lookup.combatAreas.dungeons) {
                const data = Global.simulation.dungeonSimData[dungeon.id];

                if (!data) {
                    continue;
                }

                let signetChance = 0;

                for (const monster of dungeon.monsters) {
                    const data = Global.simulation.monsterSimData[Global.simulation.simId(monster.id, dungeon.id)];

                    if (!data) {
                        continue;
                    }

                    signetChance += this.getMonsterSignetChance(monster.id, data);
                }

                data.signetChance = signetChance / dungeon.monsters.length;
            }

            // Set data for strongholds
            for (const stronghold of Lookup.combatAreas.strongholds) {
                const data = Global.simulation.strongholdSimData[stronghold.id];

                if (!data) {
                    continue;
                }

                let signetChance = 0;

                for (const monster of stronghold.monsters) {
                    const data = Global.simulation.monsterSimData[Global.simulation.simId(monster.id, stronghold.id)];

                    if (!data) {
                        continue;
                    }

                    signetChance += this.getMonsterSignetChance(monster.id, data);
                }

                data.signetChance = signetChance / stronghold.monsters.length;
            }

            // Set data for depth
            for (const depth of Lookup.combatAreas.depths) {
                const data = Global.simulation.depthSimData[depth.id];

                if (!data) {
                    continue;
                }

                let signetChance = 0;

                for (const monster of depth.monsters) {
                    const data = Global.simulation.monsterSimData[Global.simulation.simId(monster.id, depth.id)];

                    if (!data) {
                        continue;
                    }

                    signetChance += this.getMonsterSignetChance(monster.id, data);
                }

                data.signetChance = signetChance / depth.monsters.length;
            }

            // Set data for auto slayer
            for (const taskId of Global.stores.game.state.taskIds) {
                const data = Global.simulation.slayerSimData[taskId];

                if (!data) {
                    continue;
                }

                const monsters = Global.simulation.slayerTaskMonsters[taskId];

                let signetChance = 0;

                for (const monster of monsters) {
                    const data = Global.simulation.monsterSimData[monster.id];

                    if (!data) {
                        continue;
                    }

                    signetChance += this.getMonsterSignetChance(monster.id, data);
                }

                data.signetChance = signetChance / monsters.length;
            }
        }
    }

    private static getMonsterSignetChance(monsterId: string, data: SimulationData) {
        if (!data) {
            return;
        }

        const isNotAbyssal = Global.game.combat.player.damageType?.id !== 'melvorItA:Abyssal';

        if (!isNotAbyssal) {
            return 0;
        }

        const monster = Lookup.monsters.getObjectByID(monsterId);

        if (Global.game.combat.player.modifiers.allowSignetDrops && data.simSuccess) {
            if (Global.stores.plotter.timeMultiplier === -1) {
                return 100 * this.getSignetDropRate(monster);
            } else {
                const chance = Math.pow(
                    1 - this.getSignetDropRate(monster),
                    Global.stores.plotter.timeMultiplier / data.killTimeS
                );

                return 100 * (1 - chance);
            }
        }

        return 0;
    }

    public static updatePetChance() {
        const petSkills = this.getTrainedSkills();

        if (!petSkills.includes(Global.stores.plotter.state.selectedSkill)) {
            for (const simId in Global.simulation.monsterSimData) {
                Global.simulation.monsterSimData[simId].petChance = 0;
            }

            for (const dungeonId in Global.simulation.dungeonSimData) {
                Global.simulation.dungeonSimData[dungeonId].petChance = 0;
            }

            for (const strongholdId in Global.simulation.strongholdSimData) {
                Global.simulation.strongholdSimData[strongholdId].petChance = 0;
            }

            for (const depthId in Global.simulation.depthSimData) {
                Global.simulation.depthSimData[depthId].petChance = 0;
            }

            for (const taskId in Global.simulation.slayerSimData) {
                Global.simulation.slayerSimData[taskId].petChance = 0;
            }

            return;
        }

        const skill = Global.game.skills.find(skill => skill.localID === Global.stores.plotter.state.selectedSkill);

        if (!skill) {
            return;
        }

        const petSkillLevel =
            Global.game.combat.player.skillLevel.get(Global.skillIds[Global.stores.plotter.state.selectedSkill]) + 1;

        for (const simId in Global.simulation.monsterSimData) {
            const data = Global.simulation.monsterSimData[simId];

            if (!data?.simSuccess) {
                continue;
            }

            const timeMultiplier =
                Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

            data.petChance = this.getChanceForPet(data, petSkillLevel, timeMultiplier);
        }

        for (const dungeon of Lookup.combatAreas.dungeons) {
            const dungeonData = Global.simulation.dungeonSimData[dungeon.id];

            if (!dungeonData?.simSuccess) {
                continue;
            }

            let chanceForPet = 0;

            for (const monster of dungeon.monsters) {
                const simId = Global.simulation.simId(monster.id, dungeon.id);
                const data = Global.simulation.monsterSimData[simId];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                data.petChance = this.getChanceForPet(data, petSkillLevel, timeMultiplier);
                chanceForPet += data.petChance;
            }

            dungeonData.petChance = chanceForPet / dungeon.monsters.length;
        }

        for (const stronghold of Lookup.combatAreas.strongholds) {
            const strongholdData = Global.simulation.strongholdSimData[stronghold.id];

            if (!strongholdData?.simSuccess) {
                continue;
            }

            let chanceForPet = 0;

            for (const monster of stronghold.monsters) {
                const simId = Global.simulation.simId(monster.id, stronghold.id);
                const data = Global.simulation.monsterSimData[simId];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                data.petChance = this.getChanceForPet(data, petSkillLevel, timeMultiplier);
                chanceForPet += data.petChance;
            }

            strongholdData.petChance = chanceForPet / stronghold.monsters.length;
        }

        for (const depth of Lookup.combatAreas.depths) {
            const depthData = Global.simulation.depthSimData[depth.id];

            if (!depthData?.simSuccess) {
                continue;
            }

            let chanceForPet = 0;

            for (const monster of depth.monsters) {
                const simId = Global.simulation.simId(monster.id, depth.id);
                const data = Global.simulation.monsterSimData[simId];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                data.petChance = this.getChanceForPet(data, petSkillLevel, timeMultiplier);
                chanceForPet += data.petChance;
            }

            depthData.petChance = chanceForPet / depth.monsters.length;
        }

        for (const task of Lookup.tasks.allObjects) {
            const data = Global.simulation.slayerSimData[task.id];

            if (!data?.simSuccess) {
                continue;
            }

            let chanceForPet = 0;

            for (const monster of Global.simulation.slayerTaskMonsters[task.id]) {
                const data = Global.simulation.monsterSimData[monster.id];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                chanceForPet += this.getChanceForPet(data, petSkillLevel, timeMultiplier);
            }

            data.petChance = chanceForPet / Global.simulation.slayerTaskMonsters[task.id].length;
        }
    }

    private static getChanceForPet(data: SimulationData, skillLevel: number, timeMultiplier: number) {
        const interval = data.petRolls[Global.skillIds[Global.stores.plotter.state.selectedSkill]];
        const increasedChance = 1 - Global.game.combat.player.modifiers.skillPetLocationChance / 100;

        // this is the percentage chance to drop within one second
        const percentageToDrop = ((interval * skillLevel) / 25000000) * increasedChance;

        return (1 - Math.pow(1 - percentageToDrop / 100, timeMultiplier)) * 100;
    }

    public static updateMarkChance() {
        const markSkills = this.getTrainedSkills();

        if (!markSkills.includes(Global.stores.plotter.state.selectedSkill)) {
            for (const simId in Global.simulation.monsterSimData) {
                Global.simulation.monsterSimData[simId].markChance = 0;
            }

            for (const dungeonId in Global.simulation.dungeonSimData) {
                Global.simulation.dungeonSimData[dungeonId].markChance = 0;
            }

            for (const depthId in Global.simulation.depthSimData) {
                Global.simulation.depthSimData[depthId].markChance = 0;
            }

            for (const strongholdId in Global.simulation.strongholdSimData) {
                Global.simulation.strongholdSimData[strongholdId].markChance = 0;
            }

            for (const taskId in Global.simulation.slayerSimData) {
                Global.simulation.slayerSimData[taskId].markChance = 0;
            }

            return;
        }

        const skill = Global.game.skills.find(skill => skill.localID === Global.stores.plotter.state.selectedSkill);

        if (!skill) {
            return;
        }

        for (const simId in Global.simulation.monsterSimData) {
            const data = Global.simulation.monsterSimData[simId];

            if (!data?.simSuccess) {
                continue;
            }

            const monster = Lookup.monsters.getObjectByID(simId);

            if (!monster) {
                continue;
            }

            const area = Global.game.getMonsterArea(monster);

            const timeMultiplier =
                Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

            data.markChance = this.getChanceForMarkSkill(data, skill, area.realm, timeMultiplier);
        }

        for (const dungeon of Lookup.combatAreas.dungeons) {
            const dungeonData = Global.simulation.dungeonSimData[dungeon.id];

            if (!dungeonData?.simSuccess) {
                continue;
            }

            let chanceForMark = 0;

            for (const monster of dungeon.monsters) {
                const simId = Global.simulation.simId(monster.id, dungeon.id);
                const data = Global.simulation.monsterSimData[simId];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                const area = Global.game.getMonsterArea(monster);
                data.markChance = this.getChanceForMarkSkill(data, skill, area.realm, timeMultiplier);
                chanceForMark += data.markChance;
            }

            dungeonData.markChance = chanceForMark / dungeon.monsters.length;
        }

        for (const task of Lookup.tasks.allObjects.map(task => task.id)) {
            const data = Global.simulation.slayerSimData[task];

            if (!data?.simSuccess) {
                continue;
            }

            let chanceForMark = 0;

            for (const monster of Global.simulation.slayerTaskMonsters[task]) {
                const data = Global.simulation.monsterSimData[monster.id];

                if (!data?.simSuccess) {
                    continue;
                }

                const timeMultiplier =
                    Global.stores.plotter.timeMultiplier === -1 ? data.killTimeS : Global.stores.plotter.timeMultiplier;

                const area = Global.game.getMonsterArea(monster);
                chanceForMark += this.getChanceForMarkSkill(data, skill, area.realm, timeMultiplier);
            }

            data.markChance = chanceForMark / Global.simulation.slayerTaskMonsters[task].length;
        }
    }

    public static getChanceForMarkBreakdown(
        data: SimulationData,
        skill: AnySkill,
        realm: Realm,
        timeMultiplier: number
    ) {
        const interval = data.markRolls && !Number.isNaN(data.markRolls[skill.id]) ? data.markRolls[skill.id] ?? 0 : 0;
        const realmRecipes = Global.game.summoning.recipesBySkillAndRealm.get(skill)?.get(realm) ?? [];
        const recipes = Array.from(realmRecipes);

        const markRolls: { [index: string]: { markId: string; percentage: number }[] } = {};

        for (const mark of recipes) {
            if (!markRolls[skill.id]) {
                markRolls[skill.id] = [];
            }

            markRolls[skill.id].push({
                markId: mark.id,
                percentage: this.getChanceForMark(mark, skill, interval, timeMultiplier)
            });
        }

        return markRolls;
    }

    private static getChanceForMarkSkill(data: SimulationData, skill: AnySkill, realm: Realm, timeMultiplier: number) {
        const interval = data.markRolls[skill.id] ?? 0;
        const recipes = Array.from(Global.game.summoning.recipesBySkillAndRealm.get(skill).get(realm));

        const probabilities = recipes.map(mark => this.getChanceForMark(mark, skill, interval, timeMultiplier) / 100);
        const probabilityOfNone = probabilities.reduce((sum, probability) => sum * (1 - probability), 1);

        return (1 - probabilityOfNone) * 100;
    }

    private static getChanceForMark(mark: SummoningRecipe, skill: AnySkill, interval: number, timeMultiplier: number) {
        let equippedModifier = 1;

        if (Global.game.combat.player.equipment.checkForItem(mark.product)) {
            equippedModifier = skill.hasMastery ? 2.5 : 2;
        }

        // this is the percentage chance to drop within one second
        const decimalToDrop = (equippedModifier * interval) / (2000 * Math.pow(mark.tier + 1, 2)) / 100;

        return (1 - Math.pow(1 - decimalToDrop, timeMultiplier)) * 100;
    }

    private static getTrainedSkills() {
        const skills = ['Hitpoints', 'Prayer'];

        if (Global.game.combat.player.isSlayerTask) {
            skills.push('Slayer');
        }

        if (Global.game.combat.player.isAutoCorrupt) {
            skills.push('Corruption');
        }

        switch (Global.game.combat.player.attackType) {
            case 'melee':
                switch (Global.game.combat.player.attackStyles.melee.localID) {
                    case 'Stab':
                        skills.push('Attack');
                        break;
                    case 'Slash':
                        skills.push('Strength');
                        break;
                    case 'Block':
                        skills.push('Defence');
                        break;
                }

                break;
            case 'ranged':
                skills.push('Ranged');

                if (Global.game.combat.player.attackStyles.ranged.localID === 'Longrange') {
                    skills.push('Defence');
                }

                break;
            case 'magic':
                skills.push('Magic');

                if (Global.game.combat.player.attackStyles.magic.localID === 'Defensive') {
                    skills.push('Defence');
                }

                break;
        }

        return skills;
    }

    private static getGpPerSeconds(rawGp: number, value: number, killTime: number) {
        if (killTime === Infinity) {
            return rawGp;
        }

        const baseGp = rawGp + value / killTime;

        return (baseGp * killTime) / killTime;
    }

    private static getSignetDropRate(monster: Monster) {
        return monster.combatLevel / 500000;
    }

    private static computeLootChance(monsterId: string) {
        const lootChance = Lookup.monsters.getObjectByID(monsterId).lootChance;

        return lootChance !== undefined ? lootChance / 100 : 1;
    }

    private static computeMonsterLootTableValue(monsterId: string) {
        const lootTable = Lookup.monsters.getObjectByID(monsterId).lootTable;
        let gpWeight: GPValue = {};

        for (const drop of lootTable.drops) {
            let averageQuantity = this.averageQuantity(drop);

            if (drop.item instanceof OpenableItem && drop.item.dropTable) {
                const weight = this.computeDropTableValue(drop.item.dropTable);

                for (const [id, value] of Object.entries(weight)) {
                    gpWeight[id] ??= 0;
                    gpWeight[id] += value * averageQuantity;
                }
            } else {
                const value = this.getItemValue(drop.item);
                const herb = Global.game.farming.getHerbFromSeed(drop.item);

                if (Global.game.combat.player.modifiers.seedDropConversionChance > 0 && herb) {
                    averageQuantity += 3;
                    const herbValue = this.getItemValue(herb);

                    gpWeight[value.currency.id] ??= 0;

                    gpWeight[value.currency.id] +=
                        value.quantity *
                        (1 - Global.game.combat.player.modifiers.seedDropConversionChance) *
                        drop.weight *
                        averageQuantity;

                    gpWeight[herbValue.currency.id] ??= 0;
                    gpWeight[herbValue.currency.id] +=
                        herbValue.quantity *
                        (1 - Global.game.combat.player.modifiers.seedDropConversionChance) *
                        drop.weight *
                        averageQuantity;
                } else {
                    gpWeight[value.currency.id] ??= 0;
                    gpWeight[value.currency.id] += value.quantity * drop.weight * averageQuantity;
                }
            }
        }

        for (const [id, value] of Object.entries(gpWeight)) {
            gpWeight[id] = (value / lootTable.totalWeight) * this.doubling * this.chanceForNoLoot;
        }

        return gpWeight;
    }

    private static computeDropTableValue(dropTable: DropTable): GPValue {
        if (dropTable === undefined) {
            return this.emptyGPValue();
        }

        let gpWeight: GPValue = {};

        for (const drop of dropTable.drops) {
            const value = this.getItemValue(drop.item);

            gpWeight[value.currency.id] ??= 0;
            gpWeight[value.currency.id] += this.averageQuantity(drop) * value.quantity * drop.weight;
            //gpWeight += this.averageQuantity(drop) * this.getItemValue(drop.item) * drop.weight;
        }

        for (const [id, value] of Object.entries(gpWeight)) {
            gpWeight[id] ??= 0;
            gpWeight[id] = value / dropTable.totalWeight;
        }

        return gpWeight;
    }

    private static computeMonsterValue(monsterId: string, realmId: string) {
        const monster = Lookup.monsters.getObjectByID(monsterId);
        const signetDropRate = this.getSignetDropRate(monster);

        let monsterValue: GPValue = {};

        for (const [id, value] of Object.entries(this.computeMonsterLootTableValue(monsterId))) {
            monsterValue[id] ??= 0;
            monsterValue[id] += value;

            if (realmId !== 'melvorItA:Abyssal') {
                if (Global.game.combat.player.modifiers.allowSignetDrops) {
                    const signetValue = this.getItemValue(
                        Global.game.items.getObjectByID('melvorD:Signet_Ring_Half_B')
                    );

                    monsterValue[signetValue.currency.id] ??= 0;
                    monsterValue[signetValue.currency.id] += signetValue.quantity * signetDropRate;
                } else {
                    const topazValue = this.getItemValue(Global.game.items.getObjectByID('melvorD:Gold_Topaz_Ring'));

                    monsterValue[topazValue.currency.id] ??= 0;
                    monsterValue[topazValue.currency.id] += topazValue.quantity * signetDropRate;
                }
            }

            monsterValue[id] *= this.computeLootChance(monsterId);
            monsterValue[id] *= this.chanceForNoLoot;

            // removed selling bones - leaving here incase people want it back TODO
            // bones drops are not affected by loot chance
            /* const bones = Lookup.monsters.getObjectByID(monsterId).bones;

            if (this.sellBones && !this.modifiers.autoBurying && bones) {
                const boneValue = this.getItemValue(bones.item);

                monsterValue[boneValue.currency.id] ??= 0;
                monsterValue[boneValue.currency.id] += boneValue.quantity * this.lootBonus * this.noLoot * bones.quantity;
            } */
        }

        return monsterValue;
    }

    private static computeDungeonMonsterValue(monsterId: string) {
        const shard = Lookup.monsters.getObjectByID(monsterId).bones;

        if (!shard?.item) {
            return this.emptyGPValue();
        }

        const gpValue: GPValue = {};

        if (this.godDungeonIds.includes(Global.stores.plotter.state.inspectedId)) {
            const boneQty = shard?.quantity ?? 1;

            if (Global.stores.plotter.state.shardsToChests) {
                const itemUpgrades = Global.game.bank.itemUpgrades.get(shard.item);

                if (itemUpgrades?.length && itemUpgrades[0]) {
                    const itemUpgrade = itemUpgrades[0];
                    const chest = itemUpgrade.upgradedItem as OpenableItem;
                    const required = itemUpgrade.itemCosts[0]?.quantity;

                    if (chest) {
                        const chestValue = this.computeChestOpenValue(chest);

                        for (const [id, value] of Object.entries(chestValue)) {
                            gpValue[id] ??= 0;
                            gpValue[id] += ((boneQty * this.doubling * this.chanceForNoLoot) / required) * value;
                        }
                    }
                }
            } else {
                const shardValue = this.getItemValue(shard.item);

                gpValue[shardValue.currency.id] ??= 0;
                gpValue[shardValue.currency.id] += boneQty * this.doubling * this.chanceForNoLoot * shardValue.quantity;
            }
        }

        return gpValue;
    }

    private static computeChestOpenValue(chest: OpenableItem) {
        const gpValue: GPValue = {};

        const gpWeight: GPValue = {};
        const totWeight: GPValue = {};
        let avgQty = 0;

        for (let i = 0; i < chest.dropTable.sortedDropsArray.length; i++) {
            const drop = chest.dropTable.sortedDropsArray[i];

            if (drop) {
                const range = Array.from(
                    { length: drop.maxQuantity - drop.minQuantity + 1 },
                    (_, i) => drop.minQuantity + i
                );

                const sum = range.reduce((a, b) => a + b, 0);
                avgQty = sum / range.length || 0;
            } else {
                avgQty = 1;
            }

            const value = this.getItemValue(drop.item);

            gpWeight[value.currency.id] ??= 0;
            gpWeight[value.currency.id] += avgQty * value.quantity * drop.weight;
            totWeight[value.currency.id] ??= 0;
            totWeight[value.currency.id] + drop.weight;
        }

        for (const [id, value] of Object.entries(gpWeight)) {
            gpValue[id] ??= 0;
            gpValue[id] = value / totWeight[id];
        }

        return gpValue;
    }

    private static computeDungeonValue(dungeonId: string, realmId: string) {
        const dungeon = Lookup.dungeons.getObjectByID(dungeonId);

        let dungeonValue: GPValue = {};

        for (const reward of dungeon.rewards) {
            if (reward instanceof OpenableItem) {
                const chestValue = this.computeDropTableValue(reward.dropTable);

                for (const [id, value] of Object.entries(chestValue)) {
                    dungeonValue[id] ??= 0;
                    dungeonValue[id] += value * this.doubling * this.chanceForNoLoot;
                }
            } else {
                const value = this.getItemValue(reward);

                dungeonValue[value.currency.id] ??= 0;
                dungeonValue[value.currency.id] += value.quantity * this.doubling * this.chanceForNoLoot;
            }
        }

        // Shards
        if (this.godDungeonIds.includes(dungeonId)) {
            let shardCount = 0;
            const shard = dungeon.monsters[0].bones?.item;

            for (const monster of dungeon.monsters) {
                shardCount += monster.bones.quantity;
            }

            shardCount *= this.doubling;
            shardCount *= this.chanceForNoLoot;

            if (Global.stores.plotter.state.shardsToChests && shard) {
                const shardItem = game.items.getObjectByID(shard.id);

                if (shardItem) {
                    const itemUpgrades = game.bank.itemUpgrades.get(shardItem);

                    if (itemUpgrades?.length && itemUpgrades[0]) {
                        const itemUpgrade = itemUpgrades[0];
                        const chest = itemUpgrade.upgradedItem as OpenableItem;
                        const required = itemUpgrade.itemCosts[0]?.quantity;

                        if (chest) {
                            const chestValue = this.computeDropTableValue(chest.dropTable);

                            for (const [id, value] of Object.entries(chestValue)) {
                                dungeonValue[id] ??= 0;
                                dungeonValue[id] += (shardCount / required) * value;
                            }
                        }
                    }
                }
            } else {
                const shardValue = this.getItemValue(shard);
                dungeonValue[shardValue.currency.id] ??= 0;
                dungeonValue[shardValue.currency.id] += shardCount * shardValue.quantity;
            }
        }

        if (Global.game.combat.player.modifiers.allowSignetDrops && realmId !== 'melvorItA:Abyssal') {
            const signet = Global.game.items.getObjectByID('melvorD:Signet_Ring_Half_B');
            const signetValue = this.getItemValue(signet);

            let signetDropChance = 0;

            for (const monster of dungeon.monsters) {
                signetDropChance += signetValue.quantity * this.getSignetDropRate(monster);
            }

            signetDropChance = signetDropChance / dungeon.monsters.length;

            dungeonValue[signetValue.currency.id] ??= 0;
            dungeonValue[signetValue.currency.id] += signetDropChance;
        }

        return dungeonValue;
    }

    private static computeStrongholdValue(strongholdId: string, realmId: string) {
        const stronghold = Lookup.strongholds.getObjectByID(strongholdId);

        let strongholdValue: GPValue = {};

        const rewards = stronghold.tiers[stronghold.mcsTier].rewards;

        for (const reward of rewards?.items ?? []) {
            if (reward.item instanceof OpenableItem) {
                const chestValue = this.computeDropTableValue(reward.item.dropTable);

                for (const [id, value] of Object.entries(chestValue)) {
                    strongholdValue[id] ??= 0;
                    strongholdValue[id] += value * this.doubling * this.chanceForNoLoot;
                }
            } else {
                const itemValue = this.getItemValue(reward.item);

                strongholdValue[itemValue.currency.id] ??= 0;
                strongholdValue[itemValue.currency.id] += itemValue.quantity * this.doubling * this.chanceForNoLoot;
            }
        }

        for (const [id] of Object.entries(strongholdValue)) {
            strongholdValue[id] ??= 0;
            strongholdValue[id] *= rewards.chance / 100;
        }

        if (Global.game.combat.player.modifiers.allowSignetDrops && realmId !== 'melvorItA:Abyssal') {
            const signet = Global.game.items.getObjectByID('melvorD:Signet_Ring_Half_B');
            const signetValue = this.getItemValue(signet);

            let signetDropChance = 0;

            for (const monster of stronghold.monsters) {
                signetDropChance += signetValue.quantity * this.getSignetDropRate(monster);
            }

            signetDropChance = signetDropChance / stronghold.monsters.length;

            strongholdValue[signetValue.currency.id] ??= 0;
            strongholdValue[signetValue.currency.id] += signetDropChance;
        }

        return strongholdValue;
    }

    private static computeDepthValue(depthId: string, realmId: string) {
        const depth = Lookup.depths.getObjectByID(depthId);

        let depthValue: GPValue = {};

        for (const reward of depth.rewards ?? []) {
            if (reward instanceof OpenableItem) {
                const chestValue = this.computeDropTableValue(reward.dropTable);

                for (const [id, value] of Object.entries(chestValue)) {
                    depthValue[id] ??= 0;
                    depthValue[id] += value * this.doubling * this.chanceForNoLoot;
                }
            } else {
                const itemValue = this.getItemValue(reward);

                depthValue[itemValue.currency.id] ??= 0;
                depthValue[itemValue.currency.id] += itemValue.quantity * this.doubling * this.chanceForNoLoot;
            }
        }

        if (Global.game.combat.player.modifiers.allowSignetDrops && realmId !== 'melvorItA:Abyssal') {
            const signet = Global.game.items.getObjectByID('melvorD:Signet_Ring_Half_B');
            const signetValue = this.getItemValue(signet);

            let signetDropChance = 0;

            for (const monster of depth.monsters) {
                signetDropChance += signetValue.quantity * this.getSignetDropRate(monster);
            }

            signetDropChance = signetDropChance / depth.monsters.length;

            depthValue[signetValue.currency.id] ??= 0;
            depthValue[signetValue.currency.id] += signetDropChance;
        }

        return depthValue;
    }

    private static getItemValue(item: AnyItem): { currency: Currency & { id: string }; quantity: number } {
        if (item === undefined) {
            Global.logger.error(`Unexpected item ${item} in Drops.getItemValue`);
            return { currency: Global.game.gp as Currency & { id: string }, quantity: 0 };
        }

        return item.sellsFor;
    }

    private static emptyGPValue() {
        const weight: GPValue = {};

        weight[Global.game.gp.id] = 0;

        return weight;
    }

    private static getMonsterDropChance(monsterId: string, data: SimulationData) {
        if (!data) {
            return;
        }

        if (Global.stores.plotter.state.selectedDrop === this.noneItem) {
            return (this.doubling * this.chanceForNoLoot) / data.killTimeS;
        }

        const dropCount = this.getAverageDropAmount(monsterId);
        const itemDoubleChance = this.doubling * this.chanceForNoLoot;

        return (dropCount * itemDoubleChance) / data.killTimeS;
    }

    private static getDungeonDropChance(dungeon: Dungeon, data: SimulationData) {
        if (!data) {
            return;
        }

        if (Global.stores.plotter.state.selectedDrop === Drops.noneItem) {
            return (this.doubling * this.chanceForNoLoot) / data.killTimeS;
        }

        const dropCount = this.getDungeonAverageDropAmount(dungeon);
        const itemDoubleChance = this.doubling * this.chanceForNoLoot;

        return (dropCount * itemDoubleChance) / data.killTimeS;
    }

    private static getStrongholdDropChance(stronghold: Stronghold, data: SimulationData) {
        if (!data) {
            return;
        }

        if (Global.stores.plotter.state.selectedDrop === Drops.noneItem) {
            return (this.doubling * this.chanceForNoLoot) / data.killTimeS;
        }

        const dropCount = this.getStrongholdAverageDropAmount(stronghold);
        const itemDoubleChance = this.doubling * this.chanceForNoLoot;

        return (dropCount * itemDoubleChance) / data.killTimeS;
    }

    private static getMonsterListAverageDropRate(
        key: PlotKey,
        data: SimulationData,
        monsters: Monster[],
        dungeonId: string = undefined
    ) {
        if (!data) {
            return;
        }

        let drops = 0;
        let killTime = 0;

        for (const monster of monsters) {
            const simId = Global.simulation.simId(monster.id, dungeonId);
            const monsterData = Global.simulation.monsterSimData[simId];

            if (!monsterData?.simSuccess) {
                continue;
            }

            drops += monsterData[key] * monsterData.killTimeS;
            killTime += monsterData.killTimeS;
        }

        return drops / killTime;
    }

    private static getAverageDropAmount(monsterId: string) {
        let averageDropAmt = 0;

        // regular drops
        averageDropAmt += this.getAverageRegularDropAmount(monsterId);
        // bone drops
        averageDropAmt += this.getAverageBoneDropAmount(monsterId);
        // barrier dust drops
        averageDropAmt += this.getAverageBarrierDustDropAmount(monsterId);

        return averageDropAmt;
    }

    private static getDungeonAverageDropAmount(dungeon: Dungeon) {
        let averageDropAmt = 0;

        const expected = this.addLoot({
            drops: dungeon.rewards.map(reward => ({ weight: 1, item: reward, minQuantity: 1, maxQuantity: 1 })),
            totalWeight: 1
        });

        averageDropAmt += expected;

        return averageDropAmt;
    }

    private static getStrongholdAverageDropAmount(stronghold: Stronghold) {
        let averageDropAmt = 0;

        const rewards = stronghold.tiers[stronghold.mcsTier].rewards;

        const expected = this.addLoot({
            drops: rewards.items.map((reward: any) => ({
                weight: rewards.chance,
                item: reward.item,
                minQuantity: reward.quantity,
                maxQuantity: reward.quantity
            })),
            totalWeight: 100
        });

        averageDropAmt += expected;

        return averageDropAmt;
    }

    private static getAverageRegularDropAmount(monsterId: string) {
        const monster = Lookup.monsters.getObjectByID(monsterId)!;

        // get expected loot per drop
        const expected = this.addLoot(monster.lootTable);

        return expected * this.computeLootChance(monsterId);
    }

    private static getAverageBoneDropAmount(monsterId: string) {
        const monster = Lookup.monsters.getObjectByID(monsterId);

        if (monster.bones === undefined) {
            return 0;
        }

        let amount = monster.bones.quantity ?? 1;

        if (Global.game.combat.player.modifiers.doubleBoneDrops > 0) {
            amount *= 2;
        }

        if (monster.bones.item.id === Global.stores.plotter.state.selectedDrop) {
            return amount;
        }

        return 0;
        // TODO: some bones are upgradable, e.g. Earth_Shard
    }

    private static getAverageBarrierDustDropAmount(monsterId: string) {
        const monster = Lookup.monsters.getObjectByID(monsterId);

        if (!monster.hasBarrier || 'melvorAoD:Barrier_Dust' !== Global.stores.plotter.state.selectedDrop) {
            return 0;
        }

        const enemy = new SimClasses.SimEnemy(Global.game.combat, Global.game);

        enemy.modifiers.init(Global.game);
        enemy.setNewMonster(monster);

        return Math.max(Math.floor(enemy.stats.maxBarrier / numberMultiplier / 20), 1);
    }

    private static addLoot(lootTable: Partial<DropTable>) {
        if (lootTable === undefined) {
            return 0;
        }

        let expected = 0;
        let totalWeight = lootTable.totalWeight;

        for (const drop of lootTable.drops) {
            const chance = drop.weight / totalWeight;

            if (drop.item?.id === Global.stores.plotter.state.selectedDrop) {
                expected += chance * this.averageQuantity(drop);
            }

            // @ts-ignore
            expected += this.addLoot(drop.lootTable ?? drop.item?.dropTable) * chance;
        }

        return expected;
    }

    private static averageQuantity(drop: DropTableElement) {
        if (drop.maxQuantity === drop.minQuantity) {
            return drop.maxQuantity;
        }

        if (drop.maxQuantity === 0) {
            return 0;
        }

        return (drop.maxQuantity + drop.minQuantity) / 2;
    }
}

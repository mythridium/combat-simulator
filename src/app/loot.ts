/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>
    Modified Copyright (C) <2020> <Visua0>
    Modified Copyright (C) <2020, 2021> <G. Miclotte>
    Modified Copyright (C) <2022, 2023> <Broderick Hyman>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { App } from './app';
import { MICSR } from './micsr';
import { SimClasses } from './sim';
import { Simulator } from './simulator';
import { Util } from './util';

/**
 * Loot class, used for all loot related work
 */
export class Loot {
    alchHighValueItems: any;
    alchemyCutoff: any;
    app: App;
    computingAlchCount: any;
    convertShards: any;
    godDungeonIDs: any;
    lootBonus: any;
    noLoot: number;
    modifiers: any;
    petSkill: any;
    player: any;
    sellBones: any;
    simulator: Simulator;
    micsr: MICSR;

    constructor(app: App, simulator: Simulator) {
        this.app = app;
        this.micsr = app.micsr;
        this.player = this.app.player;
        this.modifiers = this.player.modifiers;
        this.simulator = simulator;

        this.lootBonus = Util.averageDoubleMultiplier(this.app.combatData.combatStats.lootBonusPercent);

        this.noLoot = this.getNoLootChance();

        // Pet Settings
        this.petSkill = 'Attack';
        // Options for GP/s calculations
        this.sellBones = false; // True or false
        this.convertShards = false;

        // ids of god dungeons
        this.godDungeonIDs = [
            'melvorF:Air_God_Dungeon',
            'melvorF:Water_God_Dungeon',
            'melvorF:Earth_God_Dungeon',
            'melvorF:Fire_God_Dungeon'
        ];

        // alchemy settings
        this.alchHighValueItems = false;
        this.alchemyCutoff = 10000;
        this.computingAlchCount = false;
    }

    getNoLootChance() {
        return 1 - this.player.modifiers.increasedChanceToReceiveNoCombatDrops / 100;
    }

    /**
     * Computes the chance that a monster will drop loot when it dies
     * @param {number} monsterID
     * @return {number}
     */
    computeLootChance(monsterID: string) {
        const lootChance = this.micsr.monsters.getObjectByID(monsterID)!.lootChance;

        return lootChance !== undefined ? lootChance / 100 : 1;
    }

    /**
     * Computes the value of a monsters drop table respecting the loot sell settings
     */
    computeMonsterLootTableValue(monsterID: string) {
        const lootTable = this.micsr.monsters.getObjectByID(monsterID)!.lootTable;
        let gpWeight = 0;

        lootTable.drops.forEach((drop: any) => {
            let avgQty = this.avgQuantity(drop);
            if (drop.item.dropTable) {
                gpWeight += this.computeDropTableValue(drop.item.dropTable) * avgQty;
            } else {
                const herbConvertChance = this.micsr.showModifiersInstance.getModifierValue(
                    this.modifiers,
                    'ChanceToConvertSeedDrops'
                );
                let value = this.getItemValue(drop.item);
                if (herbConvertChance > 0 && drop.item.tier === 'Herb' && drop.item.type === 'Seeds') {
                    avgQty += 3;
                    value =
                        this.getItemValue(drop.item) * (1 - herbConvertChance) +
                        this.getItemValue(drop.item.grownItemID) * herbConvertChance;
                }
                gpWeight += value * drop.weight * avgQty;
            }
        });

        return (gpWeight / lootTable.totalWeight) * this.lootBonus * this.noLoot;
    }

    computeDropTableValue(dropTable: any) {
        if (dropTable === undefined) {
            return 0;
        }
        let gpWeight = 0;
        dropTable.drops.forEach((drop: any) => {
            gpWeight += this.avgQuantity(drop) * this.getItemValue(drop.item) * drop.weight;
        });
        return gpWeight / dropTable.totalWeight;
    }

    /**
     * Computes the average amount of GP earned when killing a monster, respecting the loot sell settings
     * @param {number} monsterID
     * @return {number}
     */
    computeMonsterValue(monsterID: string) {
        const monster = this.micsr.monsters.getObjectByID(monsterID)!;
        // compute value from selling drops
        let monsterValue = 0;
        // loot and signet are affected by loot chance
        monsterValue += this.computeMonsterLootTableValue(monsterID);
        const signetDropRate = this.getSignetDropRate(monster);
        if (this.modifiers.allowSignetDrops) {
            monsterValue +=
                this.getItemValue(this.micsr.items.getObjectByID('melvorD:Signet_Ring_Half_B')) * signetDropRate;
        } else {
            monsterValue +=
                this.getItemValue(this.micsr.items.getObjectByID('melvorD:Gold_Topaz_Ring')) * signetDropRate;
        }
        monsterValue *= this.computeLootChance(monsterID);
        monsterValue *= this.noLoot;
        // bones drops are not affected by loot chance
        const bones = this.micsr.monsters.getObjectByID(monsterID)!.bones;
        if (this.sellBones && !this.modifiers.autoBurying && bones) {
            monsterValue += this.getItemValue(bones.item) * this.lootBonus * this.noLoot * bones.quantity;
        }
        return monsterValue;
    }

    /**
     * Computes the average amount of GP earned when killing a monster in a dungeon, respecting the loot sell settings
     * @param {number} monsterID
     * @return {number}
     */
    computeDungeonMonsterValue(monsterID: string) {
        let gpPerKill = 0;
        if (this.godDungeonIDs.includes(this.app.viewedDungeonID)) {
            const boneQty = this.micsr.monsters.getObjectByID(monsterID)!.bones?.quantity ?? 1;
            const shard = this.micsr.monsters.getObjectByID(monsterID)!.bones;

            if (this.convertShards) {
                if (shard) {
                    const shardItem = game.items.getObjectByID(shard.item.id);

                    if (shardItem) {
                        const itemUpgrades = game.bank.itemUpgrades.get(shardItem);

                        if (itemUpgrades?.length && itemUpgrades[0]) {
                            const itemUpgrade = itemUpgrades[0];
                            const chest = itemUpgrade.upgradedItem as OpenableItem;
                            const required = itemUpgrade.itemCosts[0]?.quantity;

                            if (chest) {
                                gpPerKill +=
                                    ((boneQty * this.lootBonus * this.noLoot) / required) *
                                    this.computeChestOpenValue(chest);
                            }
                        }
                    }
                }
            } else if (shard) {
                gpPerKill += boneQty * this.lootBonus * this.noLoot * this.getItemValue(shard.item);
            }
        }
        return gpPerKill;
    }

    /**
     * Computes the value of the contents of a chest respecting the loot sell settings
     * @param {number} chestID
     * @return {number}
     */
    computeChestOpenValue(chest: OpenableItem) {
        let gpWeight = 0;
        let totWeight = 0;
        let avgQty;

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

            gpWeight += avgQty * this.getItemValue(drop.item) * drop.weight;
            totWeight += drop.weight;
        }

        return gpWeight / totWeight;
    }

    /**
     * Computes the average amount of GP earned when completing a dungeon, respecting the loot sell settings
     * @param {number} dungeonID
     * @return {number}
     */
    computeDungeonValue(dungeonID: any) {
        const dungeon = this.micsr.dungeons.getObjectByID(dungeonID)!;
        let dungeonValue = 0;
        dungeon.rewards.forEach((reward: any) => {
            if (reward.canOpen) {
                dungeonValue += this.computeDropTableValue(reward.dropTable) * this.lootBonus * this.noLoot;
            } else {
                dungeonValue += this.getItemValue(reward) * this.lootBonus * this.noLoot;
            }
        });
        // Shards
        if (this.godDungeonIDs.includes(dungeonID)) {
            let shardCount = 0;
            const shard = dungeon.monsters[0].bones?.item;
            dungeon.monsters.forEach((monster: any) => {
                shardCount += monster.bones.quantity;
            });
            shardCount *= this.lootBonus;
            shardCount *= this.noLoot;
            if (this.convertShards && shard) {
                const shardItem = game.items.getObjectByID(shard.id);

                if (shardItem) {
                    const itemUpgrades = game.bank.itemUpgrades.get(shardItem);

                    if (itemUpgrades?.length && itemUpgrades[0]) {
                        const itemUpgrade = itemUpgrades[0];
                        const chest = itemUpgrade.upgradedItem as OpenableItem;
                        const required = itemUpgrade.itemCosts[0]?.quantity;

                        if (chest) {
                            dungeonValue += (shardCount / required) * this.computeDropTableValue(chest.dropTable);
                        }
                    }
                }
            } else {
                dungeonValue += shardCount * this.getItemValue(shard);
            }
        }
        if (this.modifiers.allowSignetDrops) {
            dungeonValue +=
                (this.getItemValue(this.micsr.items.getObjectByID('melvorD:Signet_Ring_Half_B')) *
                    dungeon.monsters[dungeon.monsters.length - 1].combatLevel) /
                500000;
        }
        return dungeonValue;
    }

    getItemValue(item: any) {
        if (item === undefined) {
            this.micsr.logger.error(`Unexpected item ${item} in Loot.getItemValue`);
            return 0;
        }
        const value = item.sellsFor;
        const willAlch = this.alchHighValueItems && value >= this.alchemyCutoff;
        if (this.computingAlchCount) {
            return willAlch ? 1 : 0;
        }
        if (willAlch) {
            return this.micsr.actualGame.altMagic.actions.getObjectByID('melvorF:ItemAlchemyIII')!.productionRatio;
            // TODO this.micsr.actualGame.altMagic.actions.getObjectByID('melvorTotH:ItemAlchemyIV').productionRatio;
        }
        return value;
    }

    /**
     * Update all loot related statistics
     */
    update() {
        this.lootBonus = Util.averageDoubleMultiplier(this.app.combatData.combatStats.lootBonusPercent);
        this.noLoot = this.getNoLootChance();
        this.updateGPData();
        this.updateSignetChance();
        this.updateDropChance();
        this.updatePetChance();
    }

    computeValueAlchs(f: any, ...args: any[]) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        const value = this[f](...args);
        this.computingAlchCount = true;
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        const alchTime = (this[f](...args) * game.altMagic.baseInterval) / 1000;
        this.computingAlchCount = false;
        return { value: value, alchTime: alchTime };
    }

    computeGP(data: any, f: any, ...args: any[]) {
        const monsterValue = this.computeValueAlchs(f, ...args);
        const value = monsterValue.value;
        data.alchTimeS = monsterValue.alchTime;
        const excludeAlchTime = data.baseGpPerSecond + value / data.killTimeS;
        data.gpPerSecond = (excludeAlchTime * data.killTimeS) / (data.killTimeS + data.alchTimeS);
    }

    /**
     * Computes the gp/kill and gp/s data for monsters and dungeons and sets those values.
     */
    updateGPData() {
        if (this.app.isViewingDungeon && this.micsr.isDungeonID(this.app.viewedDungeonID)) {
            const dungeonID = this.app.viewedDungeonID!;
            this.micsr.dungeons.getObjectByID(dungeonID)!.monsters.forEach(monster => {
                const monsterID = monster.id;
                const simID = this.simulator.simID(monsterID, dungeonID);
                if (!this.simulator.monsterSimData[simID]) {
                    return;
                }
                this.computeGP(this.simulator.monsterSimData[simID], 'computeDungeonMonsterValue', monsterID);
            });
        } else {
            const updateMonsterGP = (monsterID: string) => {
                if (!this.simulator.monsterSimData[monsterID]) {
                    return;
                }
                if (this.simulator.monsterSimData[monsterID].simSuccess) {
                    this.computeGP(this.simulator.monsterSimData[monsterID], 'computeMonsterValue', monsterID);
                }
            };
            // Regular monsters
            this.micsr.monsterIDs.forEach((monsterID: string) => updateMonsterGP(monsterID));
            // Dungeons
            this.micsr.dungeonIDs.forEach((dungeonID: string) => {
                if (!this.simulator.dungeonSimData[dungeonID]) {
                    return;
                }
                if (this.simulator.dungeonSimData[dungeonID].simSuccess) {
                    this.computeGP(this.simulator.dungeonSimData[dungeonID], 'computeDungeonValue', dungeonID);
                }
            });
            // slayer tasks
            this.micsr.taskIDs.forEach((taskID: string) => {
                this.setMonsterListAverageDropRate(
                    'gpPerSecond',
                    this.simulator.slayerSimData[taskID],
                    this.simulator.slayerTaskMonsters[taskID]
                );
            });
        }
    }

    /**
     * Updates the chance to receive your selected loot when killing monsters
     */
    updateDropChance() {
        const updateMonsterDropChance = (monsterID: string, data: any) => {
            if (!data) {
                return;
            }

            if (this.app.combatData.dropSelected === 'micsr:none') {
                data.dropChance = (this.lootBonus * this.noLoot) / data.killTimeS;
                return;
            }

            const dropCount = this.getAverageDropAmt(monsterID);
            const itemDoubleChance = this.lootBonus * this.noLoot;
            data.dropChance = (dropCount * itemDoubleChance) / data.killTimeS;
        };

        const updateDungeonDropChance = (dungeon: Dungeon, data: any) => {
            if (!data) {
                return;
            }

            if (this.app.combatData.dropSelected === 'micsr:none') {
                data.dropChance = (this.lootBonus * this.noLoot) / data.killTimeS;
                return;
            }

            const dropCount = this.getDungeonAverageDropAmt(dungeon);
            const itemDoubleChance = this.lootBonus * this.noLoot;
            data.dropChance = (dropCount * itemDoubleChance) / data.killTimeS;
        };

        // Set data for monsters in combat zones
        this.micsr.monsterIDs.forEach((monsterID: string) =>
            updateMonsterDropChance(monsterID, this.simulator.monsterSimData[monsterID])
        );
        // compute dungeon drop rates
        this.micsr.dungeons.forEach((dungeon: any) => {
            const monsterList = dungeon.monsters;
            if (this.godDungeonIDs.includes(dungeon.id)) {
                if (this.app.combatData.dropSelected === 'micsr:none') {
                    updateDungeonDropChance(dungeon, this.simulator.dungeonSimData[dungeon.id]);
                } else {
                    dungeon.monsters.forEach((monster: any) => {
                        const simID = this.simulator.simID(monster.id, dungeon.id);
                        updateMonsterDropChance(monster.id, this.simulator.monsterSimData[simID]);
                    });

                    this.setMonsterListAverageDropRate(
                        'dropChance',
                        this.simulator.dungeonSimData[dungeon.id],
                        monsterList,
                        dungeon.id
                    );
                }
            } else {
                const monster = monsterList[monsterList.length - 1];
                updateMonsterDropChance(monster.id, this.simulator.dungeonSimData[dungeon.id]);

                if (dungeon.rewards) {
                    updateDungeonDropChance(dungeon, this.simulator.dungeonSimData[dungeon.id]);
                }
            }
        });
        // compute auto slayer drop rates
        this.micsr.taskIDs.forEach((taskID: string) => {
            this.setMonsterListAverageDropRate(
                'dropChance',
                this.simulator.slayerSimData[taskID],
                this.simulator.slayerTaskMonsters[taskID]
            );
        });
    }

    setMonsterListAverageDropRate(property: any, simData: any, monsterList: any, dungeonID: any = undefined) {
        if (!simData) {
            return;
        }
        let drops = 0;
        let killTime = 0;

        for (const monster of monsterList) {
            const simID = this.simulator.simID(monster.id, dungeonID);
            if (!this.simulator.monsterSimData[simID]) {
                return;
            }
            drops += this.simulator.monsterSimData[simID][property] * this.simulator.monsterSimData[simID].killTimeS;
            killTime += this.simulator.monsterSimData[simID].killTimeS;
        }

        simData[property] = drops / killTime;
    }

    avgQuantity(drop: any) {
        if (drop.maxQuantity === drop.minQuantity) {
            return drop.maxQuantity;
        }
        // avg qty = min + (max - min + 1) / (max - min)
        return (
            new Array(1000)
                .fill(0)
                .map(() => rollInteger(drop.minQuantity, drop.maxQuantity))
                .reduce((a, b) => a + b) / 1000
        );
    }

    addLoot(lootTable: any) {
        if (lootTable === undefined) {
            return 0;
        }
        let expected = 0;
        let totalWeight = lootTable.totalWeight;
        lootTable.drops.forEach((drop: any) => {
            const chance = drop.weight / totalWeight;
            if (drop.item.id === this.app.combatData.dropSelected) {
                expected += chance * this.avgQuantity(drop);
            }
            expected += this.addLoot(drop.lootTable ?? drop.item?.dropTable) * chance;
        });
        return expected;
    }

    getAverageRegularDropAmt(monsterID: string) {
        const monster = this.micsr.monsters.getObjectByID(monsterID)!;
        // get expected loot per drop
        const expected = this.addLoot(monster.lootTable);
        return expected * this.computeLootChance(monsterID);
    }

    getAverageBoneDropAmt(monsterID: string) {
        const monsterData = this.micsr.monsters.getObjectByID(monsterID)!;
        const bones = monsterData.bones;
        if (bones === undefined) {
            return 0;
        }
        let amt = monsterData.bones?.quantity ?? 1;

        if (this.app.player.modifiers.doubleBoneDrops > 0) {
            amt *= 2;
        }

        if (bones.item.id === this.app.combatData.dropSelected) {
            return amt;
        }
        return 0;
        // TODO: some bones are upgradable, e.g. Earth_Shard
    }

    getAverageBarrierDustDropAmt(monsterID: string) {
        const monster = this.micsr.monsters.getObjectByID(monsterID)!;

        if (!(<any>monster).hasBarrier || 'melvorAoD:Barrier_Dust' !== this.app.combatData.dropSelected) {
            return 0;
        }

        const enemy = new SimClasses.SimEnemy(this.micsr.game.combat, this.micsr.game);
        enemy.setMonster(monster);

        let qty = Math.max(Math.floor((<any>enemy).stats.maxBarrier / numberMultiplier / 20), 1);

        return qty;
    }

    getAverageDungeonDropAmt(dungeon: Dungeon) {
        // get expected loot per drop
        const expected = this.addLoot({
            drops: dungeon.rewards.map((reward: any) => ({ weight: 1, item: reward, minQuantity: 1, maxQuantity: 1 })),
            totalWeight: 1
        });
        return expected;
    }

    getAverageDropAmt(monsterID: string) {
        let averageDropAmt = 0;

        // regular drops
        averageDropAmt += this.getAverageRegularDropAmt(monsterID);
        // bone drops
        averageDropAmt += this.getAverageBoneDropAmt(monsterID);
        // barrier dust drops
        averageDropAmt += this.getAverageBarrierDustDropAmt(monsterID);

        return averageDropAmt;
    }

    getDungeonAverageDropAmt(dungeon: Dungeon) {
        let averageDropAmt = 0;

        averageDropAmt += this.getAverageDungeonDropAmt(dungeon);

        return averageDropAmt;
    }

    /**
     * Updates the chance to receive signet when killing monsters
     */
    updateSignetChance() {
        if (this.app.isViewingDungeon && this.micsr.isDungeonID(this.app.viewedDungeonID)) {
            this.micsr.dungeons.getObjectByID(this.app.viewedDungeonID!)!.monsters.forEach((monster: any) => {
                if (!this.simulator.monsterSimData[monster.id]) {
                    return;
                }
                this.simulator.monsterSimData[monster.id].signetChance = 0;
            });
        } else {
            const updateMonsterSignetChance = (monsterID: string, data: any) => {
                if (!data) {
                    return;
                }
                const monster = this.micsr.monsters.getObjectByID(monsterID)!;
                if (this.modifiers.allowSignetDrops && data.simSuccess) {
                    if (this.app.timeMultiplier === -1) {
                        data.signetChance = 100 * this.getSignetDropRate(monster);
                    } else {
                        data.signetChance =
                            100 *
                            (1 -
                                Math.pow(
                                    1 - this.getSignetDropRate(monster),
                                    this.app.timeMultiplier / data.killTimeS
                                ));
                    }
                } else {
                    data.signetChance = 0;
                }
            };
            // Set data for monsters in combat zones
            this.micsr.monsterIDs.forEach((monsterID: string) =>
                updateMonsterSignetChance(monsterID, this.simulator.monsterSimData[monsterID])
            );
            // Set data for dungeons
            this.micsr.dungeons.forEach((dungeon: any) => {
                const monster = dungeon.monsters[dungeon.monsters.length - 1];
                updateMonsterSignetChance(monster.id, this.simulator.dungeonSimData[dungeon.id]);
            });
            // Set data for auto slayer
            this.micsr.taskIDs.forEach((taskID: string) => {
                // TODO: signet rolls for auto slayer
                this.simulator.slayerSimData[taskID].signetChance = NaN;
            });
        }
    }

    /**
     * Calculates the drop chance of a signet half from a monster
     * @param {number} monster
     * @return {number}
     */
    getSignetDropRate(monster: Monster) {
        return monster.combatLevel / 500000;
    }

    /** Updates the chance to get a pet for the given skill*/
    updatePetChance() {
        const petSkills = ['Hitpoints', 'Prayer'];
        if (this.player.isSlayerTask) {
            petSkills.push('Slayer');
        }
        const attackType = this.player.attackType;
        switch (attackType) {
            case 'melee':
                switch (this.player.attackStyles.melee) {
                    case 'Stab':
                        petSkills.push('Attack');
                        break;
                    case 'Slash':
                        petSkills.push('Strength');
                        break;
                    case 'Block':
                        petSkills.push('Defence');
                        break;
                }
                break;
            case 'ranged':
                petSkills.push('Ranged');
                if (this.player.attackStyles.ranged === 'Longrange') {
                    petSkills.push('Defence');
                }
                break;
            case 'magic':
                petSkills.push('Magic');
                if (this.player.attackStyles.magic === 'Defensive') {
                    petSkills.push('Defence');
                }
                break;
        }
        if (petSkills.includes(this.petSkill)) {
            const petSkillLevel = this.player.skillLevel[this.micsr.skillIDs[this.petSkill]] + 1;
            for (const simID in this.simulator.monsterSimData) {
                const simResult = this.simulator.monsterSimData[simID];
                const timeMultiplier = this.app.timeMultiplier === -1 ? simResult.killTimeS : this.app.timeMultiplier;
                simResult.petChance = 100 * (1 - this.chanceForNoPet(simResult, timeMultiplier, petSkillLevel));
            }
            this.micsr.dungeons.forEach((dungeon: any, dungeonID: string) => {
                const dungeonResult = this.simulator.dungeonSimData[dungeonID];
                let chanceToNotGet = 1;
                dungeon.monsters.forEach((monsterID: string) => {
                    const simID = this.simulator.simID(monsterID, dungeonID);
                    const simResult = this.simulator.monsterSimData[simID];
                    const timeMultiplier =
                        this.app.timeMultiplier === -1 ? simResult.killTimeS : this.app.timeMultiplier;
                    const timeRatio = simResult.killTimeS / dungeonResult.killTimeS;
                    const chanceToNotGetFromMonster = this.chanceForNoPet(
                        simResult,
                        timeMultiplier * timeRatio,
                        petSkillLevel
                    );
                    simResult.petChance = 100 * (1 - chanceToNotGetFromMonster);
                    chanceToNotGet *= chanceToNotGetFromMonster;
                });
                dungeonResult.petChance = 100 * (1 - chanceToNotGet);
            });
            this.micsr.slayerTaskData.forEach((_: any, taskID: any) => {
                const taskResult = this.simulator.slayerSimData[taskID];
                const sumTime = taskResult.killTimeS * this.simulator.slayerTaskMonsters[taskID].length;
                let chanceToNotGet = 1;
                this.simulator.slayerTaskMonsters[taskID].forEach((monsterID: string) => {
                    const simResult = this.simulator.monsterSimData[monsterID];
                    const timeMultiplier =
                        this.app.timeMultiplier === -1 ? simResult.killTimeS : this.app.timeMultiplier;
                    const timeRatio = simResult.killTimeS / sumTime;
                    chanceToNotGet *= this.chanceForNoPet(simResult, timeMultiplier * timeRatio, petSkillLevel);
                });
                taskResult.petChance = 100 * (1 - chanceToNotGet);
            });
        } else {
            for (const simID in this.simulator.monsterSimData) {
                const simResult = this.simulator.monsterSimData[simID];
                simResult.petChance = 0;
            }
            for (const dungeonID in this.simulator.dungeonSimData) {
                const simResult = this.simulator.dungeonSimData[dungeonID];
                simResult.petChance = 0;
            }
            for (const taskID in this.simulator.slayerSimData) {
                const simResult = this.simulator.slayerSimData[taskID];
                simResult.petChance = 0;
            }
        }
    }

    chanceForNoPet(simResult: any, timeMultiplier: any, petSkillLevel: any) {
        let chanceToNotGet = 1;
        for (const interval in simResult.petRolls) {
            const rollsPerSecond = simResult.petRolls[interval];
            const rolls = timeMultiplier * rollsPerSecond;
            // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
            const chancePerRoll = (interval * petSkillLevel) / 25e9;
            chanceToNotGet *= Math.pow(1 - chancePerRoll, rolls);
        }
        return chanceToNotGet;
    }
}

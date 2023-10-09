export interface Categories {
    empty: EquipmentItem[];
    ring: EquipmentItem[];
    amulet: EquipmentItem[];
    consumable: EquipmentItem[];
    gem: EquipmentItem[];
    cape: EquipmentItem[];
    passive: {
        magic: EquipmentItem[];
        slayer: EquipmentItem[];
        other: EquipmentItem[];
    };
    summon: {
        combat: EquipmentItem[];
        nonCombat: EquipmentItem[];
    };
    helmet: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    platebody: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    gloves: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    platelegs: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    boots: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    shield: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
        magic: EquipmentItem[];
        other: EquipmentItem[];
    };
    weapon: {
        melee: { one: EquipmentItem[]; two: EquipmentItem[] };
        ranged: { one: EquipmentItem[]; two: EquipmentItem[] };
        magic: { one: EquipmentItem[]; two: EquipmentItem[] };
    };
    quiver: {
        arrows: EquipmentItem[];
        bolts: EquipmentItem[];
        javelins: EquipmentItem[];
        throwingKnives: EquipmentItem[];
        other: EquipmentItem[];
    };
}

interface CategorySection extends Section {
    sortBy?: (item: EquipmentItem) => number | string;
}

interface Section {
    title: string;
    items: EquipmentItem[];
}

export type Sections = {
    [key in SlotTypes]: Section[];
};

type GearSlotTypes = Extract<SlotTypes, 'Helmet' | 'Platebody' | 'Gloves' | 'Platelegs' | 'Boots' | 'Shield'>;

export class EquipmentCategories {
    public readonly sections: Sections;

    private readonly categories: Categories;
    private readonly gearSlots: SlotTypes[] = ['Helmet', 'Platebody', 'Gloves', 'Platelegs', 'Boots', 'Shield'];
    private readonly force = {
        ['melee']: ['melvorF:Slayer_Helmet_Basic', 'melvorF:Slayer_Platebody_Basic'],
        ['ranged']: ['melvorF:Slayer_Cowl_Basic', 'melvorF:Slayer_Leather_Body_Basic'],
        ['magic']: ['melvorF:Slayer_Wizard_Hat_Basic', 'melvorF:Slayer_Wizard_Robes_Basic', 'melvorF:Enchanted_Shield']
    };

    constructor() {
        this.categories = game.items.equipment.reduce(
            (result, item) => {
                // ignore all golbin raid items, not useful at all.
                if (item.golbinRaidExclusive) {
                    return result;
                }

                if (item.id === 'melvorD:Empty_Equipment') {
                    result.empty.push(item);
                }

                if (item.validSlots.includes('Passive')) {
                    const isPassiveMagic = this.isPassiveMagic(item);
                    const isPassiveSlayer = this.isPassiveSlayer(item);

                    if (isPassiveSlayer) {
                        result.passive.slayer.push(item);
                    }

                    if (isPassiveMagic && !isPassiveSlayer) {
                        result.passive.magic.push(item);
                    }

                    if (!isPassiveMagic && !isPassiveSlayer) {
                        result.passive.other.push(item);
                    }
                }

                if (item.validSlots.includes('Amulet')) {
                    result.amulet.push(item);
                }

                if (item.validSlots.includes('Ring')) {
                    result.ring.push(item);
                }

                if (item.validSlots.includes('Consumable')) {
                    result.consumable.push(item);
                }

                if (item.validSlots.includes('Gem')) {
                    result.gem.push(item);
                }

                if (item.validSlots.includes('Cape')) {
                    result.cape.push(item);
                }

                if (item.validSlots.includes('Summon1') || item.validSlots.includes('Summon2')) {
                    const key = this.isCombatSummon(item) ? 'combat' : 'nonCombat';
                    result.summon[key].push(item);
                }

                if (this.isGear(item)) {
                    for (const slot of this.gearSlots) {
                        if (item.validSlots.includes(slot)) {
                            const key = this.toLowerCaseKey(slot);
                            const type = this.getGearType(item);

                            result[key][type].push(item);
                        }
                    }
                }

                if (this.isWeapon(item)) {
                    const hand = this.is2Hand(item) ? 'two' : 'one';

                    if (item.attackType === 'melee') {
                        result.weapon.melee[hand].push(item);
                    }

                    if (item.attackType === 'ranged' && item.ammoType === undefined) {
                        result.weapon.ranged[hand].push(item);
                    }

                    if (item.attackType === 'magic') {
                        result.weapon.magic[hand].push(item);
                    }
                }

                if (item.validSlots.includes('Quiver')) {
                    if (item.ammoType === undefined || item.ammoType === AmmoTypeID.None) {
                        result.quiver.other.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.Arrows) {
                        result.quiver.arrows.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.Bolts) {
                        result.quiver.bolts.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.Javelins) {
                        result.quiver.javelins.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.ThrowingKnives) {
                        result.quiver.throwingKnives.push(item);
                    }
                }

                return result;
            },
            {
                weapon: { melee: { one: [], two: [] }, ranged: { one: [], two: [] }, magic: { one: [], two: [] } },
                quiver: { arrows: [], bolts: [], javelins: [], throwingKnives: [], other: [] },
                passive: { magic: [], slayer: [], other: [] },
                summon: { combat: [], nonCombat: [] },
                helmet: { melee: [], ranged: [], magic: [], other: [] },
                platebody: { melee: [], ranged: [], magic: [], other: [] },
                gloves: { melee: [], ranged: [], magic: [], other: [] },
                platelegs: { melee: [], ranged: [], magic: [], other: [] },
                boots: { melee: [], ranged: [], magic: [], other: [] },
                shield: { melee: [], ranged: [], magic: [], other: [] },
                cape: [],
                ring: [],
                consumable: [],
                amulet: [],
                gem: [],
                empty: []
            } as Categories
        );

        this.sections = this.getSections();
    }

    private getSections() {
        const sections: Sections = {} as any;

        for (const slot of game.combat.player.equipment.slotArray.map(slot => slot.type)) {
            const slotSections = this.createSections(slot);

            sections[slot] = slotSections.map(section => {
                this.sort(section.items, section.sortBy);

                return { title: section.title, items: section.items };
            });
        }

        return sections;
    }

    private createSections(slot: SlotTypes) {
        const sections: CategorySection[] = [];

        switch (slot) {
            case 'Amulet':
                sections.push({ title: 'Amulets', items: this.categories.amulet });
                break;
            case 'Ring':
                sections.push({ title: 'Rings', items: this.categories.ring });
                break;
            case 'Consumable':
                sections.push({ title: 'Consumable', items: this.categories.consumable });
                break;
            case 'Gem':
                sections.push({ title: 'Gems', items: this.categories.gem });
                break;
            case 'Cape':
                sections.push({ title: 'Capes', items: this.categories.cape });
                break;
            case 'Quiver':
                sections.push({
                    title: 'Arrows',
                    items: this.categories.quiver.arrows,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: 'Bolts',
                    items: this.categories.quiver.bolts,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: 'Javelins',
                    items: this.categories.quiver.javelins,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: 'Throwing Knives',
                    items: this.categories.quiver.throwingKnives,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                if (this.categories.quiver.other?.length) {
                    sections.push({ title: 'Other', items: this.categories.quiver.other });
                }
                break;
            case 'Helmet':
            case 'Platebody':
            case 'Gloves':
            case 'Platelegs':
            case 'Boots':
            case 'Shield':
                const key = this.toLowerCaseKey(slot);

                sections.push({
                    title: 'Melee',
                    items: this.categories[key].melee,
                    sortBy: item => this.getItemLevelRequirement(item, 'Defence')
                });

                sections.push({
                    title: 'Ranged',
                    items: this.categories[key].ranged,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: 'Magic',
                    items: this.categories[key].magic,
                    sortBy: item => this.getItemLevelRequirement(item, 'Magic')
                });

                if (this.categories[key].other?.length) {
                    sections.push({ title: 'Other', items: this.categories[key].other });
                }
                break;
            case 'Weapon':
                sections.push({
                    title: '1H Melee',
                    items: this.categories.weapon.melee.one,
                    sortBy: item => this.getItemLevelRequirement(item, 'Attack')
                });

                sections.push({
                    title: '2H Melee',
                    items: this.categories.weapon.melee.two,
                    sortBy: item => this.getItemLevelRequirement(item, 'Attack')
                });

                sections.push({
                    title: '1H Ranged',
                    items: this.categories.weapon.ranged.one,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: '2H Ranged',
                    items: this.categories.weapon.ranged.two,
                    sortBy: item => this.getItemLevelRequirement(item, 'Ranged')
                });

                sections.push({
                    title: '1H Magic',
                    items: this.categories.weapon.magic.one,
                    sortBy: item => this.getItemLevelRequirement(item, 'Magic')
                });

                sections.push({
                    title: '2H Magic',
                    items: this.categories.weapon.magic.two,
                    sortBy: item => this.getItemLevelRequirement(item, 'Magic')
                });
                break;
            case 'Summon1':
            case 'Summon2':
                sections.push({
                    title: 'Combat Familiars',
                    items: this.categories.summon.combat,
                    sortBy: item => this.getItemLevelRequirement(item, 'Summoning')
                });

                sections.push({
                    title: 'Non Combat Familiars',
                    items: this.categories.summon.nonCombat,
                    sortBy: item => this.getItemLevelRequirement(item, 'Summoning')
                });
                break;
            case 'Passive':
                sections.push({
                    title: 'Magic',
                    items: this.categories.passive.magic,
                    sortBy: item => this.getItemLevelRequirement(item, 'Magic')
                });

                sections.push({
                    title: 'Slayer',
                    items: this.categories.passive.slayer,
                    sortBy: item => this.getItemLevelRequirement(item, 'Slayer')
                });

                sections.push({ title: 'Other', items: this.categories.passive.other });
                break;
        }

        sections.push({ title: 'Empty', items: this.categories.empty });

        return sections;
    }

    private sort(items: EquipmentItem[], sortBy?: (item: EquipmentItem) => number | string) {
        const sortKey = (item: EquipmentItem) => sortBy(item) || 0;
        const sortFunc = sortByOrder<any, any>(game.bank.defaultSortOrder, 'item');

        items.sort((a: EquipmentItem, b: EquipmentItem) => {
            if (!sortBy) {
                return this.sortByExpansion(a, b) || sortFunc({ item: a }, { item: b });
            }

            const keyA = sortKey(a);
            const keyB = sortKey(b);

            if (typeof keyA === 'string' && typeof keyB === 'string') {
                return keyA.localeCompare(keyB) || this.sortByExpansion(a, b) || sortFunc({ item: a }, { item: b });
            }

            if (typeof keyA === 'number' && typeof keyB === 'number') {
                return keyA - keyB || this.sortByExpansion(a, b) || sortFunc({ item: a }, { item: b });
            }

            return this.sortByExpansion(a, b) || sortFunc({ item: a }, { item: b });
        });
    }

    private toLowerCaseKey(key: SlotTypes) {
        return key.toLowerCase() as Lowercase<GearSlotTypes>;
    }

    private isGear(item: EquipmentItem) {
        return item.validSlots.some(slot => this.gearSlots.includes(slot));
    }

    private getGearType(item: EquipmentItem) {
        if (!item.equipRequirements?.length) {
            return 'other';
        }

        if (
            this.force['ranged'].includes(item.id) ||
            item.equipRequirements.some(requirement => this.isRequirementFor(requirement, 'Ranged'))
        ) {
            return 'ranged';
        }

        if (
            this.force['magic'].includes(item.id) ||
            item.equipRequirements.some(requirement => this.isRequirementFor(requirement, 'Magic'))
        ) {
            return 'magic';
        }

        if (
            this.force['melee'].includes(item.id) ||
            item.equipRequirements.some(requirement => this.isRequirementFor(requirement, 'Defence')) ||
            item.equipRequirements.some(requirement => this.isRequirementFor(requirement, 'Strength')) ||
            item.equipRequirements.some(requirement => this.isRequirementFor(requirement, 'Attack'))
        ) {
            return 'melee';
        }

        return 'other';
    }

    private isSkillRequirement(requirement: AnyRequirement): requirement is SkillLevelRequirement {
        return requirement.type === 'SkillLevel';
    }

    private isRequirementFor(requirement: AnyRequirement, stat: SkillName) {
        return this.isSkillRequirement(requirement) && requirement.skill.localID === stat;
    }

    private getItemLevelRequirement(item: EquipmentItem, skill: SkillName) {
        if (skill === game.summoning.localID) {
            return game.summoning.recipesByProduct.get(item)?.level ?? 0;
        }

        if (!item.equipRequirements?.length) {
            return 0;
        }

        const skillRequirement = item.equipRequirements.find(
            requirement => this.isSkillRequirement(requirement) && requirement.skill.localID === skill
        ) as SkillLevelRequirement;

        return skillRequirement?.level ?? 0;
    }

    private sortByExpansion(a: EquipmentItem, b: EquipmentItem) {
        const expansionOrder = ['melvorD', 'melvorF', 'melvorTotH', 'melvorAoD'];

        const indexA = expansionOrder.indexOf(a.name);
        const indexB = expansionOrder.indexOf(b.name);

        // If one of the names is not in the order array, move it to the end.
        if (indexA === -1) {
            return 1;
        }

        if (indexB === -1) {
            return -1;
        }

        // Compare the indices in the order array.
        return indexA - indexB;
    }

    private isPassiveMagic(item: EquipmentItem) {
        if (item.modifiers === undefined) {
            return false;
        }

        const equipmentStatBonuses = item.equipmentStats
            .filter(stat => stat.key === 'magicAttackBonus' || (stat.key === 'magicDamageBonus' && stat.value > 0))
            .map(stat => stat.value);

        return (
            equipmentStatBonuses.length > 0 ||
            item.modifiers.increasedMinAirSpellDmg > 0 ||
            item.modifiers.increasedMinEarthSpellDmg > 0 ||
            item.modifiers.increasedMinFireSpellDmg > 0 ||
            item.modifiers.increasedMinWaterSpellDmg > 0
        );
    }

    private isPassiveSlayer(item: EquipmentItem) {
        if (item.modifiers === undefined) {
            return false;
        }

        if (
            item.modifiers.increasedSkillXP &&
            item.modifiers.increasedSkillXP.filter(stat => stat.skill === game.slayer).length > 0
        ) {
            return true;
        }

        return (
            item.modifiers.increasedSlayerAreaEffectNegationFlat > 0 ||
            item.modifiers.increasedDamageToSlayerTasks > 0 ||
            item.modifiers.increasedDamageToSlayerAreaMonsters > 0 ||
            item.modifiers.increasedSlayerTaskLength > 0 ||
            item.modifiers.increasedSlayerCoins > 0
        );
    }

    private isWeapon(item: EquipmentItem): item is WeaponItem {
        return item instanceof WeaponItem;
    }

    private is2Hand(item: WeaponItem) {
        return item.occupiesSlots.includes('Shield');
    }

    private isCombatSummon(item: EquipmentItem) {
        return item.equipmentStats.find(stat => stat.key === 'summoningMaxhit') !== undefined;
    }
}

import { Global } from 'src/app/global';
import { SlotType } from './equipment';

export interface Categories {
    ring: EquipmentItem[];
    amulet: EquipmentItem[];
    consumable: {
        player: EquipmentItem[];
        monster: EquipmentItem[];
        nonCombat: EquipmentItem[];
    };
    gem: EquipmentItem[];
    cape: EquipmentItem[];
    passive: {
        melee: EquipmentItem[];
        ranged: EquipmentItem[];
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
    enhancement1: EquipmentItem[];
    enhancement2: EquipmentItem[];
    enhancement3: EquipmentItem[];
    food: {
        food: FoodItem[];
        perfect: FoodItem[];
    };
}

interface CategorySection extends Section {
    sortBy?: (a: EquipmentItem, b: EquipmentItem) => number;
    ignoreExpansionSort?: boolean;
}

interface Section {
    title: string;
    items: (EquipmentItem | FoodItem)[];
}

export type Sections = {
    [key in string]: Section[];
};

type GearSlotTypes = 'Helmet' | 'Platebody' | 'Gloves' | 'Platelegs' | 'Boots' | 'Shield';

class IgnoreMap {
    private map = new Map<string, string[]>();

    public set(values: string[], key: string[]) {
        for (const value of values) {
            this.map.set(value, key);
        }

        return this;
    }

    public get(key: string) {
        return this.map.get(key);
    }

    public has(key: string) {
        return this.map.has(key);
    }
}

interface ExpansionLookup {
    [index: string]: string | undefined;
}

export abstract class EquipmentController {
    private static sections: Sections;

    private static readonly gearSlots: GearSlotTypes[] = [
        'Helmet',
        'Platebody',
        'Gloves',
        'Platelegs',
        'Boots',
        'Shield'
    ];

    private static readonly expansionLookup: ExpansionLookup = {
        demo: 'melvord',
        full: 'melvorf',
        toth: 'melvortoth',
        aod: 'melvoraod',
        ita: 'melvorita',
        'throne of the herald': 'melvortoth',
        'atlas of discovery': 'melvoraod',
        'into the abyss': 'melvorita'
    };

    private static readonly force = {
        ['melee']: ['melvorF:Slayer_Helmet_Basic', 'melvorF:Slayer_Platebody_Basic'],
        ['ranged']: ['melvorF:Slayer_Cowl_Basic', 'melvorF:Slayer_Leather_Body_Basic'],
        ['magic']: [
            'melvorF:Slayer_Wizard_Hat_Basic',
            'melvorF:Slayer_Wizard_Robes_Basic',
            'melvorF:Enchanted_Shield',
            'melvorTotH:Freezing_Touch_Body'
        ],
        ['other']: ['melvorF:Sand_Treaders', 'melvorAoD:Elusive_Boots']
    };

    private static ignoreUntilFound = new IgnoreMap()
        .set(['melvorItA:Old_Dusty_Mitt', 'melvorItA:Eternity_Mitt'], ['melvorItA:Old_Dusty_Mitt'])
        .set(
            [
                'melvorItA:Eternity_Sword_Uncharged',
                'melvorItA:Eternity_Staff_Uncharged',
                'melvorItA:Eternity_Bow_Uncharged'
            ],
            ['melvorItA:Eternity_Mitt']
        )
        .set(['melvorItA:Eternity_Sword'], ['melvorItA:Eternity_Sword_Uncharged'])
        .set(['melvorItA:Eternity_Staff'], ['melvorItA:Eternity_Staff_Uncharged'])
        .set(['melvorItA:Eternity_Bow'], ['melvorItA:Eternity_Bow_Uncharged'])
        .set(['melvorItA:Celestial_Ray', 'melvorItA:Celestial_Ray_Perfect'], ['melvorItA:Eternity_Mitt']);

    public static init() {
        const categories = Global.game.items.equipment.reduce(
            (result, item) => {
                // ignore all golbin raid items, not useful at all.
                if (item.golbinRaidExclusive) {
                    return result;
                }

                if (item.id === 'melvorD:Empty_Equipment' || item.id === 'melvorD:DEBUG_ITEM') {
                    return result;
                }

                if (this.ignoreUntilFound.has(item.id)) {
                    const toBeFound = this.ignoreUntilFound.get(item.id);
                    const isFound = toBeFound.every(
                        itemId => Global.melvor.stats.itemFindCount(Global.melvor.items.getObjectByID(itemId)) > 0
                    );

                    if (!isFound) {
                        return result;
                    }
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Passive')) {
                    const isPassiveSlayer = this.isPassiveSlayer(item);
                    const isGear = this.isGear(item);

                    if (isPassiveSlayer) {
                        result.passive.slayer.push(item);
                    }

                    if (!isPassiveSlayer && isGear) {
                        result.passive[this.getGearType(item)].push(item);
                    }

                    if (!isPassiveSlayer && !isGear) {
                        result.passive.other.push(item);
                    }
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Amulet')) {
                    result.amulet.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Ring')) {
                    result.ring.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Consumable')) {
                    const player = ['PlayerAttack', 'PlayerSummonAttack', 'PrayerPointConsumption', 'RuneConsumption'];
                    const monster = ['EnemyAttack', 'MonsterKilled', 'MonsterSpawned'];

                    const isPlayer = item.consumesOn?.some(consume => player.includes(consume.type));
                    const isMonster = item.consumesOn?.some(consume => monster.includes(consume.type));

                    if (isPlayer) {
                        result.consumable.player.push(item);
                    }

                    if (isMonster) {
                        result.consumable.monster.push(item);
                    }

                    if (!isPlayer && !isMonster) {
                        result.consumable.nonCombat.push(item);
                    }
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Gem')) {
                    result.gem.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Enhancement1')) {
                    result.enhancement1.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Enhancement2')) {
                    result.enhancement2.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Enhancement3')) {
                    result.enhancement3.push(item);
                }

                if (item.validSlots.some(slot => slot.id === 'melvorD:Cape')) {
                    result.cape.push(item);
                }

                if (
                    item.validSlots.some(slot => slot.id === 'melvorD:Summon1') ||
                    item.validSlots.some(slot => slot.id === 'melvorD:Summon2')
                ) {
                    const key = this.isCombatSummon(item) ? 'combat' : 'nonCombat';
                    result.summon[key].push(item);
                }

                if (this.isGear(item)) {
                    for (const slotName of this.gearSlots) {
                        if (item.validSlots.some(slot => slot.localID === slotName)) {
                            const key = this.toLowerCaseKey(slotName);
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

                if (item.validSlots.some(slot => slot.id === 'melvorD:Quiver')) {
                    if (item.ammoType === undefined || item.ammoType === AmmoTypeID.None) {
                        result.quiver.other.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.Arrows || item.ammoType === AmmoTypeID.AbyssalArrows) {
                        result.quiver.arrows.push(item);
                    }

                    if (item.ammoType === AmmoTypeID.Bolts || item.ammoType === AmmoTypeID.AbyssalBolts) {
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
                passive: { melee: [], ranged: [], magic: [], slayer: [], other: [] },
                summon: { combat: [], nonCombat: [] },
                helmet: { melee: [], ranged: [], magic: [], other: [] },
                platebody: { melee: [], ranged: [], magic: [], other: [] },
                gloves: { melee: [], ranged: [], magic: [], other: [] },
                platelegs: { melee: [], ranged: [], magic: [], other: [] },
                boots: { melee: [], ranged: [], magic: [], other: [] },
                shield: { melee: [], ranged: [], magic: [], other: [] },
                cape: [],
                ring: [],
                consumable: {
                    player: [],
                    monster: [],
                    nonCombat: []
                },
                amulet: [],
                gem: [],
                enhancement1: [],
                enhancement2: [],
                enhancement3: [],
                food: {
                    food: [],
                    perfect: []
                }
            } as Categories
        );

        for (const item of Global.game.items.food.allObjects) {
            if (item.golbinRaidExclusive) {
                continue;
            }

            if (item.id === 'melvorD:Empty_Food') {
                continue;
            }

            if (this.ignoreUntilFound.has(item.id)) {
                const toBeFound = this.ignoreUntilFound.get(item.id);
                const isFound = toBeFound.every(
                    itemId => Global.melvor.stats.itemFindCount(Global.melvor.items.getObjectByID(itemId)) > 0
                );

                if (!isFound) {
                    continue;
                }
            }

            // the food is perfect if it's found in the product recipe map, but not found as an action.
            const isPerfect =
                Global.game.cooking.productRecipeMap.get(item) !== undefined &&
                Global.game.cooking.actions.getObjectByID(item.id) === undefined;

            if (isPerfect) {
                categories.food.perfect.push(item);
            } else {
                categories.food.food.push(item);
            }
        }

        this.sections = this.getSections(categories);
    }

    public static get(key: string) {
        return this.sections[key];
    }

    public static getEquipmentTooltip(item: EquipmentItem) {
        let tooltip = `<div class="text-left mt-1 mb-1"><div class="text-warning mb-2">${item.name}</div><small class="text-left">`;

        if (item.validSlots.some(slot => slot.id === 'melvorD:Weapon')) {
            tooltip += `<div class="mb-1">Deals <img class="skill-icon-xxs mr-1" src="${
                (<WeaponItem>item).damageType.media
            }"><span class="${(<WeaponItem>item).damageType.spanClass}">${
                (<WeaponItem>item).damageType.name
            }</span></div>`;
        }

        if (item.hasDescription) {
            let description = item.description;

            try {
                item._modifiedDescription = undefined;
                description = item.modifiedDescription;
            } catch {}

            tooltip += `<div class="text-info mt-1 mb-1">${description}</div>`;
        }

        tooltip += getItemSpecialAttackInformation(item);

        const pushBonus = (list: [string, string, string?, string?][], header = '', footer = '', multiplier = 1) => {
            if (!item.equipmentStats) {
                return;
            }

            const statBonuses: string[] = [];

            for (const [name, tag, suffix, damageType] of list) {
                let value = item.equipmentStats
                    .filter(statPair =>
                        damageType
                            ? statPair.key === tag && (<any>statPair).damageType?.id === damageType
                            : statPair.key === tag
                    )
                    .reduce((acc, statPair) => acc + statPair.value, 0);

                if (value !== 0) {
                    statBonuses.push(this.getTooltipStatBonus(tag, name, value * multiplier, suffix));
                    continue;
                }
            }

            if (statBonuses.length) {
                tooltip += header;
                tooltip += statBonuses.map((stat: any) => `<div>${stat}</div>`).join('');
                tooltip += footer;
            }
        };

        pushBonus(
            [
                ['Attack Speed', 'attackSpeed', 's'],
                ['Melee Strength', 'meleeStrengthBonus'],
                ['Stab', 'stabAttackBonus'],
                ['Slash', 'slashAttackBonus'],
                ['Block', 'blockAttackBonus'],
                ['Ranged Strength', 'rangedStrengthBonus'],
                ['Ranged Attack', 'rangedAttackBonus'],
                ['Magic Damage', 'magicDamageBonus', '%'],
                ['Magic Attack', 'magicAttackBonus']
            ],
            `<div class="mt-2">Offence:</div><span class="mb-1">`,
            '</span>'
        );

        pushBonus(
            [
                ['Damage Reduction', 'resistance', '%', 'melvorD:Normal'],
                ['Abyssal Resistance', 'resistance', '%', 'melvorItA:Abyssal'],
                ['Melee Defence', 'meleeDefenceBonus'],
                ['Ranged Defence', 'rangedDefenceBonus'],
                ['Magic Defence', 'magicDefenceBonus']
            ],
            `<div class="mt-2">Defence:</div><span class="mb-1">`,
            '</span>'
        );

        pushBonus(
            [['Summoning Max Hit (Normal Damage)', 'summoningMaxhit', undefined, 'melvorD:Normal']],
            `<div class="mt-1">`,
            '</div>',
            10
        );

        pushBonus(
            [['Summoning Max Hit (Abyssal Damage)', 'summoningMaxhit', undefined, 'melvorItA:Abyssal']],
            `<div class="mt-1">`,
            '</div>',
            10
        );

        if (item.equipRequirements) {
            const requirements: string[] = [];
            const levelRequirements = item.equipRequirements.filter(
                requirement => requirement.type === 'SkillLevel'
            ) as SkillLevelRequirement[];

            const abyssalLevelRequirements = item.equipRequirements.filter(
                requirement => requirement.type === 'AbyssalLevel'
            ) as AbyssalLevelRequirement[];

            for (const requirement of levelRequirements.filter((_, index) => index <= 4)) {
                requirements.push(`Level ${requirement.level} ${requirement.skill.name}`);
            }

            for (const requirement of abyssalLevelRequirements.filter((_, index) => index <= 4)) {
                requirements.push(`Level ${requirement.level} Abyssal ${requirement.skill.name}`);
            }

            if (requirements.length !== levelRequirements.length + abyssalLevelRequirements.length) {
                requirements.push('And more...');
            }

            if (requirements.length) {
                tooltip += `<div class="mt-2">Requires:</div><div class="text-warning">${requirements
                    .map(requirement => `<div>${requirement}</div>`)
                    .join('')}</div>`;
            }
        }

        tooltip += '</small></div>';
        return tooltip;
    }

    public static getTooltipStatBonus(key: string, stat: string, bonus: number, suffix = '') {
        return `<span style="white-space: nowrap;" class="text-${bonus > 0 ? 'success">+' : 'danger">'}${
            key === 'attackSpeed' ? formatFixed(bonus / 1000, 2) : bonus
        }${suffix} ${stat}</span>`;
    }

    public static isMatch(item: EquipmentItem | FoodItem, search: string) {
        let isMatch = false;

        const expansion = this.expansionLookup[search];

        if (expansion && item.namespace.toLowerCase() === expansion) {
            isMatch = true;
        }

        if (item._namespace.isModded && item.namespace.toLowerCase() === search) {
            isMatch = true;
        }

        if (item instanceof WeaponItem && item.damageType.name.toLowerCase().includes(search)) {
            isMatch = true;
        }

        if (item.name.toLowerCase().includes(search)) {
            isMatch = true;
        }

        try {
            // some artefacts throw dig site error, we don't care
            if (
                item.hasDescription &&
                item.description !== '' &&
                item.modifiedDescription.toLowerCase().includes(search)
            ) {
                isMatch = true;
            }
        } catch {}

        if (item instanceof EquipmentItem) {
            const special = getItemSpecialAttackInformation(item);

            if (special.toLowerCase().includes(search)) {
                if (
                    item instanceof WeaponItem &&
                    Global.game.damageTypes.allObjects
                        .map(type => type.name.toLowerCase())
                        .some(damageType => damageType.includes(search))
                ) {
                    if (item.damageType.name.toLowerCase().includes(search)) {
                        isMatch = true;
                    }
                } else {
                    isMatch = true;
                }
            }
        }

        const stats = Array.from((<EquipmentItem>item).equipmentStats?.values() ?? [])
            .filter(stat => stat.value > 0)
            .map(stat => Equipment.getEquipStatDescription(stat))
            .join(' ');

        if (stats.toLowerCase().includes(search)) {
            isMatch = true;
        }

        return isMatch;
    }

    private static getSections(categories: Categories) {
        const sections: Sections = {} as any;

        for (const slot of Global.game.combat.player.equipment.equippedArray.map(slot => slot.slot)) {
            const slotSections = this.createSections(slot.localID, categories);

            sections[slot.id] = slotSections.map(section => {
                this.sort(section.items, section.sortBy, section.ignoreExpansionSort);

                return { title: section.title, items: section.items };
            });
        }

        const slotSections = this.createSections('Food', categories);

        sections['Food'] = slotSections.map(section => {
            this.sort(section.items, section.sortBy, section.ignoreExpansionSort);

            return { title: section.title, items: section.items };
        });

        return sections;
    }

    private static createSections(slot: string, categories: Categories) {
        const sections: CategorySection[] = [];

        switch (slot) {
            case 'Food':
                sections.push({
                    title: 'Food',
                    items: categories.food.food,
                    sortBy: (a, b) =>
                        this.sortByNumber((<FoodItem>(<unknown>a)).healsFor, (<FoodItem>(<unknown>b)).healsFor)
                });

                sections.push({
                    title: 'Perfect Food',
                    items: categories.food.perfect,
                    sortBy: (a, b) =>
                        this.sortByNumber((<FoodItem>(<unknown>a)).healsFor, (<FoodItem>(<unknown>b)).healsFor)
                });
                break;
            case 'Amulet':
                sections.push({ title: 'Amulets', items: categories.amulet });
                break;
            case 'Ring':
                sections.push({ title: 'Rings', items: categories.ring });
                break;
            case 'Consumable':
                sections.push({
                    title: 'Player Events',
                    items: categories.consumable.player,
                    ignoreExpansionSort: true
                });
                sections.push({
                    title: 'Monster Events',
                    items: categories.consumable.monster,
                    ignoreExpansionSort: true
                });
                sections.push({
                    title: 'Non Combat',
                    items: categories.consumable.nonCombat,
                    ignoreExpansionSort: true
                });
                break;
            case 'Gem':
                sections.push({ title: 'Gems', items: categories.gem });
                break;
            case 'Enhancement1':
                sections.push({ title: 'Enhancement 1', items: categories.enhancement1 });
                break;
            case 'Enhancement2':
                sections.push({ title: 'Enhancement 2', items: categories.enhancement2 });
                break;
            case 'Enhancement3':
                sections.push({ title: 'Enhancement 3', items: categories.enhancement3 });
                break;
            case 'Cape':
                sections.push({ title: 'Capes', items: categories.cape });
                break;
            case 'Quiver':
                sections.push({
                    title: 'Arrows',
                    items: categories.quiver.arrows,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: 'Bolts',
                    items: categories.quiver.bolts,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: 'Javelins',
                    items: categories.quiver.javelins,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: 'Throwing Knives',
                    items: categories.quiver.throwingKnives,
                    sortBy: this.sortBySkill('Ranged')
                });

                if (categories.quiver.other?.length) {
                    sections.push({ title: 'Other', items: categories.quiver.other });
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
                    items: categories[key].melee,
                    sortBy: this.sortBySkill('Defence')
                });

                sections.push({
                    title: 'Ranged',
                    items: categories[key].ranged,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: 'Magic',
                    items: categories[key].magic,
                    sortBy: this.sortBySkill('Magic')
                });

                if (categories[key].other?.length) {
                    sections.push({ title: 'Other', items: categories[key].other });
                }
                break;
            case 'Weapon':
                sections.push({
                    title: '1H Melee',
                    items: categories.weapon.melee.one,
                    sortBy: this.sortBySkill('Attack')
                });

                sections.push({
                    title: '2H Melee',
                    items: categories.weapon.melee.two,
                    sortBy: this.sortBySkill('Attack')
                });

                sections.push({
                    title: '1H Ranged',
                    items: categories.weapon.ranged.one,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: '2H Ranged',
                    items: categories.weapon.ranged.two,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: '1H Magic',
                    items: categories.weapon.magic.one,
                    sortBy: this.sortBySkill('Magic')
                });

                sections.push({
                    title: '2H Magic',
                    items: categories.weapon.magic.two,
                    sortBy: this.sortBySkill('Magic')
                });
                break;
            case 'Summon1':
            case 'Summon2':
                sections.push({
                    title: 'Combat Familiars',
                    items: categories.summon.combat,
                    sortBy: this.sortBySkill('Summoning')
                });

                sections.push({
                    title: 'Non Combat Familiars',
                    items: categories.summon.nonCombat,
                    sortBy: this.sortBySkill('Summoning')
                });
                break;
            case 'Passive':
                sections.push({
                    title: 'Melee',
                    items: categories.passive.melee,
                    sortBy: this.sortBySkill('Defence')
                });

                sections.push({
                    title: 'Ranged',
                    items: categories.passive.ranged,
                    sortBy: this.sortBySkill('Ranged')
                });

                sections.push({
                    title: 'Magic',
                    items: categories.passive.magic,
                    sortBy: this.sortBySkill('Magic')
                });

                sections.push({
                    title: 'Slayer',
                    items: categories.passive.slayer,
                    sortBy: this.sortBySkill('Slayer')
                });

                sections.push({ title: 'Other', items: categories.passive.other });
                break;
        }

        return sections;
    }

    private static sort(
        items: (EquipmentItem | FoodItem)[],
        sortBy?: ((a: EquipmentItem | FoodItem, b: EquipmentItem | FoodItem) => number) | undefined,
        ignoreExpansionSort = false
    ) {
        const sortFunc = sortByOrder<any, any>(Global.game.bank.defaultSortOrder, 'item');

        items.sort((a: EquipmentItem, b: EquipmentItem) => {
            if (!sortBy) {
                return ignoreExpansionSort
                    ? sortFunc({ item: a }, { item: b })
                    : this.sortByExpansion(a, b) || sortFunc({ item: a }, { item: b });
            }

            let sorted = sortBy(a, b);

            if (!sorted) {
                sorted = sortFunc({ item: a }, { item: b });
            }

            if (!sorted && !ignoreExpansionSort) {
                sorted = this.sortByExpansion(a, b);
            }

            return sorted;
        });
    }

    private static sortByNumber(keyA: number, keyB: number) {
        return keyA - keyB;
    }

    private static sortBySkill(skill: string) {
        return (a: EquipmentItem, b: EquipmentItem) => {
            const skillA = this.getItemLevelRequirement(a, skill);
            const skillB = this.getItemLevelRequirement(b, skill);

            let sorted = this.sortByNumber(skillA, skillB);

            if (!sorted) {
                const skillA = this.getItemAbyssalLevelRequirement(a, skill);
                const skillB = this.getItemAbyssalLevelRequirement(b, skill);

                sorted = this.sortByNumber(skillA, skillB);
            }

            return sorted;
        };
    }

    private static toLowerCaseKey(key: string) {
        return key.toLowerCase() as Lowercase<GearSlotTypes>;
    }

    private static isGear(item: EquipmentItem) {
        return item.validSlots.some(slot => this.gearSlots.includes(slot.localID as GearSlotTypes));
    }

    private static getGearType(item: EquipmentItem) {
        if (this.force['other'].includes(item.id)) {
            return 'other';
        }

        if (
            this.force['ranged'].includes(item.id) ||
            item.equipRequirements?.some(requirement => this.isRequirementFor(requirement, 'Ranged'))
        ) {
            return 'ranged';
        }

        if (
            this.force['magic'].includes(item.id) ||
            item.equipRequirements?.some(requirement => this.isRequirementFor(requirement, 'Magic'))
        ) {
            return 'magic';
        }

        if (
            this.force['melee'].includes(item.id) ||
            item.equipRequirements?.some(requirement => this.isRequirementFor(requirement, 'Defence')) ||
            item.equipRequirements?.some(requirement => this.isRequirementFor(requirement, 'Strength')) ||
            item.equipRequirements?.some(requirement => this.isRequirementFor(requirement, 'Attack'))
        ) {
            return 'melee';
        }

        return 'other';
    }

    private static isSkillRequirement(requirement: AnyRequirement): requirement is SkillLevelRequirement {
        return requirement.type === 'SkillLevel';
    }

    private static isAbyssalRequirement(requirement: AnyRequirement): requirement is AbyssalLevelRequirement {
        return requirement.type === 'AbyssalLevel';
    }

    private static isRequirementFor(requirement: AnyRequirement, stat: string) {
        return this.isSkillRequirement(requirement) && requirement.skill.localID === stat;
    }

    private static getItemLevelRequirement(item: EquipmentItem, skill: string) {
        if (skill === Global.game.summoning.localID) {
            return Global.game.summoning.recipesByProduct.get(item)?.level ?? 0;
        }

        if (!item.equipRequirements?.length) {
            return 0;
        }

        const skillRequirement = item.equipRequirements.find(
            requirement => this.isSkillRequirement(requirement) && requirement.skill.localID === skill
        ) as SkillLevelRequirement;

        return skillRequirement?.level ?? 0;
    }

    private static getItemAbyssalLevelRequirement(item: EquipmentItem, skill: string) {
        if (skill === Global.game.summoning.localID) {
            return Global.game.summoning.recipesByProduct.get(item)?.level ?? 0;
        }

        if (!item.equipRequirements?.length) {
            return 0;
        }

        const abyssalRequirment = item.equipRequirements.find(
            requirement => this.isAbyssalRequirement(requirement) && requirement.skill.localID === skill
        ) as AbyssalLevelRequirement;

        return abyssalRequirment?.level ?? 0;
    }

    private static sortByExpansion(a: EquipmentItem, b: EquipmentItem) {
        const expansionOrder = ['melvorD', 'melvorF', 'melvorItA', 'melvorTotH', 'melvorAoD'];

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

    private static isPassiveSlayer(item: EquipmentItem) {
        if (item.modifiers === undefined) {
            return false;
        }

        const hasModifier = this.hasModifier(
            item,
            'melvorD:flatSlayerAreaEffectNegation',
            'melvorD:damageDealtToSlayerTasks',
            'melvorD:damageDealtToSlayerAreaMonsters',
            'melvorD:increasedSlayerTaskLength'
        );

        const hasModifierQuery = this.hasAnyModifierQuery(
            item,
            entry => (<any>entry).modifier.id === 'melvorD:skillXP' && (<any>entry).skill === Global.game.slayer,
            entry =>
                (<any>entry).modifier.id === 'melvorD:currencyGain' &&
                (<any>entry).currency?.id === 'melvorD:SlayerCoins'
        );

        return hasModifier || hasModifierQuery;
    }

    private static hasModifier(item: EquipmentItem, ...keys: string[]) {
        return item.modifiers.some(entry => keys.includes(entry.modifier.id));
    }

    private static hasAnyModifierQuery(item: EquipmentItem, ...predicates: ((item: EquipmentItem) => boolean)[]) {
        return item.modifiers.some(entry => predicates.some(predicate => predicate(<any>entry)));
    }

    private static isWeapon(item: EquipmentItem): item is WeaponItem {
        return item instanceof WeaponItem;
    }

    private static is2Hand(item: WeaponItem) {
        return item.occupiesSlots.some(slot => slot.id === 'melvorD:Shield');
    }

    private static isCombatSummon(item: EquipmentItem) {
        return item.equipmentStats.find(stat => stat.key === 'summoningMaxhit') !== undefined;
    }
}

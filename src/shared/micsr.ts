import { IDataPackage, PackageTypes } from './_types/data-package';
import { EmptySkillFactory } from './empty-skill';
import { InitGameData } from './transport/type/init';
import { Global } from './global';
import { GamemodeConverter } from './converter/gamemode';
import { AgilityConverter } from './converter/agility';
import { Lookup } from './utils/lookup';
import { cloneDeep } from 'lodash-es';
import { Util } from './util';

export class MICSR {
    private readonly dataPackage: IDataPackage = {};

    async fetchData() {
        await this.fetchDataPackage('Demo', `/assets/data/melvorDemo.json?${DATA_VERSION}`);

        if (cloudManager.hasFullVersionEntitlement) {
            await this.fetchDataPackage('Full', `/assets/data/melvorFull.json?${DATA_VERSION}`);
        }

        if (cloudManager.isAprilFoolsEvent2024Active()) {
            await this.fetchDataPackage('AprilFools2024', `/assets/data/melvorAprilFools2024.json?${DATA_VERSION}`);
        }

        if (cloudManager.hasTotHEntitlementAndIsEnabled) {
            await this.fetchDataPackage('TotH', `/assets/data/melvorTotH.json?${DATA_VERSION}`);
        }

        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
            await this.fetchDataPackage('AoD', `/assets/data/melvorExpansion2.json?${DATA_VERSION}`);
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            await this.fetchDataPackage('ItA', `/assets/data/melvorItA.json?${DATA_VERSION}`);
        }
    }

    async initialize() {
        Global.get.game.registerDataPackage(this.dataPackage['Demo']);

        if (cloudManager.hasFullVersionEntitlement) {
            Global.get.game.registerDataPackage(this.dataPackage['Full']);
        }

        if (cloudManager.isAprilFoolsEvent2024Active()) {
            Global.get.game.registerDataPackage(this.dataPackage['AprilFools2024']);
        }

        if (cloudManager.hasTotHEntitlementAndIsEnabled) {
            Global.get.game.registerDataPackage(this.dataPackage['TotH']);
        }

        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
            Global.get.game.registerDataPackage(this.dataPackage['AoD']);
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            Global.get.game.registerDataPackage(this.dataPackage['ItA']);
        }
    }

    async fetchDataPackage(id: PackageTypes, url: string) {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const href = Util.getOrigin();

        const response = await fetch(`${href}${url}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`Could not fetch data package with URL: ${href}${url}`);
        }

        this.dataPackage[id] = await response.json();
    }

    // any setup that requires a game object
    setup(data: InitGameData) {
        Global.get.currentGamemodeId = data.currentGamemodeId;

        // Modded Namespaces.
        for (const namespace of data.namespaces) {
            if (!Global.get.game.registeredNamespaces.hasNamespace(namespace.name)) {
                Global.get.game.registeredNamespaces.registerNamespace(
                    namespace.name,
                    namespace.displayName,
                    namespace.isModded
                );
            }
        }

        // Modded Skills.
        for (const skill of data.skills) {
            Global.get.game.registerSkill(skill.namespace, EmptySkillFactory(skill.name, skill.media));
        }

        // Modded Data Packages.
        for (const dataPackage of data.dataPackage) {
            Global.get.game.registerDataPackage(cloneDeep(dataPackage));
        }

        // All agility and gamemodes - even base game to account for bypass agility cost mod and modifications of core gamemodes.
        Global.get.game.gamemodes = new NamespaceRegistry(Global.get.game.registeredNamespaces);
        Global.get.game.agility.actions = new NamespaceRegistry(Global.get.game.registeredNamespaces);
        Global.get.game.agility.pillars = new NamespaceRegistry(Global.get.game.registeredNamespaces);

        for (const gamemode of data.gamemodes) {
            // @ts-ignore // TODO: TYPES
            gamemode.gamemode.initialLevelCap = undefined;
            // @ts-ignore // TODO: TYPES
            gamemode.gamemode.initialAbyssalLevelCap = undefined;
            Global.get.game.gamemodes.registerObject(GamemodeConverter.fromData(Global.get.game, gamemode));
        }

        const { obstacles, pillars } = AgilityConverter.fromData(
            Global.get.game,
            data.agility.obstacles,
            data.agility.pillars
        );

        for (const obstacle of obstacles) {
            Global.get.game.agility.actions.registerObject(obstacle);
        }

        for (const pillar of pillars) {
            Global.get.game.agility.pillars.registerObject(pillar);
        }

        const pillarMedia = [
            'assets/media/skills/combat/combat.png',
            'assets/media/main/statistics_header.svg',
            'assets/media/main/coins.png'
        ];

        for (const [index, pillar] of Global.get.game.agility.pillars.allObjects.entries()) {
            Object.defineProperty(pillar, 'media', {
                get: function () {
                    return pillarMedia[index % 3];
                }
            });
        }

        // @ts-ignore // TODO: TYPES
        this._updateStrongholds(Global.get.game.combatAreaCategories.getObjectByID('melvorF:Strongholds')?.areas ?? []);
        this._updateStrongholds(
            // @ts-ignore // TODO: TYPES
            Global.get.game.combatAreaCategories.getObjectByID('melvorItA:AbyssalStrongholds')?.areas ?? []
        );

        const intoTheMist = Lookup.dungeons.getObjectByID('melvorF:Into_the_Mist');

        if (intoTheMist) {
            const mysteriousFigures = intoTheMist.monsters.filter(monster => monster.id !== 'melvorF:RandomITM');

            intoTheMist.monsters = Global.get.game.combat.itmMonsters;
            intoTheMist.monsters.push(...mysteriousFigures);
        }

        const impendingDarkness = Lookup.dungeons.getObjectByID('melvorF:Impending_Darkness');

        if (impendingDarkness) {
            const bane = Lookup.monsters.getObjectByID('melvorF:Bane');
            const baneInstrumentOfFear = Lookup.monsters.getObjectByID('melvorF:BaneInstrumentOfFear');

            if (bane && baneInstrumentOfFear) {
                impendingDarkness.monsters = [
                    this.convertTo(bane, 'melee'),
                    this.convertTo(bane, 'ranged'),
                    this.convertTo(bane, 'magic'),
                    this.convertTo(baneInstrumentOfFear, 'melee'),
                    this.convertTo(baneInstrumentOfFear, 'ranged'),
                    this.convertTo(baneInstrumentOfFear, 'magic')
                ];
            }
        }

        const spiderLair = Lookup.dungeons.getObjectByID('melvorTotH:Lair_of_the_Spider_Queen');

        // fix spider lair being 'buggy' :)
        if (spiderLair) {
            const spiderQueen = spiderLair.monsters.find(monster => monster.id === 'melvorTotH:SpiderQueen');

            spiderLair.monsters = Global.get.game.combat.spiderLairMonsters;
            spiderLair.monsters.push(this.convertTo(spiderQueen, 'melee'));
            spiderLair.monsters.push(this.convertTo(spiderQueen, 'ranged'));
            spiderLair.monsters.push(this.convertTo(spiderQueen, 'magic'));
        }

        for (const skill of Global.get.game.skills.allObjects) {
            Global.get.skillIds[skill.localID] = skill.id;
        }

        // @ts-ignore // TODO: TYPES
        for (const spellbook of Global.get.game.attackSpellbooks.allObjects) {
            for (const damageType of Array.from(spellbook.allowedDamageTypes)) {
                spellbook.allowedDamageTypes.delete(damageType);
                // @ts-ignore // TODO: TYPES
                spellbook.allowedDamageTypes.add(Global.get.game.damageTypes.getObjectByID(damageType.id));
            }
        }

        Global.get.game.postDataRegistration();
    }

    private convertTo(monster: Monster, attackType: AttackType) {
        const copy: Monster = Object.assign(Object.create(Object.getPrototypeOf(monster)), monster);

        copy.attackType = attackType;
        copy._namespace = monster._namespace;
        copy['_localID'] = `${copy.localID}_${attackType}`;
        copy['_name'] = `${copy._name} (${attackType.charAt(0).toUpperCase() + attackType.slice(1)})`;
        copy['_media'] = monster['_media'];

        Object.defineProperty(copy, 'name', {
            get: function () {
                return copy._name;
            }
        });

        Lookup.monsters.registerObject(copy);
        return copy;
    }

    // @ts-ignore // TODO: TYPES
    private _updateStrongholds(strongholdAreas: Strongholds[]) {
        // @ts-ignore // TODO: TYPES
        const strongholds: Stronghold[] = [];
        const strongholdIds: string[] = [];

        for (const stronghold of strongholdAreas) {
            strongholdIds.push(stronghold.id);
            strongholds.push(this.strongholdSplit(stronghold, 'Standard'));
            strongholds.push(this.strongholdSplit(stronghold, 'Augmented'));
            strongholds.push(this.strongholdSplit(stronghold, 'Superior'));
        }

        for (const strongholdId of strongholdIds) {
            Global.get.game.combatAreas.registeredObjects.delete(strongholdId);
            // @ts-ignore // TODO: TYPES
            Global.get.game.combatAreas.strongholds.registeredObjects.delete(strongholdId);

            const index = strongholdAreas.findIndex(stronghold => stronghold.id === strongholdId);

            if (index !== -1) {
                strongholdAreas.splice(index, 1);
            }
        }

        for (const stronghold of strongholds) {
            Global.get.game.combatAreas.registerObject(stronghold);
            strongholdAreas.push(stronghold);
        }
    }

    // @ts-ignore // TODO: TYPES
    private strongholdSplit(stronghold: Stronghold, tier: StrongholdTier) {
        // @ts-ignore // TODO: TYPES
        const copy: Stronghold = Object.assign(Object.create(Object.getPrototypeOf(stronghold)), stronghold);

        copy._namespace = stronghold._namespace;
        copy['_localID'] = `${copy.localID}_${tier}`;
        copy['_name'] = `${copy._name} (${tier})`;
        copy['_media'] = stronghold['_media'];
        copy.mcsTier = tier;

        Object.defineProperty(copy, 'name', {
            get: function () {
                return copy._name;
            }
        });

        return copy;
    }
}
import { IObstacle } from './agility-course';
import { App } from './app';
import { Card } from './card';
import { MICSR } from './micsr';

export class Summary {
    constructor(private readonly micsr: MICSR, private readonly app: App) {}

    public show() {
        const html = this.create();

        SwalLocale.fire({
            titleText: 'Summary',
            html,
            width: 'auto',
            customClass: {
                title: 'swal2-title font-size-lg',
                confirmButton: 'btn btn-primary m-1 font-size-xs',
                container: 'mcs-summary-swal-container'
            }
        });
    }

    private create() {
        const parent = document.createElement('div');

        const container = document.createElement('div');
        container.id = 'mcs-summary-container';
        container.className = 'mcsTabContent';

        this.equipment(container);
        this.agility(container);
        this.outOfCombatStats(container);
        this.monsterInformation(container);

        parent.appendChild(container);

        return parent.innerHTML;
    }

    private equipment(container: HTMLElement) {
        const card = new Card(this.micsr, container, '', '150px', true, undefined, 'mb-3');

        card.addInfoText(this.micsr.game.currentGamemode.name);

        this.items(card);
        this.attackStyle(card);
        this.prayer(card);
        this.potion(card);
        this.magic(card);
        this.cartography(card);

        return card;
    }

    private agility(container: HTMLElement) {
        const card = new Card(this.micsr, container, '', '150px', true, undefined, 'mb-3');

        card.addInfoText('Agility');

        for (const index of this.app.player.course) {
            const obstacle = this.app.agilityCourse.agilityObstacles.find(obstacle => obstacle.index === index);

            if (!obstacle) {
                continue;
            }

            this.obstacle(card, obstacle, this.isObstacleMastered(obstacle));
        }

        this.pillar(card, this.app.player.pillarID, 'No Pillar');
        this.pillar(card, this.app.player.pillarEliteID, 'No Elite Pillar');

        return card;
    }

    private isObstacleMastered(obstacle: IObstacle) {
        const action = this.app.game.agility.actions.find(action => action.id === obstacle.id);
        const mastery = this.app.game.agility.actionMastery.get(action);

        if (!mastery) {
            return false;
        }

        return mastery.level === 99;
    }

    private outOfCombatStats(container: HTMLElement) {
        const statsContainer = document.querySelector('.mcs-out-of-combat-stats-container');

        const stats = Array.from(statsContainer.querySelectorAll('.mcsCCContainer')).map(container => {
            const label = container.querySelector<HTMLElement>('.mcsLabel')?.innerText;
            const value = container.querySelector<HTMLElement>('.mcsNumberOutput')?.innerText;
            const img = container.querySelector<HTMLImageElement>('img')?.src;

            return { label, value, img };
        });

        const card = new Card(
            this.micsr,
            container,
            '',
            '60px',
            true,
            undefined,
            'mcs-summary-out-of-combat-stats-container mb-3'
        );

        card.addSectionTitle('Out-of-Combat Stats');

        for (const { label, value, img } of stats) {
            card.addNumberOutput(label, value, 20, img ?? '', `MCS Summary ${label} CS Output`);
        }

        const food = this.app.player.food?.currentSlot?.item;
        const isEmpty = food?.localID === 'Empty_Food';

        const foodContainer = this.addSimpleGroup(card, isEmpty ? 'No Food' : food.name, [
            isEmpty ? this.app.media.cooking : food.media
        ]);
        foodContainer.container.className += ' mt-2';

        const autoEatText = document.querySelector<HTMLDivElement>('[id="MCS Auto Eat Tier Dropdown"')?.innerText;
        this.addSimpleGroup(card, autoEatText ?? 'No Auto Eat', [this.app.media.autoEat]);

        this.addSimpleGroup(card, 'Manually Eating', [
            this.app.player.isManualEating ? this.micsr.icons.check : this.micsr.icons.cancel,
            this.app.media.cooking
        ]);

        this.addSimpleGroup(card, 'Slayer Task', [
            this.app.player.isSlayerTask ? this.micsr.icons.check : this.micsr.icons.cancel,
            this.app.media.slayer
        ]);

        this.addSimpleGroup(card, 'Solar Eclipse', [
            this.app.player.isSolarEclipse ? this.micsr.icons.check : this.micsr.icons.cancel,
            this.app.media.solarEclipse
        ]);

        const version = card.createLabel(this.micsr.version);

        version.className += ' mcs-summary-version-display';

        card.container.appendChild(version);

        return card;
    }

    private monsterInformation(container: HTMLElement) {
        const card = new Card(
            this.micsr,
            container,
            '',
            '80px',
            true,
            undefined,
            'mcs-summary-simulation-results-container mb-3'
        );

        if (this.app.barSelected) {
            const resultsContainer = document.querySelector<HTMLDivElement>('.mcs-simulation-results-container');

            const monsterName = document.getElementById('MCS Zone Info Title')?.innerText;
            const image = resultsContainer.querySelector<HTMLImageElement>('[id="MCS Info Image"]');
            const info = resultsContainer.querySelector('.mcsInfoText');
            const stats = Array.from(resultsContainer.querySelectorAll('.mcsCCContainer')).map(container => {
                const label = container.querySelector<HTMLElement>('.mcsLabel')?.innerText;
                const value = container.querySelector<HTMLElement>('.mcsNumberOutput');

                return { label, value: value?.innerText, color: value?.style?.color };
            });

            card.addSectionTitle(monsterName);
            card.addImage(image.src, 48, 'MCS Summary Info Image');

            const failureLabel = card.addInfoText(info.textContent);
            failureLabel.style.color = 'red';

            for (const { label, value, color } of stats) {
                const output = card.addNumberOutput(label, value, 20, '', `MCS Summary ${label} Output`);

                if (color) {
                    output.style.color = color;
                }
            }
        } else {
            card.addSectionTitle('Monster/Dungeon Info');
        }
    }

    private items(card: Card) {
        const itemCard = new Card(
            this.micsr,
            card.container,
            '',
            '80px',
            false,
            'mcs-summary-items-outer-container',
            'mcs-summary-items-container mb-2'
        );

        const equipmentRows = [
            [EquipmentSlots.Passive, EquipmentSlots.Helmet, EquipmentSlots.Consumable],
            [EquipmentSlots.Cape, EquipmentSlots.Amulet, EquipmentSlots.Quiver],
            [EquipmentSlots.Weapon, EquipmentSlots.Platebody, EquipmentSlots.Shield],
            cloudManager.hasAoDEntitlement
                ? [EquipmentSlots.Gem, EquipmentSlots.Platelegs]
                : [EquipmentSlots.Platelegs],
            [EquipmentSlots.Gloves, EquipmentSlots.Boots, EquipmentSlots.Ring],
            [EquipmentSlots.Summon1, EquipmentSlots.Summon2]
        ];

        equipmentRows.forEach(row => {
            const newCCContainer = document.createElement('div');
            newCCContainer.className = 'mcsEquipmentImageContainer';

            row.forEach(slotID => {
                const id = `MCS ${EquipmentSlots[slotID]} Image`;
                const containerDiv = document.createElement('div');
                containerDiv.style.position = 'relative';
                containerDiv.style.cursor = 'pointer';
                containerDiv.className = id + ' Container';
                const newImage = document.createElement('img');
                newImage.id = id;
                const slotType = EquipmentSlots[slotID] as SlotTypes;
                const slot = this.app.player.equipment.slots[slotType];

                if (slot.isEmpty) {
                    newImage.src = `assets/media/bank/${
                        (<any>this.micsr.equipmentSlotData)[EquipmentSlots[slotID]].emptyMedia
                    }.png`;
                } else {
                    newImage.src = slot.item.media;
                }

                newImage.className = 'combat-equip-img border border-2x border-rounded-equip border-combat-outline p-1';
                containerDiv.appendChild(newImage);
                newCCContainer.appendChild(containerDiv);
            });

            itemCard.container.appendChild(newCCContainer);
        });

        const summon1 = itemCard.container.querySelector('.MCS.Summon1.Image.Container');

        if (summon1) {
            const synergy = this.app.player.equippedSummoningSynergy;
            const isUnlocked = synergy && this.app.player.isSynergyUnlocked;

            itemCard.addImageToggleWithInfo(
                summon1,
                isUnlocked ? this.app.media.synergy : this.app.media.synergyLock,
                'Summoning Synergy',
                () => {},
                ''
            );
        }

        const levels = this.levels(itemCard);

        itemCard.outerContainer.appendChild(levels);
    }

    private levels(card: Card) {
        const container = document.createElement('div');

        container.className = 'ml-3 mcs-summary-levels-container';

        for (const [skillId, level] of this.app.player.skillLevel.entries()) {
            const skill = this.app.game.skills.find(skill => skill.id === skillId);

            if (!skill) {
                continue;
            }

            if (!this.app.skillKeys.includes(skill.name)) {
                continue;
            }

            container.appendChild(this.imageWithLabel(card, level.toString(), [skill.media]));
        }

        return container;
    }

    private attackStyle(card: Card) {
        const group = this.group();

        group.add(
            this.imageWithLabel(
                card,
                this.app.player.attackStyle?.name ?? 'No Attack Style',
                this.app.player.attackStyle.experienceGain.map(gain => gain.skill.media)
            )
        );

        card.container.appendChild(group.container);

        return group;
    }

    private prayer(card: Card) {
        const group = this.group();

        if (this.app.player.activePrayers.size) {
            for (const prayer of Array.from(this.app.player.activePrayers.values())) {
                group.add(this.imageWithLabel(card, prayer.name, [prayer.media]));
            }
        } else {
            group.add(this.imageWithLabel(card, 'No Prayer', [this.app.media.prayer]));
        }

        card.container.appendChild(group.container);

        return group;
    }

    private potion(card: Card) {
        const group = this.group();

        group.add(
            this.imageWithLabel(card, this.app.player.potion?.name ?? 'No Potion', [
                this.app.player.potion?.media ?? this.app.media.herblore
            ])
        );

        card.container.appendChild(group.container);

        return group;
    }

    private magic(card: Card) {
        const isMagic = this.app.player.attackType === 'magic';

        if (!isMagic) {
            return;
        }

        const group = this.group();

        group.add(
            this.imageWithLabel(card, this.app.player.spellSelection.standard?.name ?? 'No Spell', [
                this.app.media.spellbook
            ])
        );

        group.add(
            this.imageWithLabel(card, this.app.player.spellSelection.curse?.name ?? 'No Curse', [this.app.media.curse])
        );

        group.add(
            this.imageWithLabel(card, this.app.player.spellSelection.aurora?.name ?? 'No Aurora', [
                this.app.media.aurora
            ])
        );

        group.add(
            this.imageWithLabel(card, this.app.player.spellSelection.ancient?.name ?? 'No Ancient', [
                this.app.media.ancient
            ])
        );

        group.add(
            this.imageWithLabel(card, this.app.player.spellSelection.archaic?.name ?? 'No Archaic', [
                this.app.media.archaic
            ])
        );

        card.container.appendChild(group.container);

        return group;
    }

    private cartography(card: Card) {
        if (!cloudManager.hasAoDEntitlement) {
            return;
        }

        const group = this.group();

        this.micsr.game.cartography.worldMaps.forEach(map => {
            const mapHasAnyPoiWithModifiers = map.pointsOfInterest.some(poi => poi.activeModifiers !== undefined);

            if (!mapHasAnyPoiWithModifiers) {
                return;
            }

            group.add(
                this.imageWithLabel(card, `${map.name} - ${map.masteredHexes} Hexes`, [this.app.media.cartography])
            );

            const playerIsOnPoiWithModifiers = map.playerPosition?.pointOfInterest?.activeModifiers !== undefined;

            if (playerIsOnPoiWithModifiers) {
                group.add(
                    this.imageWithLabel(card, map.playerPosition?.pointOfInterest?.name, [
                        map.playerPosition?.pointOfInterest?.media
                    ])
                );
            } else {
                group.add(this.imageWithLabel(card, 'No Point of Interest', [this.app.media.cartography]));
            }
        });

        card.container.appendChild(group.container);

        return group;
    }

    private pillar(card: Card, pillarId: string, noText: string) {
        const pillar =
            this.app.agilityCourse.agilityPillars.find(pillar => pillar.id === pillarId) ||
            this.app.agilityCourse.eliteAgilityPillars.find(pillar => pillar.id === pillarId);

        const group = this.group('mt-2');

        group.add(this.imageWithLabel(card, pillar?.name ?? noText, ['', pillar?.media ?? this.app.media.stamina]));

        card.container.appendChild(group.container);

        return group;
    }

    private obstacle(card: Card, obstacle: IObstacle, isMastered: boolean) {
        const group = this.group(isMastered ? 'mcs-obstacle-is-mastered' : '');

        group.add(this.imageWithLabel(card, obstacle.name, [isMastered ? this.app.media.mastery : '', obstacle.media]));

        card.container.appendChild(group.container);

        return group;
    }

    private addSimpleGroup(card: Card, name: string, media: string[]) {
        const group = this.group(undefined, [this.imageWithLabel(card, name, media)]);

        card.container.appendChild(group.container);

        return group;
    }

    private group(classes?: string, children?: HTMLDivElement[]) {
        const container = document.createElement('div');

        container.className = 'mcs-summary-group';

        if (classes) {
            container.className += ` ${classes}`;
        }

        const result = {
            container,
            add: (child: HTMLDivElement) => {
                container.appendChild(child);
            }
        };

        if (children?.length) {
            children.forEach(result.add);
        }

        return result;
    }

    private imageWithLabel(card: Card, name: string, media?: string[]) {
        const container = document.createElement('div');
        container.className = 'mcs-summary-image-label';

        if (media?.length) {
            for (const img of media) {
                if (!img) {
                    const image = document.createElement('div');

                    image.style.height = '20px';
                    image.style.width = '20px';
                    image.classList.add('mr-2');

                    container.appendChild(image);
                } else {
                    const image = card.createImage(img, 20, 20);

                    image.classList.add('mr-2');

                    container.appendChild(image);
                }
            }
        }

        container.appendChild(card.createLabel(name));

        return container;
    }
}

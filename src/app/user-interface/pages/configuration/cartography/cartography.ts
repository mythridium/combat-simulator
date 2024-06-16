import './cartography.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-cartography': CartographyPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/cartography/cartography.html')
export class CartographyPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _masteryBonusContainer: HTMLDivElement;
    private readonly _pointsOfInterestContainer: HTMLDivElement;

    private readonly _mastery = new Map<string, ButtonImage>();
    private readonly _pointsOfInterest = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-cartography-template'));

        this._masteryBonusContainer = getElementFromFragment(this._content, 'mcs-mastery-bonus-container', 'div');
        this._pointsOfInterestContainer = getElementFromFragment(
            this._content,
            'mcs-points-of-interest-container',
            'div'
        );
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._init();
    }

    public _import(
        worldMapId: string | undefined,
        pointOfInterestId: string | undefined,
        masteryBonuses: [string, number][] | number | undefined
    ) {
        for (const map of Global.game.cartography.worldMaps.allObjects) {
            map.masteredHexes = 0;
            map.setPlayerPosition(map.startingLocation);

            this._updateCartography(map, map.masteredHexes);

            for (const [_, element] of this._pointsOfInterest) {
                element._toggle(false);
            }
        }

        const map = Global.game.cartography.worldMaps.getObjectByID(worldMapId);
        const pointOfInterest = map?.pointsOfInterest.getObjectByID(pointOfInterestId);

        if (!map) {
            Global.logger.error(`Tried to import world map with id '${worldMapId}' but could not find this map.`);
            return;
        }

        if (typeof masteryBonuses === 'number') {
            this._updateCartography(map, masteryBonuses);
        } else if (masteryBonuses.length) {
            for (const [mapId, masteredHexes] of masteryBonuses) {
                const map = Global.game.cartography.worldMaps.getObjectByID(mapId);

                if (map) {
                    this._updateCartography(map, masteredHexes);
                }
            }
        } else {
            for (const map of Global.game.cartography.worldMaps.allObjects) {
                map.masteredHexes = 0;
            }

            for (const [_, element] of this._mastery) {
                element._toggle(false);
            }
        }

        if (pointOfInterest) {
            this._updatePointOfInterest(map, pointOfInterest);
        } else {
            // just move the player back to starting location
            for (const map of Global.game.cartography.worldMaps.allObjects) {
                map.setPlayerPosition(map.startingLocation);
            }

            for (const [_, element] of this._pointsOfInterest) {
                element._toggle(false);
            }
        }
    }

    public _updateTooltips() {
        for (const [poiId, pointOfInterest] of this._pointsOfInterest) {
            let poi: PointOfInterest;

            for (const map of Global.game.cartography.worldMaps.allObjects) {
                for (const pointOfInterest of map.pointsOfInterest.allObjects) {
                    if (`${map.id}-${pointOfInterest.id}` === poiId) {
                        poi = pointOfInterest;
                        break;
                    }
                }
            }

            const tooltip = pointOfInterest.querySelector('[data-mcsTooltipContent]');

            if (tooltip && poi) {
                tooltip.innerHTML = this._getPointOfInterestTooltip(poi);
            }
        }
    }

    private _init() {
        const { pointsOfInterest, maps } = this._getCartographyData();

        for (const map of maps) {
            if (!map.sortedMasteryBonuses.length) {
                continue;
            }

            const mapContainer = createElement('div', { classList: ['mcs-cartography-map-mastery-container'] });
            mapContainer.appendChild(createElement('div', { text: `${map.name} - Mastery` }));

            const masteryContainer = createElement('div', { classList: ['mcs-cartography-mastery-container'] });

            for (const masteryBonus of map.sortedMasteryBonuses) {
                const masteryElement = createElement('mcs-button-image', {
                    attributes: [['data-mcsSrc', Global.game.cartography.media]]
                });

                const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
                tooltipContent.innerHTML = this._getMasteryBonusTooltip(masteryBonus);

                masteryElement.appendChild(tooltipContent);

                masteryElement._on(() => {
                    this._updateCartography(map, masteryBonus.masteredHexes);
                    StatsController.update();
                });

                this._mastery.set(`${map.id}-${masteryBonus.masteredHexes}`, masteryElement);

                masteryContainer.appendChild(masteryElement);
            }

            mapContainer.appendChild(masteryContainer);
            this._masteryBonusContainer.appendChild(mapContainer);
        }

        for (const map of maps) {
            const pois = pointsOfInterest[map.localID];

            const mapContainer = createElement('div', { classList: ['mcs-cartography-map-poi-container'] });
            mapContainer.appendChild(createElement('div', { text: `${map.name} - Points of Interest` }));

            const poiContainer = createElement('div', { classList: ['mcs-cartography-poi-container'] });

            for (const poi of pois) {
                const poiElement = createElement('mcs-button-image', { attributes: [['data-mcsSrc', poi.media]] });

                const tooltipContent = createElement('div', { attributes: [['data-mcsTooltipContent', '']] });
                tooltipContent.innerHTML = this._getPointOfInterestTooltip(poi);

                poiElement.appendChild(tooltipContent);

                poiElement._on(() => {
                    this._updatePointOfInterest(map, poi);
                    StatsController.update();
                });

                this._pointsOfInterest.set(`${map.id}-${poi.id}`, poiElement);
                poiContainer.appendChild(poiElement);
            }

            mapContainer.appendChild(poiContainer);
            this._pointsOfInterestContainer.appendChild(mapContainer);
        }
    }

    private _updateCartography(map: WorldMap, masteredHexes: number) {
        if (masteredHexes === map.masteredHexes) {
            map.masteredHexes = 0;

            for (const masteryBonus of map.sortedMasteryBonuses) {
                masteryBonus.awarded = false;
                this._mastery.get(`${map.id}-${masteryBonus.masteredHexes}`)._toggle(masteryBonus.awarded);
            }
        } else {
            map.masteredHexes = masteredHexes;

            for (const masteryBonus of map.sortedMasteryBonuses) {
                masteryBonus.awarded = masteryBonus.masteredHexes <= map.masteredHexes;
                this._mastery.get(`${map.id}-${masteryBonus.masteredHexes}`)._toggle(masteryBonus.awarded);
            }
        }
    }

    private _updatePointOfInterest(map: WorldMap, poi: PointOfInterest) {
        const currentPoi = map.playerPosition?.pointOfInterest?.id;

        // disable current poi
        if (currentPoi) {
            const poiElement = this._pointsOfInterest.get(`${map.id}-${map.playerPosition.pointOfInterest.id}`);

            if (poiElement) {
                poiElement._toggle(false);
            }
        }

        if (currentPoi !== poi.id) {
            // enable new poi if not the same as the current one
            const poiElement = this._pointsOfInterest.get(`${map.id}-${poi.id}`);

            if (poiElement) {
                poiElement._toggle(true);
            }

            Global.game.cartography.activeMap = map;
            map.setPlayerPosition(poi.hex);
        } else {
            Global.game.cartography.activeMap = map;
            map.setPlayerPosition(map.startingLocation);
        }
    }

    private _getPointOfInterestTooltip(poi: PointOfInterest) {
        const posMult = Global.game.cartography.hasCarthuluPet ? 2 : 1;
        const descriptions = poi.activeStats.describeAsSpans(1, posMult);

        let tooltip = `<div class="text-warning mb-1">${poi.name}</div>`;
        tooltip += '<div class="font-size-xs">';

        for (const description of descriptions) {
            tooltip += `<div>${description.outerHTML}</div>`;
        }

        return tooltip;
    }

    private _getMasteryBonusTooltip(bonus: WorldMapMasteryBonus) {
        let tooltip = `<div class="text-warning mb-1">${bonus.localID} Hexes</div>`;

        if (bonus.stats?.hasStats) {
            const descriptions = bonus.stats.describeAsSpans();

            tooltip += '<div class="font-size-xs">';

            for (const description of descriptions) {
                tooltip += `<div>${description.outerHTML}</div>`;
            }
        }

        tooltip += '</div>';

        return tooltip;
    }

    private _getCartographyData() {
        const pointsOfInterest: { [key: string]: PointOfInterest[] } = {};

        const maps =
            Global.game.cartography?.worldMaps.filter(map =>
                map.pointsOfInterest.some(poi => poi.activeStats?.hasStats)
            ) ?? [];

        for (const map of maps) {
            pointsOfInterest[map.localID] = [];

            for (const poi of map.pointsOfInterest.allObjects) {
                if (poi.activeStats?.hasStats) {
                    pointsOfInterest[map.localID].push(poi);
                }
            }
        }

        return { pointsOfInterest, maps };
    }
}

customElements.define('mcs-cartography', CartographyPage);

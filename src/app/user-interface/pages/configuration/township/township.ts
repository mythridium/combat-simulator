import './township.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Switch } from 'src/app/user-interface/_parts/switch/switch';
import { Global } from 'src/app/global';
import { Lookup } from 'src/shared/utils/lookup';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { ModifierHelper } from 'src/shared/utils/modifiers';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-township': TownshipPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/township/township.html')
export class TownshipPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _solarEclipse: Switch;
    private readonly _eternalDarkness: Switch;

    private readonly _buildings = new Map<string, [HTMLInputElement, HTMLInputElement, HTMLSpanElement]>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-township-template'));

        this._solarEclipse = getElementFromFragment(this._content, 'mcs-township-solar-eclipse', 'mcs-switch');
        this._eternalDarkness = getElementFromFragment(this._content, 'mcs-township-eternal-darkness', 'mcs-switch');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._solarEclipse._toggle(
            Global.game.township.townData.season === Lookup.getSolarEclipse(Global.game.township)
        );

        this._eternalDarkness._toggle(
            Global.game.township.townData.season === Lookup.getEternalDarkness(Global.game.township)
        );

        this._solarEclipse._on(isChecked => {
            this._eternalDarkness._toggle(false);

            Global.game.township.townData.season = isChecked
                ? Lookup.getSolarEclipse(Global.game.township)
                : Global.game.township.defaultSeason;

            StatsController.update();
        });

        this._eternalDarkness._on(isChecked => {
            this._solarEclipse._toggle(false);

            Global.game.township.townData.season = isChecked
                ? Lookup.getEternalDarkness(Global.game.township)
                : Global.game.township.defaultSeason;

            StatsController.update();
        });

        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this._eternalDarkness.style.display = 'none';
        }

        const buildings = this._getBuildings();

        if (buildings?.length) {
            for (const building of buildings) {
                const container = createElement('div', { classList: ['mcs-township-building'] });

                const label = createElement('div', { classList: ['mcs-township-building-label'], text: building.name });
                label.appendChild(createElement('img', { attributes: [['src', building.media]] }));

                container.appendChild(label);

                const stats = createElement('div', { classList: ['mcs-township-stats'] });
                container.appendChild(stats);

                const built = this._createInput(`Built /${building.maxUpgrades}`, building, building.maxUpgrades, true);
                const repair = this._createInput('Repair %', building, 100, false);

                container.appendChild(built.field);
                container.appendChild(repair.field);

                built.input.value = '0';
                repair.input.value = '100';

                const biome = this._getBiome(building);

                if (biome) {
                    biome.buildingEfficiency.set(building, 100);
                }

                this.appendChild(container);

                this._buildings.set(building.id, [built.input, repair.input, stats]);

                this._update(building);
            }
        }
    }

    public _import(isSolarEclipse: boolean, isEternalDarkness: boolean, buildings: Map<string, [number, number]>) {
        if (isSolarEclipse) {
            Global.game.township.townData.season = Lookup.getSolarEclipse(Global.game.township);
        } else if (isEternalDarkness) {
            Global.game.township.townData.season = Lookup.getEternalDarkness(Global.game.township);
        } else {
            Global.game.township.townData.season = Global.game.township.defaultSeason;
        }

        this._solarEclipse._toggle(isSolarEclipse);
        this._eternalDarkness._toggle(isEternalDarkness);

        for (const [id, [built, repair]] of this._buildings) {
            const building = Global.game.township.buildings.getObjectByID(id);

            if (!building) {
                continue;
            }

            const biome = this._getBiome(building);

            if (!biome) {
                continue;
            }

            if (buildings.has(building.id)) {
                const [built, efficiency] = buildings.get(building.id);

                biome.buildingEfficiency.set(building, efficiency ?? 100);
                biome.buildingsBuilt.set(building, built ?? 0);
            } else {
                biome.buildingEfficiency.set(building, 100);
                biome.buildingsBuilt.set(building, 0);
            }

            built.value = biome.buildingsBuilt.get(building).toString();
            repair.value = biome.buildingEfficiency.get(building).toString();

            this._update(building);
        }
    }

    private _getBuildings() {
        // @ts-ignore // TODO: TYPES
        return Global.game.township.buildings.filter(building => ModifierHelper.hasCombatModifiers(building.stats));
    }

    private _getBiome(building: TownshipBuilding) {
        return Global.game.township.biomes.find(
            biome => biome.availableBuildings.find(available => available.id === building.id) !== undefined
        );
    }

    private _createInput(name: string, building: TownshipBuilding, max: number, isBuilt: boolean) {
        const field = createElement('mcs-field', {
            classList: ['mcs-township-building-field'],
            attributes: [['data-mcssmall', '']]
        });
        const label = createElement('span', { attributes: [['slot', 'text']], text: name });
        const input = createElement('input', {
            classList: ['form-control'],
            attributes: [
                ['type', 'number'],
                ['min', '0'],
                ['max', max.toString()]
            ]
        });

        input.oninput = event => this._onInput(event, building, isBuilt);

        field.append(label, input);

        return { field, input };
    }

    private _onInput(event: Event, building: TownshipBuilding, isBuilt: boolean) {
        // @ts-ignore
        let newValue = parseInt(event.currentTarget.value);
        const input = event.currentTarget as HTMLInputElement;

        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (newValue < min) {
            input.value = min.toString();
            newValue = min;
        }

        if (newValue > max) {
            input.value = max.toString();
            newValue = max;
        }

        if (newValue >= min && newValue <= max) {
            const biome = this._getBiome(building);

            if (biome) {
                if (isBuilt) {
                    biome.buildingsBuilt.set(building, newValue);
                } else {
                    biome.buildingEfficiency.set(building, newValue);
                }

                this._update(building);
                StatsController.update();
            }
        }
    }

    private _update(building: TownshipBuilding) {
        // @ts-ignore // TODO: TYPES
        Global.game.township.setBuildingProvidedStatsMultiplier(building);

        const [_field, _input, stats] = this._buildings.get(building.id);

        // @ts-ignore // TODO: TYPES
        stats.innerHTML = StatObject.formatDescriptions(
            // @ts-ignore // TODO: TYPES
            building.stats,
            // @ts-ignore // TODO: TYPES
            getElementDescriptionFormatter('div', 'mb-1'),
            // @ts-ignore // TODO: TYPES
            building.providedStatMultiplier.neg,
            // @ts-ignore // TODO: TYPES
            building.providedStatMultiplier.pos
        )
            // @ts-ignore // TODO: TYPES
            .map(element => element.outerHTML)
            .join('');
    }
}

customElements.define('mcs-township', TownshipPage);

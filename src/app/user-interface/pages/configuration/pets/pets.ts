import './pets.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { ButtonImage } from 'src/app/user-interface/_parts/button-image/button-image';
import { StatsController } from 'src/app/user-interface/pages/_parts/out-of-combat-stats/stats-controller';
import { CartographyPage } from 'src/app/user-interface/pages/configuration/cartography/cartography';
import { ModifierHelper } from 'src/shared/utils/modifiers';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-pets': PetsPage;
    }
}

@LoadTemplate('app/user-interface/pages/configuration/pets/pets.html')
export class PetsPage extends HTMLElement {
    private readonly _content = new DocumentFragment();

    private readonly _toggleButton: HTMLButtonElement;
    private readonly _petsContainer: HTMLDivElement;

    private _cartography: CartographyPage;

    private readonly _pets = new Map<string, ButtonImage>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-pets-template'));

        this._toggleButton = getElementFromFragment(this._content, 'mcs-pets-toggle', 'button');
        this._petsContainer = getElementFromFragment(this._content, 'mcs-pets-container', 'div');
    }

    public connectedCallback() {
        this.appendChild(this._content);

        this._cartography = Global.userInterface.main.querySelector('mcs-cartography');

        this._init();
    }

    public disconnnectedCallback() {
        this._petsContainer.innerHTML = '';
        this._pets.clear();
    }

    public _import(petIds: string[]) {
        for (const [petId, element] of this._pets) {
            const pet = Global.game.pets.getObjectByID(petId);

            if (!this._isCombatPet(pet)) {
                this._updatePet(pet, false);
                continue;
            }

            if (pet) {
                const isSelected = petIds.includes(petId);

                element._toggle(isSelected);
                this._updatePet(pet, isSelected);
            }
        }

        StatsController.update();
    }

    public _updateTooltips() {
        for (const [id, element] of this._pets) {
            const pet = Global.game.pets.getObjectByID(id);
            const tooltip = element.querySelector<HTMLDivElement>('.mcs-pet-tooltip');

            if (!pet || !tooltip) {
                continue;
            }

            this._setTooltip(tooltip, pet.name, pet.description);
        }
    }

    private _toggle() {
        if (Global.game.petManager.unlocked.size) {
            this._import([]);
        } else {
            this._import(Global.game.pets.allObjects.map(pet => pet.id));
        }
    }

    private _setTooltip(element: HTMLDivElement, name: string, description: string) {
        element.innerHTML = `<div class="text-warning">${name}<br><small class='text-info'>${description.replace(
            /\.$/,
            ''
        )}</small></div>`;
    }

    private _init() {
        this._toggleButton.onclick = () => this._toggle();

        for (const pet of Global.game.pets.allObjects) {
            if (!this._isCombatPet(pet)) {
                continue;
            }

            const petElement = createElement('mcs-button-image', { attributes: [['data-mcsSrc', pet.media]] });

            const tooltipContent = createElement('div', {
                classList: ['mcs-pet-tooltip'],
                attributes: [['data-mcsTooltipContent', '']]
            });

            this._setTooltip(tooltipContent, pet.name, pet.description);

            petElement.appendChild(tooltipContent);

            petElement._on(isSelected => {
                this._updatePet(pet, isSelected);
                StatsController.update();
            });

            this._pets.set(pet.id, petElement);

            this._petsContainer.appendChild(petElement);
        }
    }

    private _updatePet(pet: Pet, isSelected: boolean) {
        if (isSelected) {
            Global.game.petManager.unlocked.add(pet);
        } else {
            Global.game.petManager.unlocked.delete(pet);
        }

        if (cloudManager.hasAoDEntitlementAndIsEnabled && pet.id === 'melvorAoD:MapMasteryPet') {
            this._cartography?._updateTooltips();
        }
    }

    private _isCombatPet(pet: Pet) {
        return (
            !pet.activeInRaid &&
            (pet.stats.modifiers.some(entry => ModifierHelper.isCombatModifier(entry)) ||
                pet.stats.enemyModifiers?.length)
        );
    }
}

customElements.define('mcs-pets', PetsPage);

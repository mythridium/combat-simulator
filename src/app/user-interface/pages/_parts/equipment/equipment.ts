import './equipment.scss';
import { LoadTemplate } from 'src/app/user-interface/template';
import { Global } from 'src/app/global';
import { EquipmentSlot as MCSEquipmentSlot } from './equipment-slot/equipment-slot';

declare global {
    interface HTMLElementTagNameMap {
        'mcs-equipment': Equipment;
    }
}

export type SlotType =
    | 'Synergy'
    | 'Empty'
    | 'melvorD:Amulet'
    | 'melvorD:Boots'
    | 'melvorD:Cape'
    | 'melvorD:Consumable'
    | 'melvorD:Enhancement1'
    | 'melvorD:Enhancement2'
    | 'melvorD:Enhancement3'
    | 'melvorD:Gem'
    | 'melvorD:Gloves'
    | 'melvorD:Helmet'
    | 'melvorD:Passive'
    | 'melvorD:Platebody'
    | 'melvorD:Platelegs'
    | 'melvorD:Quiver'
    | 'melvorD:Ring'
    | 'melvorD:Shield'
    | 'melvorD:Summon1'
    | 'melvorD:Summon2'
    | 'melvorD:Weapon';

@LoadTemplate('app/user-interface/pages/_parts/equipment/equipment.html')
export class Equipment extends HTMLElement {
    private readonly slots: SlotType[][] = [];

    private readonly _content = new DocumentFragment();

    private readonly _equipmentContainer: HTMLDivElement;
    private readonly _equipmentSlots = new Map<SlotType, MCSEquipmentSlot>();

    constructor() {
        super();

        this._content.append(getTemplateNode('mcs-equipment-template'));

        this._equipmentContainer = getElementFromFragment(this._content, 'mcs-equipment-container', 'div');

        this._create();
    }

    public connectedCallback() {
        this.appendChild(this._content);
    }

    public _update() {
        // @ts-ignore // TODO: TYPES
        for (const slot of Global.game.combat.player.equipment.equippedArray) {
            const element = this._equipmentSlots.get(slot.slot.id);

            if (element) {
                element._set(slot);
            }
        }

        this._equipmentContainer.querySelector('mcs-synergy-slot')._toggle(Global.game.combat.player.isSynergyUnlocked);
    }

    private _create() {
        // @ts-ignore // TODO: TYPES
        const gridSize = EquipmentSlot.getGridSize();
        const numCols = gridSize.cols.max - gridSize.cols.min + 1;
        const numRows = gridSize.rows.max - gridSize.rows.min + 1;
        const colOffset = 1 - gridSize.cols.min;
        const rowOffset = 1 - gridSize.rows.min;
        this._equipmentContainer.style.gridTemplateColumns = `repeat(${numCols}, auto)`;
        this._equipmentContainer.style.gridTemplateRows = `repeat(${numRows}, auto)`;

        // @ts-ignore // TODO: TYPES
        Global.game.equipmentSlots.forEach(slot => {
            const equipmentSlot = createElement('mcs-equipment-slot');

            equipmentSlot.style.gridColumn = `${slot.gridPosition.col + colOffset}`;
            equipmentSlot.style.gridRow = `${slot.gridPosition.row + rowOffset}`;

            if (this.getAttribute('readonly') !== null) {
                equipmentSlot.setAttribute('readonly', '');
            }

            // @ts-ignore // TODO: TYPES
            const equipmentItem = Global.game.combat.player.equipment.equippedItems[slot.id];

            if (equipmentItem) {
                equipmentSlot._set(equipmentItem);
            }

            this._equipmentSlots.set(slot.id, equipmentSlot);
            this._equipmentContainer.appendChild(equipmentSlot);
        });

        const synergy = createElement('mcs-synergy-slot');

        if (this.getAttribute('readonly') !== null) {
            synergy.setAttribute('readonly', '');
        }

        // @ts-ignore // TODO: TYPES
        synergy.style.gridColumn = `${EquipmentSlot.SUMMONING_SYNERGY_POSITION.col + colOffset}`;
        // @ts-ignore // TODO: TYPES
        synergy.style.gridRow = `${EquipmentSlot.SUMMONING_SYNERGY_POSITION.row + rowOffset}`;

        this._equipmentContainer.appendChild(synergy);
    }
}

customElements.define('mcs-equipment', Equipment);

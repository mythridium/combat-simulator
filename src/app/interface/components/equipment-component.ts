import { Source } from 'src/shared/stores/sync.store';
import { ButtonComponent } from './blocks/button-component';
import { Workers } from 'src/app/workers/workers';
import { Global } from 'src/app/global';
import { State } from 'src/app/stores/simulation.store';
import { CardComponent } from './blocks/card-component';

import './equipment-component.scss';

enum Equipment {
    Blank = 'blank',
    Synergy = 'synergy'
}

type EquipmentSlot = Equipment | EquipmentSlots;

export class EquipmentComponent extends CardComponent {
    private readonly equipmentSlots: EquipmentSlot[][] = [
        [EquipmentSlots.Passive, EquipmentSlots.Helmet, EquipmentSlots.Consumable],
        [EquipmentSlots.Cape, EquipmentSlots.Amulet, EquipmentSlots.Quiver],
        [EquipmentSlots.Weapon, EquipmentSlots.Platebody, EquipmentSlots.Shield],
        [
            cloudManager.hasAoDEntitlement ? EquipmentSlots.Gem : Equipment.Blank,
            EquipmentSlots.Platelegs,
            Equipment.Blank
        ],
        [EquipmentSlots.Gloves, EquipmentSlots.Boots, EquipmentSlots.Ring],
        [EquipmentSlots.Summon1, Equipment.Synergy, EquipmentSlots.Summon2]
    ];

    constructor(private readonly workers: Workers) {
        super({ id: 'mcs-equipment' });

        Global.equipment.when(Source.Worker).subscribe(() => this.render());
        Global.simulation.when(Source.Worker).subscribe(({ state, result }) => {
            const simulateButton = this.element.querySelector('#simulate');

            if (!simulateButton) {
                return;
            }

            simulateButton.textContent = this.getSimulateButtonText(state, result.length, 100);

            if (state === State.Cancelling) {
                simulateButton.setAttribute('disabled', 'disabled');
            } else {
                simulateButton.removeAttribute('disabled');
            }
        });
    }

    protected preRender(container: Element) {
        const equipment = document.createElement('div');
        equipment.className = 'mcs-equipment-items';

        for (const row of this.equipmentSlots) {
            const equipmentRow = document.createElement('div');
            equipmentRow.className = 'mcs-equipment-row';

            for (const slot of row) {
                const equipmentSlot = document.createElement('div');
                equipmentSlot.className = 'mcs-equipment-slot';

                if (this.isEquipmentSlots(slot)) {
                    const img = document.createElement('img');
                    img.src = `assets/media/bank/${
                        equipmentSlotData[EquipmentSlots[slot] as SlotTypes].emptyMedia
                    }.png`;
                    img.className =
                        'combat-equip-img border border-2x border-rounded-equip border-combat-outline p-1 m-1 pointer-enabled';
                    // @ts-ignore
                    tippy(img, {
                        content: EquipmentSlots[slot]
                    });
                    equipmentSlot.append(img);
                }

                if (slot === Equipment.Blank) {
                    const blank = document.createElement('div');
                    blank.className = 'blank combat-equip-img p-1 m-1';
                    equipmentSlot.append(blank);
                }

                if (slot === Equipment.Synergy) {
                    const synergy = document.createElement('div');
                    synergy.className = 'synergy combat-equip-img p-1 m-1';
                    equipmentSlot.append(synergy);
                }

                equipmentRow.append(equipmentSlot);
            }

            equipment.append(equipmentRow);
        }

        const button = new ButtonComponent({
            id: 'test',
            content: 'Test',
            onClick: () => {
                Global.equipment.setState(Source.Interface, { equipmentIds: ['123'] });
                Global.configuration.setState(Source.Interface, { isManualEating: true });
            }
        });

        const { state, result } = Global.simulation.getState();

        const simulateButton = new ButtonComponent({
            id: 'simulate',
            content: this.getSimulateButtonText(state, result.length, 100),
            disabled: state === State.Cancelling,
            onClick: async () => {
                const { state } = Global.simulation.getState();

                if (state === State.Cancelling) {
                    return;
                }

                if (state === State.Running) {
                    this.workers.queue?.cancel();
                    return;
                }

                const requests = new Array(100)
                    .fill(0)
                    .map((_, index) => ({ monsterId: `Monster ${index}`, dungeonId: `Dungeon ${index}` }));

                this.workers.simulate(requests);
            }
        });

        this.append(equipment, button, simulateButton);

        super.preRender(container);
    }

    private getSimulateButtonText(state: State, count: number, total: number) {
        switch (state) {
            case State.Cancelling:
                return `Cancelling (${count}/${total})`;
            case State.Running:
                return `Simulating (${count}/${total})`;
            case State.Stopped:
                return 'Simulate';
        }
    }

    private isEquipmentSlots(slot: EquipmentSlot): slot is EquipmentSlots {
        return Object.values(EquipmentSlots).includes(<EquipmentSlots>slot);
    }
}

import './attack-style.scss';
import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { DropdownComponent } from 'src/app/interface/components/blocks/dropdown-component';
import { Source } from 'src/shared/stores/sync.store';

export class AttackStyleComponent extends BaseComponent {
    constructor() {
        super({ id: 'mcs-attack-styles-container', tag: 'div', classes: ['w-100', 'mt-1'] });
    }

    protected init() {
        Global.equipment.subscribe(() => this.render());
    }

    protected preRender(container: HTMLElement): void {
        const combatStyles = new DropdownComponent({
            id: 'mcs-attack-styles',
            options: this.getOptions(),
            label: 'Attack Style',
            default: () => Global.configuration.state.attackStyle,
            onChange: option => {
                Global.configuration.setState(Source.Interface, { attackStyle: option.value });
            }
        });

        this.append(combatStyles);

        super.preRender(container);
    }

    private getOptions() {
        let attackType: AttackType = 'melee';

        const weaponData = Global.equipment.state.equipment.find(equipment => equipment.slot === 'Weapon');
        const weapon = game.items.weapons.getObjectByID(weaponData?.id);

        if (weapon) {
            attackType = weapon.attackType;
        }

        return game.attackStyles
            .filter(attackStyle => attackStyle.attackType === attackType)
            .map(attackStyle => ({ text: attackStyle.name, value: attackStyle.id }));
    }
}

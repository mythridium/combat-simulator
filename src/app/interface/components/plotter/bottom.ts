import './bottom.scss';
import { Global } from 'src/app/global';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { MonsterInformation } from 'src/app/stores/selected-bar.store';

export class BottomComponent extends BaseComponent {
    constructor() {
        super({ tag: 'div', id: 'mcs-plotter-bottom' });
    }

    protected preRender(container: HTMLElement): void {
        for (const monster of Global.simEntities.monsters) {
            this.append(new EntityComponent(monster));
        }

        for (const dungeon of Global.simEntities.dungeons) {
            this.append(new EntityComponent(dungeon));
        }

        for (const task of Global.simEntities.tasks) {
            this.append(new EntityComponent(task));
        }

        super.preRender(container);
    }
}

class EntityComponent extends BaseComponent {
    constructor(private readonly monster: MonsterInformation) {
        super({ tag: 'div', id: 'mcs-plotter-entity' });
    }

    protected preRender(container: HTMLElement): void {
        this.append(document.element({ tag: 'img', src: this.monster.media, lazy: true }));
        this.append(document.element({ tag: 'img', src: '', classes: ['d-none'], lazy: true }));

        super.preRender(container);
    }
}

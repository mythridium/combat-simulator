import './plotter.scss';
import { BaseComponent } from 'src/app/interface/components/blocks/base-component';
import { CardComponent } from 'src/app/interface/components/blocks/card-component';
import { FilterComponent } from './filter';
import { TopComponent } from './top';
import { BottomComponent } from './bottom';

export class PlotterComponent extends BaseComponent {
    constructor() {
        super({ tag: 'div', id: 'mcs-plotter' });
    }

    protected preRender(_container: HTMLElement): void {
        this.append(new FilterComponent());

        const container = document.element({ tag: 'div', classes: ['mcs-plotter-container', 'p-3'] });

        const top = new TopComponent();
        const bottom = new BottomComponent();

        container.append(top, bottom);

        const card = new CardComponent({ id: 'mcs-plotter-card', classes: ['w-100', 'p-2'], withoutSpacing: true });

        card.append(container);
        this.append(card);

        super.preRender(_container);
    }
}

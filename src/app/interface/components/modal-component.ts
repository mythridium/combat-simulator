import { BaseComponent } from 'src/app/interface/components/blocks/base-component';

export interface ModalOptions {
    title: string;
    id: string;
}

export class ModalComponent extends BaseComponent {
    private readonly url = 'https://github.com/mythridium/combat-simulator/issues';

    constructor(private readonly options: ModalOptions) {
        super({
            id: options.id,
            tag: 'div',
            classes: ['modal']
        });
    }

    protected preRender(container: Element) {
        super.preRender(container);

        const modal = document.createElement('div');
        modal.className = 'modal-dialog';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="block block-themed block-transparent mb-2">
                        <div class="block-header pl-4 pb-1">
                            <h3 class="block-title">${this.options.title}</h3>

                            <div class="block-options">
                                <button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
                                    <i class="fa fa-fw fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <div class="pl-4 pb-2 pt-2 bug-report">Please submit all bugs/feedback on <a href="${this.url}" target="_blank">Github</a>.</div>
                    </div>
                </div>
            </div>
        `;

        const content = modal.querySelector('.modal-content');
        content.append(this['fragment']);

        this['fragment'].append(modal);
    }
}

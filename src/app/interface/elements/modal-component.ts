import { BaseComponent } from 'src/app/interface/components/base-component';

export interface ModalOptions {
    title: string;
    id: string;
}

export class ModalComponent extends BaseComponent {
    constructor(private readonly options: ModalOptions) {
        super({
            id: options.id,
            tag: 'div',
            classes: ['modal']
        });
    }

    protected construct(): Element {
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        const content = document.createElement('div');
        content.className = 'modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'block block-themed block-transparent mb-0';
        modalHeader.innerHTML = `
                <div class="block-header bg-primary-dark pl-4 pb-1">
                    <h3 class="block-title">${this.options.title}</h3>

                    <div class="block-options">
                        <button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
                            <i class="fa fa-fw fa-times"></i>
                        </button>
                    </div>
                </div>
                `;

        content.append(modalHeader);
        content.append(this.fragment);
        dialog.append(content);

        this.fragment.append(dialog);

        return super.construct();
    }
}

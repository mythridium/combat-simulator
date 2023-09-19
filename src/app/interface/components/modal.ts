export class Modal {
    private readonly title = '[Myth] Combat Simulator';
    private fragment = new DocumentFragment();

    constructor(private readonly elementId: string) {}

    public append(...nodes: (string | Node)[]) {
        this.fragment.append(...nodes);
    }

    public construct() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        const content = document.createElement('div');
        content.className = 'modal-content';

        const modalHeader = $(`
            <div class="block block-themed block-transparent mb-0">
                <div class="block-header bg-primary-dark pl-4 pb-1">
                    <h3 class="block-title">${this.title}</h3>

                    <div class="block-options">
                        <button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
                            <i class="fa fa-fw fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
            `);

        content.append(modalHeader[0]);
        content.append(this.fragment);

        dialog.appendChild(content);

        const modal = document.createElement('div');
        modal.id = this.elementId;
        modal.className = 'modal';

        modal.append(dialog);

        document.getElementById('page-container')!.appendChild(modal);
    }
}

import type { Dialog } from './dialog';

export abstract class DialogController {
    public static get isOpen() {
        return this.current !== undefined;
    }

    private static readonly queue: Dialog[] = [];
    private static current?: Dialog;

    public static open(dialog: Dialog) {
        if (this.isOpen) {
            this.queue.push(dialog);
            return;
        }

        this.current = dialog;
        this.current.classList.add('is-open');
        document.getElementById('mcs-dialog-backdrop').classList.add('is-open');
    }

    public static close() {
        if (!this.isOpen) {
            return;
        }

        this.current.classList.remove('is-open');
        this.current = undefined;
        document.getElementById('mcs-dialog-backdrop').classList.remove('is-open');

        if (this.queue.length) {
            this.open(this.queue.shift());
        }
    }
}

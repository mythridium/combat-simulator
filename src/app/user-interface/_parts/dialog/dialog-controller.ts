import { Global } from 'src/app/global';
import type { Dialog } from './dialog';

type Callback = () => void;

export abstract class DialogController {
    public static get isOpen() {
        return this.current !== undefined;
    }

    private static readonly queue: { dialog: Dialog; callback?: Callback; allowBackdropClose: boolean }[] = [];
    private static current?: { dialog: Dialog; callback?: Callback; allowBackdropClose: boolean };

    public static open(dialog: Dialog, callback: Callback = undefined, allowBackdropClose = true) {
        if (this.isOpen) {
            this.queue.push({ dialog, callback, allowBackdropClose });
            return;
        }

        this.current = { dialog, callback, allowBackdropClose };
        this.current.dialog.classList.add('is-open');
        document.getElementById('mcs-dialog-backdrop').classList.add('is-open');
    }

    public static close() {
        if (!this.isOpen) {
            return;
        }

        if (this.current.callback) {
            try {
                this.current.callback();
            } catch (error) {
                Global.logger.error(`Failed to execute dialog callback.`, error);
            }
        }

        this.current.dialog.classList.remove('is-open');
        this.current = undefined;
        document.getElementById('mcs-dialog-backdrop').classList.remove('is-open');

        if (this.queue.length) {
            const { dialog, callback, allowBackdropClose } = this.queue.shift();

            this.open(dialog, callback, allowBackdropClose);
        }
    }
}

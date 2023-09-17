import domino from 'domino';

declare global {
    interface Worker {
        window: Window;
        document: Document;
        MouseEvent: MouseEvent;
        HTMLElement: HTMLElement;
        checkFileVersion: (version: string) => boolean;
    }
}

declare module 'domino' {
    const impl: {
        HTMLElement: HTMLElement;
    };
}

class StorageMock {
    private data: { [index: string]: string } = {};

    public getItem(key: string) {
        return this.data[key];
    }

    public setItem(key: string, value: string) {
        this.data[key] = value;
    }

    public removeItem(key: string) {
        this.data[key] = null;
    }
}

/** this class mocks necessary requirements to get the game loading in the web worker */
export abstract class WorkerMock {
    public static mock(worker: Worker) {
        this.mockBrowser(worker);
        this.mockMelvor(worker);
        this.mockJQuery();
        this.mockSteam();
    }

    private static mockBrowser(worker: Worker) {
        worker.window = domino.createWindow('<div></div>', `https://melvoridle.com/index_game.php`);
        worker.document = worker.window.document;

        const window = <any>worker.window;
        const sself = <any>self;

        sself.localStorage = window.localStorage = new StorageMock();
        sself.sessionStorage = window.sessionStorage = new StorageMock();
        sself.customElements = window.customElements = {
            define: () => {}
        };

        // classes
        worker.MouseEvent = MouseEvent;
        worker.HTMLElement = domino.impl.HTMLElement;
    }

    private static mockMelvor(worker: Worker) {
        worker.checkFileVersion = () => true;
    }

    private static mockJQuery() {
        const jQuery = () => ({
            on: () => {}
        });

        (<any>self).$ = jQuery;
    }

    private static mockSteam() {
        (<any>self).parent = {};
    }
}

class MouseEvent {}

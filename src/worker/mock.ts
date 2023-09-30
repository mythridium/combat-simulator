import domino from 'domino';
import { Global } from './global';

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
    public static mock() {
        this.mockBrowser();
        this.mockMelvor();
        this.mockJQuery();
        this.mockSteam();
    }

    private static mockBrowser() {
        Global.this.window = domino.createWindow('<div></div>', `https://melvoridle.com/index_game.php`) as any;
        Global.this.document = Global.this.window.document;

        const _createElement = Global.this.document.createElement;

        Global.this.document.createElement = function (tagName: string, options?: ElementCreationOptions) {
            const element: any = _createElement(tagName, options);

            element.append = element.appendChild;
            element.style = {};
            element.ownerDocument = window.document;
            Object.defineProperty(element, 'insertBefore', {
                value: () => {}
            });

            return element;
        };

        Global.this.localStorage = Global.this.window.localStorage = new StorageMock() as any;
        Global.this.sessionStorage = Global.this.window.sessionStorage = new StorageMock() as any;
        Global.this.customElements = Global.this.window.customElements = { define: () => {} } as any;

        Global.this.MouseEvent = <any>MouseEvent;
        Global.this.HTMLElement = <any>domino.impl.HTMLElement;
    }

    private static mockMelvor() {
        Global.this.checkFileVersion = () => true;
        Global.this.playFabManager = { retrieve: async () => {} };
    }

    private static mockJQuery() {
        const jQuery = () => ({
            on: () => {}
        });

        Global.this.$ = jQuery as any;
    }

    private static mockSteam() {
        Global.this.parent = {} as any;
    }
}

class MouseEvent {}

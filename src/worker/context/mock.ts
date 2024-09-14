import { Global } from 'src/worker/global';

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
    public static init() {
        this.mockBrowser();
        this.mockMelvor();
    }

    private static mockBrowser() {
        Global.this.customElements = { define: () => {} } as any;

        Global.this.document = {
            getElementById: () => ({}),
            querySelector: () => ({}),
            querySelectorAll: (): any[] => []
        } as any;

        Global.this.window = {
            customElements: Global.this.customElements,
            localStorage: new StorageMock(),
            sessionStorage: new StorageMock(),
            setInterval: Global.this.setInterval.bind(Global.this),
            setTimeout: Global.this.setTimeout.bind(Global.this),
            clearTimeout: Global.this.clearTimeout.bind(Global.this),
            matchMedia: () => {
                return {
                    addEventListener: () => {},
                    removeEventListener: () => {}
                };
            }
        } as any;

        Global.this.localStorage = Global.this.window.localStorage;
        Global.this.sessionStorage = Global.this.window.sessionStorage;

        Global.this.HTMLElement = Global.this.DocumentFragment = class {
            appendChild: () => {};
        } as any;

        Global.this.Swal = {
            mixin: () => {
                return {
                    fire: () => {}
                };
            }
        } as any;

        Global.this.tippy = (() => {}) as any;

        (<any>Global.this.tippy).setDefaultProps = () => {};

        const jQuery = () => ({
            on: () => {},
            modal: () => {}
        });

        Global.this.$ = jQuery as any;
        Global.this.parent = {} as any;
    }

    private static mockMelvor() {
        Global.this.checkFileVersion = () => true;
        Global.this.playFabManager = { retrieve: async () => {} };
    }
}

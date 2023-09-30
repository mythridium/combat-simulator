declare global {
    interface WorkerGlobalScope {
        window: Window;
        document: Document;
        MouseEvent: MouseEvent;
        HTMLElement: HTMLElement;
        checkFileVersion: (version: string) => boolean;
        playFabManager: any;
        $: JQuery;
        parent: {};
    }
}

declare module 'domino' {
    const impl: {
        HTMLElement: HTMLElement;
    };
}

export {};

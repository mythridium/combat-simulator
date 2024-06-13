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

export {};

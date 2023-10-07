declare global {
    interface ElementOptions<K extends keyof HTMLElementTagNameMap> {
        tag: K;
        id?: string;
        classes?: string[];
        innerHTML?: string;
    }

    interface Document {
        element: <K extends keyof HTMLElementTagNameMap>(options: ElementOptions<K>) => HTMLElementTagNameMap[K];
    }
}

document.element = <K extends keyof HTMLElementTagNameMap>(options: ElementOptions<K>): HTMLElementTagNameMap[K] => {
    const element = document.createElement(options.tag) as Element;

    if (options.id) {
        element.id = options.id;
    }

    if (options.classes?.length) {
        element.className = options.classes.join(' ');
    }

    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }

    return element;
};

export {};

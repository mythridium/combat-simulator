declare global {
    interface ElementOptions {
        tag: string;
        classes?: string[];
    }

    interface Document {
        element: (options: ElementOptions) => Element;
    }
}

document.element = (options: ElementOptions) => {
    const element = document.createElement(options.tag);

    if (options.classes) {
        element.className = options.classes.join(' ');
    }

    return element;
};

export {};

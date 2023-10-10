export abstract class ImageLoader {
    private static isLoading = false;
    private static readonly queue: [HTMLImageElement, string][] = [];

    public static async register(element: HTMLImageElement, src: string) {
        this.queue.push([element, src]);

        if (!this.isLoading) {
            this.isLoading = true;
            this.load();
        }
    }

    private static async load() {
        const next = this.queue.shift();

        if (next) {
            const [element, src] = next;

            try {
                await new Promise(resolve => {
                    element.onload = resolve;
                    element.onerror = resolve;
                    element.src = src;
                });
            } catch {}

            setTimeout(() => this.load());
        } else {
            this.isLoading = false;
        }
    }
}

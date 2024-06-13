export abstract class ImageLoader {
    private static readonly queue: [HTMLImageElement, string][] = [];
    private static readonly runners: QueueRunner[] = [];

    public static register(element: HTMLImageElement, src: string) {
        this.setup();

        if (!element.src) {
            element.style.visibility = 'hidden';
        }

        this.queue.push([element, src]);

        const available = this.runners.find(runner => !runner.isRunning);

        if (available) {
            available.load();
        }
    }

    private static setup() {
        if (!this.runners.length) {
            for (let i = 0; i < 10; i++) {
                this.runners.push(new QueueRunner(() => this.queue.shift()));
            }
        }
    }
}

class QueueRunner {
    public isRunning = false;

    constructor(private readonly nextFactory: () => [HTMLImageElement, string]) {}

    public async load() {
        this.isRunning = true;
        const next = this.nextFactory();

        if (next) {
            const [element, src] = next;

            try {
                element.decoding = 'async';
                //if (!element.src || element.src === src) {
                element.src = src;
                await element.decode();
                //}
            } catch {
            } finally {
                element.style.clipPath = '';
                element.style.visibility = '';
            }

            setTimeout(() => this.load());
        } else {
            this.isRunning = false;
        }
    }
}

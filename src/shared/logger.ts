export enum Color {
    Pink = 'color: #f5a6ce;',
    Green = 'color: #5cb568;'
}

export class Logger {
    private prefix: string;

    constructor(private entity: string, private readonly color: Color) {
        this.setEntity(this.entity);
    }

    public setEntity(entity: string) {
        this.entity = entity;
        this.prefix = `[Myth] CS - ${this.entity} |`;
    }

    public verbose(...args: any[]) {
        if (!self.mcs.isVerbose) {
            return;
        }

        this.log(...args);
    }

    public debug(...args: any[]) {
        console.debug('%c%s', this.color, this.prefix, ...args);
    }

    public log(...args: any[]) {
        console.log('%c%s', this.color, this.prefix, ...args);
    }

    public warn(...args: any[]) {
        console.warn('%c%s', this.color, this.prefix, ...args);
    }

    public error(...args: any[]) {
        console.error('%c%s', this.color, this.prefix, ...args);
    }
}

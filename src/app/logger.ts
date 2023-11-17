export enum Color {
    Pink = 'color: #f5a6ce;',
    Green = 'color: #5cb568;'
}

export class Logger {
    private prefix: string;

    public debug: (...args: any[]) => void;
    public log: (...args: any[]) => void;
    public warn: (...args: any[]) => void;
    public error: (...args: any[]) => void;
    public verbose: (...args: any[]) => void;

    constructor(private entity: string, private readonly color: Color, private readonly isVerbose: boolean) {
        this.setEntity(this.entity);
        this.bind();
    }

    public setEntity(entity: string) {
        this.entity = entity;
        this.prefix = `[Myth] CS - ${this.entity} |`;

        this.bind();
    }

    private bind() {
        this.debug = Function.prototype.bind.call(console.debug, console, `%c%s`, this.color, this.prefix);
        this.log = Function.prototype.bind.call(console.log, console, `%c%s`, this.color, this.prefix);
        this.warn = Function.prototype.bind.call(console.warn, console, `%c%s`, this.color, this.prefix);
        this.error = Function.prototype.bind.call(console.error, console, `%c%s`, this.color, this.prefix);
        this.verbose = this.isVerbose
            ? Function.prototype.bind.call(console.log, console, `%c%s`, this.color, this.prefix)
            : () => {};
    }
}

import { mcs } from './constants';

export enum Color {
    Pink = 'color: #f5a6ce;',
    Green = 'color: #5cb568;'
}

export interface LoggerOptions {
    entity: string;
    color: Color;
}

export class Logger {
    private prefix: string;

    public debug: (...args: any[]) => void;
    public log: (...args: any[]) => void;
    public warn: (...args: any[]) => void;
    public error: (...args: any[]) => void;
    public verbose: (...args: any[]) => void;

    constructor(private options: LoggerOptions) {
        this.set(this.options);
    }

    public set(options: Partial<LoggerOptions>) {
        this.options = { ...this.options, ...options };
        this.prefix = `[Myth] CS - ${this.options.entity} |`;

        this.bind();
    }

    private bind() {
        this.debug = Function.prototype.bind.call(console.debug, console, `%c%s`, this.options.color, this.prefix);
        this.log = Function.prototype.bind.call(console.log, console, `%c%s`, this.options.color, this.prefix);
        this.warn = Function.prototype.bind.call(console.warn, console, `%c%s`, this.options.color, this.prefix);
        this.error = Function.prototype.bind.call(console.error, console, `%c%s`, this.options.color, this.prefix);
        this.verbose = mcs.isVerbose
            ? Function.prototype.bind.call(console.log, console, `%c%s`, this.options.color, this.prefix)
            : () => {};
    }
}

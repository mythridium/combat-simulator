import { MessageAction, MessageRequest, MessageReturn } from 'src/shared/messages/message';
import { WebWorker } from './web-worker';

export class TaskRunner {
    constructor(private readonly worker: WebWorker) {}

    public async execute<TAction extends MessageAction>(task: Task<TAction>) {
        const data = task.get();
        const result = await this.worker.send<TAction>(data);

        task.finish(result);
    }
}

export class Task<TAction extends MessageAction> {
    public result: MessageReturn<TAction>;
    public inQueue = false;
    public isFinished = false;

    constructor(public readonly request: MessageRequest<TAction>) {}

    public get() {
        this.inQueue = true;
        return this.request;
    }

    public finish(result: MessageReturn<TAction>) {
        this.inQueue = false;
        this.isFinished = true;
        this.result = result;
    }
}

export class Queue<TAction extends MessageAction> {
    public isRunning = false;

    private cancelled = false;

    constructor(private readonly runners: TaskRunner[], private readonly tasks: Task<TAction>[]) {}

    public cancel() {
        this.cancelled = true;
    }

    public async run(onTaskComplete?: (task: Task<TAction>) => void) {
        this.isRunning = true;

        await Promise.all(this.runners.map(runner => this.execute(runner, onTaskComplete)));

        this.isRunning = false;
    }

    private async execute(runner: TaskRunner, onTaskComplete?: (task: Task<TAction>) => void) {
        const task = this.next();

        if (!task) {
            return;
        }

        await runner.execute(task);

        if (onTaskComplete) {
            onTaskComplete(task);
        }

        await this.execute(runner, onTaskComplete);
    }

    private next() {
        if (this.cancelled) {
            return;
        }

        return this.tasks.find(task => !task.inQueue && !task.isFinished);
    }
}

import { Logger } from 'src/shared/logger';
import { MessageData, MessageAction } from './message-data';
import { AcknowledgeMessageData } from './messages/acknowledge';

export class Messages {
    private static id = 0;
    private readonly messages = new Map<number, [Function, Function]>();

    constructor(private readonly self: Window | Worker, private readonly logger: Logger) {}

    public async send(data: Omit<MessageData, 'id'>) {
        this.logger.verbose(`Sending message`, data);

        return new Promise((resolve, reject) => {
            this.messages.set(++Messages.id, [resolve, reject]);
            this.self.postMessage({ id: Messages.id, ...data });
        });
    }

    public on(callback: (data: MessageData) => Promise<void>) {
        this.self.onmessage = async (event: MessageEvent<MessageData>) => {
            this.logger.verbose(`Received message`, event.data);

            if (event.data.action === MessageAction.Acknowledge) {
                this.onAcknowledge(event.data);
                return;
            }

            await this.onMessage(callback, event.data);
        };
    }

    private acknowledge(message: AcknowledgeMessageData) {
        const response: AcknowledgeMessageData = {
            action: MessageAction.Acknowledge,
            id: message.id,
            data: {
                isSuccess: message.data.isSuccess
            }
        };

        if (message.data.error) {
            response.data.error = message.data.error;
        }

        this.logger.verbose(`Acknowledged message`, response);
        this.self.postMessage(response);
    }

    private onAcknowledge(message: AcknowledgeMessageData) {
        const [resolve, reject] = this.messages.get(message.id);

        if (!resolve || !reject) {
            this.logger.error(`Received acknowledgement for a message that does not exist`, '\n\n', message);
            return;
        }

        if (message.data.isSuccess) {
            resolve(message.data);
        } else {
            reject(message.data.error ?? `An unknown error occurred`);
        }
    }

    private async onMessage(callback: (data: MessageData) => Promise<void>, message: MessageData) {
        let isSuccess: boolean;
        let error: any;

        try {
            await callback(message);
            isSuccess = true;
        } catch (exception) {
            isSuccess = false;
            error = exception?.message ?? `An unknown error occurred`;
            this.logger.error(message, '\n\n', exception);
        } finally {
            const response: AcknowledgeMessageData = {
                id: message.id,
                action: MessageAction.Acknowledge,
                data: {
                    isSuccess
                }
            };

            if (error) {
                response.data.error = error;
            }

            this.acknowledge(response);
        }
    }
}

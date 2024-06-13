import { Logger } from 'src/shared/logger';
import {
    MessageRequest,
    MessageReturn,
    MessageAction,
    RequestData,
    MessageCallback,
    MessageRequestWithId,
    AcknowledgeResponse,
    AcknowledgeError
} from './message';

export interface Messages {
    send(message: MessageRequest<MessageAction.Init>): Promise<MessageReturn<MessageAction.Init>>;
}

export class Transport {
    public static id = -1;

    private readonly messages = new Map<number, [Function, Function]>();
    private readonly registrations = new Map<MessageAction, MessageCallback<any>>();

    constructor(
        private readonly self: Worker | (WorkerGlobalScope & typeof globalThis),
        private readonly logger: Logger
    ) {
        this.listen();
    }

    public async send<K extends MessageAction>(message: MessageRequest<K>): Promise<MessageReturn<K>> {
        this.logger.verbose('Sending message', message);

        return new Promise((resolve, reject) => {
            this.messages.set(++Transport.id, [resolve, reject]);
            this.self.postMessage({ id: Transport.id, ...message });
        });
    }

    public on<K extends MessageAction>(action: K, callback: (data: RequestData[K]) => Promise<MessageReturn<K>>) {
        if (this.registrations.has(action)) {
            throw new Error(
                `Listener for '${action}' has already been registered. Only one listener per action is allowed.`
            );
        }

        this.registrations.set(action, callback);
    }

    private listen() {
        this.self.onmessage = async (event: MessageEvent<MessageRequestWithId<any>>) => {
            this.logger.verbose('Received message', event.data);

            if (this.isAcknowledgement(event.data)) {
                this.onAcknowledge(event.data);
                return;
            }

            await this.onMessage(event.data);
        };
    }

    private onAcknowledge(message: AcknowledgeResponse<unknown>) {
        if (!this.messages.has(message.id)) {
            this.logger.error(`[ID] Received acknowledgement for a message that does not exist`, '\n\n', message);
            return;
        }

        const [resolve, reject] = this.messages.get(message.id);

        if (!resolve || !reject) {
            this.logger.error(`[R/R] Received acknowledgement for a message that does not exist`, '\n\n', message);
            return;
        }

        this.messages.delete(message.id);

        if (!message.error) {
            resolve(message.result);
        } else {
            reject(message.error ?? { message: `An unknown error occurred` });
        }
    }

    private async onMessage<K extends MessageAction>(message: MessageRequestWithId<K>) {
        let result: RequestData[K];
        let error: AcknowledgeError;

        try {
            const registration = this.registrations.get(message.action);

            result = await registration(message.data);
        } catch (exception) {
            error = { message: exception?.message ?? `An unknown error occurred`, stack: exception?.stack };
            this.logger.error(message, '\n\n', exception);
        } finally {
            const response: AcknowledgeResponse<RequestData[K]> = {
                isAcknowledge: true,
                id: message.id
            };

            if (result) {
                response.result = result;
            }

            if (error) {
                response.error = error;
            }

            this.logger.verbose(`Acknowledged message`, response);
            this.self.postMessage(response);
        }
    }

    private isAcknowledgement<K extends MessageAction>(
        message: MessageRequestWithId<K> | AcknowledgeResponse<unknown>
    ): message is AcknowledgeResponse<unknown> {
        return (<AcknowledgeResponse<unknown>>message).isAcknowledge !== undefined;
    }
}

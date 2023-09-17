import { AcknowledgeMessageData } from './messages/acknowledge';
import { ScriptsMessageData } from './messages/scripts';

export enum MessageAction {
    Acknowledge = 'ack',
    Scripts = 'scripts'
}

export type MessageData = { [K in MessageAction]: MessageDataMapping[K] }[MessageAction];

export interface BaseMessageData<TData> {
    id: number;
    action: MessageAction;
    data: TData;
}

interface MessageDataMapping {
    [MessageAction.Acknowledge]: AcknowledgeMessageData;
    [MessageAction.Scripts]: ScriptsMessageData;
}

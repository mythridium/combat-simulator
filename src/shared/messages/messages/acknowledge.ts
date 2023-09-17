import { MessageAction, BaseMessageData } from 'src/shared/messages/message-data';

export interface AcknowledgeData {
    isSuccess: boolean;
    error?: any;
}

export interface AcknowledgeMessageData extends BaseMessageData<AcknowledgeData> {
    action: MessageAction.Acknowledge;
}

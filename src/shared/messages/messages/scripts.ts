import { MessageAction, BaseMessageData } from 'src/shared/messages/message-data';

export interface ScriptsData {
    scripts: string[];
    workerId: number;
}

export interface ScriptsMessageData extends BaseMessageData<ScriptsData> {
    action: MessageAction.Scripts;
}
